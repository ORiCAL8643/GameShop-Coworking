package entity

import "gorm.io/gorm"

type Review_Like struct {
	gorm.Model

	// Like ตัวนี้เป็นของรีวิวไหน
	ReviewID uint    `json:"review_id" gorm:"index:idx_review_user,unique;not null"`
	Review   *Review `json:"review"    gorm:"foreignKey:ReviewID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	// ใครเป็นคนกดไลก์
	UserID uint  `json:"user_id" gorm:"index:idx_review_user,unique;not null"`
	User   *User `json:"user"    gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	// (ออปชันแนล) อ้างอิงเกม เพื่อให้ query จาก Like → Game ได้ตรงๆ โดยไม่ต้อง join ผ่าน Review
	// แนะนำให้ตั้งค่า GameID = review.GameID ตอนสร้าง Like
	GameID uint  `json:"game_id" gorm:"index"`
	Game   *Game `json:"game"    gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}
