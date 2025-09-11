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
	database, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database: ", err)
	}
	db = database
	db.Exec("PRAGMA foreign_keys = ON")
}

func SetupDatabase() {
	if db == nil {
		log.Fatal("database is not connected; call ConnectionDB() first")
	}

	// (ออปชันสำหรับ dev เท่านั้น) เคลียร์ index เก่าชื่อเดิมถ้ายังหลงเหลือ
	// db.Exec("DROP INDEX IF EXISTS idx_user_game") // <- ใส่/ไม่ใส่ก็ได้

	// ให้ GORM สร้าง schema + ดัชนีจาก tag (ชื่อใหม่: ux_reviews_user_game)
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
		&entity.Review{},      // ★ ใช้ชื่อดัชนีใหม่แล้ว
		&entity.Review_Like{}, // ถ้ามี
	); err != nil {
		log.Fatal("auto migrate failed: ", err)
	}

	seedIfNeeded()
}

// seed เบา ๆ
func seedIfNeeded() {
	var count int64
	db.Model(&entity.User{}).Count(&count)
	if count > 0 {
		return
	}

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

	db.Model(&entity.Categories{}).Create(&entity.Categories{Title: "FPS"})
	db.Model(&entity.Categories{}).Create(&entity.Categories{Title: "Horror"})
	db.Model(&entity.Categories{}).Create(&entity.Categories{Title: "TPS"})
}
