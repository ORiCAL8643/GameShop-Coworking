// configs/database.go
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

// ใช้เพื่อดึง *gorm.DB ไปใช้ที่อื่น
func DB() *gorm.DB {
	return db
}

// เปิดการเชื่อมต่อฐานข้อมูล (SQLite)
// สามารถตั้งค่าไฟล์ DB ผ่าน env DB_PATH ได้ (ค่าดีฟอลต์: gameshop-community.db)
func ConnectionDB() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "gameshop-community.db"
	}
	database, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database: ", err)
	}
	db = database

	// เปิด foreign key constraints ของ SQLite
	db.Exec("PRAGMA foreign_keys = ON")
}

// AutoMigrate และ seed ข้อมูลตัวอย่าง (ถ้ายังว่าง)
func SetupDatabase() {
	if db == nil {
		log.Fatal("database is not connected; call ConnectionDB() first")
	}

	// สร้างตารางให้ครบ
	if err := db.AutoMigrate(
		&entity.User{},
		&entity.Game{},
		&entity.Thread{},
		&entity.UserGame{},
		&entity.Comment{},
		&entity.Reaction{},
		&entity.Attachment{},
		&entity.Notification{},
		&entity.Order{},
		&entity.Payment{},
		&entity.PaymentSlip{},
	); err != nil {
		log.Fatal("auto migrate failed: ", err)
	}

	seedIfNeeded()
}

// สร้างข้อมูลตัวอย่างแบบเบา ๆ เฉพาะตอนที่ยังไม่มีข้อมูล
func seedIfNeeded() {
	// ถ้ามี User แล้วถือว่า seed ไปแล้ว
	var count int64
	db.Model(&entity.User{}).Count(&count)
	if count > 0 {
		return
	}

	// สร้าง users
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
