package entity

import "gorm.io/gorm"

// ตารางกลาง Promotion <-> Game (เก็บข้อมูลต่อแถวได้ในอนาคต เช่น cap ต่อเกม)
type Promotion_Game struct {
	gorm.Model

	PromotionID uint       `json:"promotion_id" gorm:"index:idx_promo_game,unique;not null"`
	Promotion   *Promotion `json:"promotion"    gorm:"foreignKey:PromotionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	GameID uint  `json:"game_id" gorm:"index:idx_promo_game,unique;not null"`
	Game   *Game `json:"game"    gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	// (ออปชัน) ถ้าวันหน้าต้อง override ส่วนลดเฉพาะเกมนี้ ก็เพิ่มคอลัมน์ได้ที่นี่
	// PerGameDiscount *int `json:"per_game_discount"`
}

func (Promotion_Game) TableName() string { return "promotion_games" }
