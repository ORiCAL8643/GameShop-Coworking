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

	database, err := gorm.Open(sqlite.Open(dbPath), gormCfg)
	if err != nil {
		log.Fatal("failed to connect database: ", err)
	}
	db = database

	// เปิดใช้ FK runtime (แค่ตอนใช้งาน ไม่เกี่ยวกับตอน migrate)
	db.Exec("PRAGMA foreign_keys = ON")
}

func SetupDatabase() {
	if db == nil {
		log.Fatal("database is not connected; call ConnectionDB() first")
	}

	// ✅ ไม่แตะตารางของทีมอื่น — migrate เฉพาะของเราเท่านั้น
	//    ถ้าตาราง users/games/categories ของทีมมีอยู่แล้ว เราแค่อ้างอิงใช้งานได้เลย
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
	); err != nil {
		log.Fatal("auto migrate failed: ", err)
	}

	seedIfNeeded()
}

func seedIfNeeded() {
	// ผู้ใช้: ถ้าไม่มีค่อย seed (กรณีโปรเจ็กต์หลักสร้างไว้แล้ว โค้ดนี้จะข้ามเอง)
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

	// Categories: สร้างเฉพาะเมื่อมีตารางและยังไม่มีข้อมูล — กัน error ถ้าทีมอื่นยังไม่สร้างตารางนี้
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
