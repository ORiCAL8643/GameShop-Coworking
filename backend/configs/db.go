package configs

import (
	"log"
	"os"
	"time"

	"example.com/sa-gameshop/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

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

func SetupDatabase() {
	if db == nil {
		log.Fatal("database is not connected; call ConnectionDB() first")
	}

	// ✅ ไม่แตะตารางของทีมอื่น — migrate เฉพาะของเราเท่านั้น
	if err := db.AutoMigrate(
		&entity.User{},
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
		&entity.ProblemReport{},
		&entity.ProblemAttachment{},
	); err != nil {
		log.Fatal("auto migrate failed: ", err)
	}

	seedIfNeeded()
}

func seedIfNeeded() {
	var userCount int64
	if err := db.Model(&entity.User{}).Count(&userCount).Error; err == nil && userCount == 0 {
		pw, _ := bcrypt.GenerateFromPassword([]byte("123456"), 12)
		u1 := entity.User{
			Username:  "alice",
			Password:  string(pw),
			Email:     "alice@example.com",
			FirstName: "Alice",
			LastName:  "Lee",
			Birthday:  time.Date(2001, 5, 14, 0, 0, 0, 0, time.UTC),
			RoleID:    1,
		}
		u2 := entity.User{
			Username:  "bob",
			Password:  string(pw),
			Email:     "bob@example.com",
			FirstName: "Bob",
			LastName:  "Kim",
			Birthday:  time.Date(2000, 11, 30, 0, 0, 0, 0, time.UTC),
			RoleID:    1,
		}
		_ = db.Create(&u1).Error
		_ = db.Create(&u2).Error
	}

	// Categories: seed เฉพาะเมื่อมีตารางและยังไม่มีข้อมูล
	if db.Migrator().HasTable(&entity.Categories{}) {
		var catCount int64
		_ = db.Model(&entity.Categories{}).Count(&catCount).Error
		if catCount == 0 {
			_ = db.Create(&entity.Categories{Title: "FPS"}).Error
			_ = db.Create(&entity.Categories{Title: "Horror"}).Error
			_ = db.Create(&entity.Categories{Title: "TPS"}).Error
		}
	}
}
