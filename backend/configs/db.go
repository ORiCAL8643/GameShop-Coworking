package configs

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"example.com/sa-gameshop/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

// cache id บทบาทหลัก ใช้ตอนสมัครสมาชิก/ตรวจสิทธิ์
var (
	adminRoleID uint
	userRoleID  uint
)

// ใช้เพื่อดึง *gorm.DB ไปใช้ที่อื่น
func DB() *gorm.DB { return db }

func ConnectionDB() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "gameshop-community.db"
	}
	log.Printf("[DB] using sqlite at: %s", dbPath)

	// ปิดการสร้าง Foreign Key ตอน migrate เพื่อกัน GORM ไปแตะตารางเดิมของเพื่อน
	gormCfg := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	}

	// ✅ ใส่ busy_timeout 5 วิ กัน database locked
	database, err := gorm.Open(sqlite.Open(dbPath+"?_busy_timeout=5000"), gormCfg)
	if err != nil {
		log.Fatal("failed to connect database: ", err)
	}
	db = database

	// ✅ เปิด WAL mode เพื่อให้เขียนพร้อมกันได้มากขึ้น
	db.Exec("PRAGMA journal_mode=WAL;")
	db.Exec("PRAGMA synchronous=NORMAL;")

	// ✅ เปิดใช้ FK runtime (แค่ตอนใช้งาน ไม่เกี่ยวกับตอน migrate)
	db.Exec("PRAGMA foreign_keys = ON")
}

// ---------- Exported helpers ----------

// ใช้ใน handler สมัครสมาชิก: ให้ role เริ่มต้นเป็น “User”
func UserRoleID() uint  { return userRoleID }
func AdminRoleID() uint { return adminRoleID }

// ---------- Local helpers ----------

// เช็คว่ามีตารางอยู่ไหม
func tableExists(name string) bool {
	var cnt int64
	if err := db.Raw(
		`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name = ?`, name,
	).Scan(&cnt).Error; err != nil {
		return false
	}
	return cnt > 0
}

// หา/สร้าง role ตามชื่อ (idempotent)
func getOrCreateRole(title, desc string) (entity.Role, error) {
	var r entity.Role
	if err := db.Where("title = ?", title).First(&r).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			r = entity.Role{Title: title, Description: desc}
			if err := db.Create(&r).Error; err != nil {
				return r, err
			}
			return r, nil
		}
		return r, err
	}
	return r, nil
}

// หา/สร้าง permission ตาม key (slug)
// หากมีข้อมูลเดิมที่ใช้ title เป็น key จะอัปเดตให้เป็นฟอร์แมตใหม่
func ensurePermission(key, title, desc string) (entity.Permission, error) {
	var p entity.Permission

	// ลองค้นหาจาก key ก่อน (ฟอร์แมตใหม่)
	if err := db.Where("key = ?", key).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// รองรับฟอร์แมตเก่า: ใช้ title เป็น key
			if err := db.Where("title = ?", key).First(&p).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					p = entity.Permission{Key: key, Title: title, Description: desc}
					if err := db.Create(&p).Error; err != nil {
						return p, err
					}
					return p, nil
				}
				return p, err
			}

			updates := map[string]interface{}{"key": key}
			if p.Title == key {
				updates["title"] = title
			}
			if p.Description == "" && desc != "" {
				updates["description"] = desc
			}
			if err := db.Model(&p).Updates(updates).Error; err != nil {
				return p, err
			}
			return p, nil
		}
		return p, err
	}

	// อัปเดต title/description หากยังว่าง
	updates := map[string]interface{}{}
	if p.Title == "" && title != "" {
		updates["title"] = title
	}
	if p.Description == "" && desc != "" {
		updates["description"] = desc
	}
	if len(updates) > 0 {
		db.Model(&p).Updates(updates)
	}
	return p, nil
}

// ผูก permission ให้ role ถ้ายังไม่มี
func ensureRoleHasPermission(roleID, permID uint) error {
	var rp entity.RolePermission
	if err := db.Where("role_id = ? AND permission_id = ?", roleID, permID).First(&rp).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return db.Create(&entity.RolePermission{RoleID: roleID, PermissionID: permID}).Error
		}
		return err
	}
	return nil
}

// แก้ค่าซ้ำ/ว่างของ users.username / users.email ให้ผ่าน unique ก่อน AutoMigrate(&User{})
func fixUserUniqBeforeMigrate() error {
	// ถ้ายังไม่มีตาราง users ก็ไม่มีอะไรต้องทำ
	if !tableExists("users") {
		return nil
	}

	// -------- Username --------
	// ตั้งค่า username ที่ว่าง/NULL ให้เป็น user_<id>
	if err := db.Exec(`
		UPDATE users
		SET username = printf('user_%d', id)
		WHERE username IS NULL OR trim(username) = ''
	`).Error; err != nil {
		return err
	}

	// จัดการ username ที่ซ้ำ: คงตัวแรกไว้, ที่เหลือเติม _<id>
	type RowU struct {
		ID       uint
		Username string
	}
	type DupU struct {
		Username string
		C        int64
	}
	var dupU []DupU
	if err := db.Raw(`
		SELECT username, COUNT(*) AS C
		FROM users
		GROUP BY username
		HAVING C > 1
	`).Scan(&dupU).Error; err != nil {
		return err
	}
	for _, d := range dupU {
		var rows []RowU
		if err := db.Raw(`
			SELECT id, username
			FROM users
			WHERE username = ?
			ORDER BY id ASC
		`, d.Username).Scan(&rows).Error; err != nil {
			return err
		}
		for i := 1; i < len(rows); i++ {
			newU := fmt.Sprintf("%s_%d", rows[i].Username, rows[i].ID)
			if err := db.Model(&entity.User{}).
				Where("id = ?", rows[i].ID).
				Update("username", newU).Error; err != nil {
				return err
			}
		}
	}

	// -------- Email --------
	// ทำอีเมลให้เป็น lower-case + trim
	if err := db.Exec(`
		UPDATE users
		SET email = lower(trim(email))
		WHERE email IS NOT NULL
	`).Error; err != nil {
		return err
	}

	// ตั้ง email ว่าง/NULL ให้เป็น user_<id>@placeholder.local
	if err := db.Exec(`
		UPDATE users
		SET email = printf('user_%d@placeholder.local', id)
		WHERE email IS NULL OR trim(email) = ''
	`).Error; err != nil {
		return err
	}

	// จัดการ email ที่ซ้ำ: คงตัวแรก, ที่เหลือเติม +<id> ที่ local-part
	type RowE struct {
		ID    uint
		Email string
	}
	type DupE struct {
		Email string
		C     int64
	}
	var dupE []DupE
	if err := db.Raw(`
		SELECT email, COUNT(*) AS C
		FROM users
		GROUP BY email
		HAVING C > 1
	`).Scan(&dupE).Error; err != nil {
		return err
	}
	for _, d := range dupE {
		var rows []RowE
		if err := db.Raw(`
			SELECT id, email
			FROM users
			WHERE email = ?
			ORDER BY id ASC
		`, d.Email).Scan(&rows).Error; err != nil {
			return err
		}
		for i := 1; i < len(rows); i++ {
			parts := strings.SplitN(rows[i].Email, "@", 2)
			var newEmail string
			if len(parts) == 2 && parts[0] != "" && parts[1] != "" {
				newEmail = fmt.Sprintf("%s+%d@%s", parts[0], rows[i].ID, parts[1])
			} else {
				newEmail = fmt.Sprintf("user_%d@placeholder.local", rows[i].ID)
			}
			if err := db.Model(&entity.User{}).
				Where("id = ?", rows[i].ID).
				Update("email", newEmail).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

// ---------- Permissions seeding ----------

func seedPermissionsAndGrantAdmin(adminID uint) {
	// รายการสิทธิ์
	perms := []struct {
		Key   string
		Title string
		Desc  string
	}{
		// Requests
		{"requests.read", "อ่านรายการรีเควส", ""},
		{"requests.manage", "จัดการรีเควส", ""},

		// Games
		{"games.read", "อ่านข้อมูลเกม", ""},
		{"games.manage", "จัดการเกม (เพิ่ม/แก้ไข/ลบ)", ""},

		// Workshop
		{"workshop.read", "เข้าถึง Workshop", ""},
		{"workshop.create", "อัปโหลด/สร้างม็อด", ""},
		{"workshop.moderate", "กลั่นกรอง Workshop", ""},

		// Roles & Users
		{"roles.read", "ดูบทบาท", ""},
		{"roles.manage", "จัดการบทบาทและสิทธิ์", ""},
		{"users.manage", "จัดการผู้ใช้", ""},

		// Payments
		{"payments.read", "ดูการชำระเงิน", ""},
		{"payments.manage", "จัดการการชำระเงิน", ""},

		// Community / Reviews
		{"community.read", "อ่านกระทู้/คอมเมนต์", ""},
		{"community.moderate", "โมเดอเรตคอมมูนิตี้", ""},
		{"reviews.read", "ดูรีวิว", ""},
		{"reviews.moderate", "ตรวจสอบรีวิว", ""},

		// Promotions / Orders / Analytics / Refunds / Reports
		{"promotions.read", "ดูโปรโมชัน", ""},
		{"promotions.manage", "จัดการโปรโมชัน", ""},
		{"orders.manage", "จัดการคำสั่งซื้อ", ""},
		{"analytics.read", "ดู Analytics", ""},
		{"refunds.read", "ดูคำร้องคืนเงิน", ""},
		{"refunds.manage", "จัดการคืนเงิน", ""},
		{"reports.read", "ดูรายงานปัญหา", ""},
		{"reports.manage", "จัดการรายงานปัญหา", ""},
	}

	for _, it := range perms {
		p, err := ensurePermission(it.Key, it.Title, it.Desc)
		if err != nil {
			log.Println("seed permission error:", it.Key, err)
			continue
		}
		if err := ensureRoleHasPermission(adminID, p.ID); err != nil {
			log.Println("grant admin perm error:", it.Key, err)
		}
	}
}

// ---------- Setup / Seed ----------

// AutoMigrate และ seed ข้อมูลตัวอย่าง (ถ้ายังว่าง) — ไม่ต้องดรอปตาราง
func SetupDatabase() {
	if db == nil {
		log.Fatal("database is not connected; call ConnectionDB() first")
	}

	// เฟส 1: สร้างตาราง RBAC ก่อน (ไม่พึ่ง users)
	if err := db.AutoMigrate(
		&entity.Role{},
		&entity.Permission{},
		&entity.RolePermission{},
	); err != nil {
		log.Fatal("auto migrate (rbac) failed: ", err)
	}

	// เฟส 2: ให้มี role พื้นฐานแน่นอน
	roleAdmin, err := getOrCreateRole("Admin", "system administrator")
	if err != nil {
		log.Fatal(err)
	}
	roleUser, err := getOrCreateRole("User", "default user")
	if err != nil {
		log.Fatal(err)
	}

	// เก็บค่าไว้ใน cache ให้ handler อื่นเรียกใช้
	adminRoleID = roleAdmin.ID
	userRoleID = roleUser.ID

	// Seed permissions & มอบให้ admin
	seedPermissionsAndGrantAdmin(roleAdmin.ID)

	// เฟส 3: ซ่อม users.role_id ให้ชี้ role ที่มีจริง (กันพังตอนคัดลอกเข้า users__temp ระหว่าง migrate)
	if tableExists("users") {
		if err := db.Exec(`
			UPDATE users
			SET role_id = ?
			WHERE role_id IS NULL
			   OR role_id = 0
			   OR role_id NOT IN (SELECT id FROM roles)
		`, roleUser.ID).Error; err != nil {
			log.Fatal("repair users.role_id failed: ", err)
		}
	}

	// เฟส 4: เคลียร์ username/email ซ้ำ/ว่างก่อนสร้าง unique index
	if err := fixUserUniqBeforeMigrate(); err != nil {
		log.Fatal("fix user unique failed: ", err)
	}

	// เฟส 5: ปิด FK ชั่วคราวเฉพาะตอน migrate ตาราง users (SQLite จะ DROP/RENAME ใต้ฝา)
	if err := db.Exec("PRAGMA foreign_keys = OFF").Error; err != nil {
		log.Fatal(err)
	}
	if err := db.AutoMigrate(&entity.User{}); err != nil {
		log.Fatal("auto migrate (users) failed: ", err)
	}
	if err := db.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
		log.Fatal(err)
	}

	// เฟส 6: ตารางอื่น ๆ ที่อ้างอิง users (ตอนนี้โครง users เสถียรแล้ว)
	if err := db.AutoMigrate(
		&entity.Game{},
		&entity.KeyGame{},
		&entity.Thread{},
		&entity.UserGame{},
		&entity.Comment{},
		&entity.Reaction{},
		&entity.Attachment{},
		&entity.Notification{},
		&entity.Order{},
		&entity.OrderItem{},
		&entity.Payment{},
		&entity.PaymentSlip{},
		&entity.PaymentReview{},
		&entity.Categories{},
		&entity.MinimumSpec{},
		&entity.Request{},
		&entity.Promotion{},
		&entity.Promotion_Game{},
		&entity.Mod{},
		&entity.ModRating{},
	); err != nil {
		log.Fatal("auto migrate (others) failed: ", err)
	}

	// เฟส 7: seed ข้อมูลตัวอย่าง ถ้ายังไม่มีผู้ใช้
	seedIfNeededWithRoles(roleAdmin, roleUser)
}

// สร้างข้อมูลตัวอย่างแบบเบา ๆ เฉพาะตอนที่ยังไม่มีผู้ใช้
func seedIfNeededWithRoles(roleAdmin entity.Role, roleUser entity.Role) {
	var count int64
	db.Model(&entity.User{}).Count(&count)
	if count > 0 {
		return
	}

	// users ตัวอย่าง
	pw, _ := bcrypt.GenerateFromPassword([]byte("123456"), 12)
	u1 := entity.User{
		Username:  "alice",
		Password:  string(pw),
		Email:     "alice@example.com",
		FirstName: "Alice",
		LastName:  "Lee",
		Birthday:  time.Date(2001, 5, 14, 0, 0, 0, 0, time.UTC),
		RoleID:    roleAdmin.ID, // admin
	}
	u2 := entity.User{
		Username:  "bob",
		Password:  string(pw),
		Email:     "bob@example.com",
		FirstName: "Bob",
		LastName:  "Kim",
		Birthday:  time.Date(2000, 11, 30, 0, 0, 0, 0, time.UTC),
		RoleID:    roleUser.ID, // user
	}
	db.Create(&u1)
	db.Create(&u2)
	/*
		// สร้าง games
		g1 := entity.Game{GameName: "Space Odyssey", GamePrice: 499, Description: "Co-op sci-fi adventure"}
		g2 := entity.Game{GameName: "Pixel Quest", GamePrice: 199, Description: "Retro platformer"}
		db.Create(&g1)
		db.Create(&g2)

		// ผู้ใช้ครอบครองเกม (สิทธิ์เข้า community)
		ug1 := entity.UserGame{
			Status:    "active",
			GrantedAt: time.Now().Add(-48 * time.Hour),
			GameID:    g1.ID,
			UserID:    u1.ID,
		}
		ug2 := entity.UserGame{
			Status:    "active",
			GrantedAt: time.Now().Add(-24 * time.Hour),
			GameID:    g2.ID,
			UserID:    u1.ID,
		}
		db.Create(&ug1)
		db.Create(&ug2)

		// กระทู้ตัวอย่าง
		th := entity.Thread{
			Title:   "รวมทริคมือใหม่ Space Odyssey",
			Content: "แชร์ทริคและคำถามได้ที่คอมเมนต์เลยครับ",
			UserID:  u1.ID,
			GameID:  g1.ID,
		}
		db.Create(&th)

		// คอมเมนต์ตัวอย่าง
		cm1 := entity.Comment{
			Content:  "โหมด co-op เล่นยังไงให้ผ่านด่าน 3 ดีครับ",
			UserID:   u2.ID,
			ThreadID: th.ID,
		}
		db.Create(&cm1)

		// ปฏิกิริยา (like) กับกระทู้
		rc := entity.Reaction{
			TargetType: "thread",
			TargetID:   th.ID,
			Type:       "like",
			UserID:     u2.ID,
		}
		db.Create(&rc)

		// แนบไฟล์กับคอมเมนต์
		at := entity.Attachment{
			TargetType: "comment",
			TargetID:   cm1.ID,
			FileURL:    "https://example.com/tips.png",
			UserID:     u2.ID,
		}
		db.Create(&at)

		// แจ้งเตือนให้ผู้ตั้งกระทู้
		noti := entity.Notification{
			Title:   "มีคอมเมนต์ใหม่ในกระทู้ของคุณ",
			Type:    "system",
			Message: "Bob ตอบในหัวข้อ: รวมทริคมือใหม่ Space Odyssey",
			UserID:  u1.ID,
		}
		db.Create(&noti) */

	//สร้างCategories
	db.Model(&entity.Categories{}).Create(&entity.Categories{
		Title: "FPS",
	})

	db.Model(&entity.Categories{}).Create(&entity.Categories{
		Title: "Horror",
	})

	db.Model(&entity.Categories{}).Create(&entity.Categories{
		Title: "TPS",
	})
}
