package entity

import "gorm.io/gorm"

// รีวิวของผู้ใช้ต่อเกมหนึ่ง ๆ
type Review struct {
	gorm.Model

	ReviewTitle string `json:"review_title" gorm:"type:varchar(255);not null"`
	ReviewText  string `json:"review_text" gorm:"type:text"`
	Rating      int    `json:"rating" gorm:"not null"` // 1–5

	// เปลี่ยนชื่อ composite unique index -> ux_reviews_user_game
	UserID uint  `json:"user_id" gorm:"not null;uniqueIndex:ux_reviews_user_game,priority:1"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	GameID uint  `json:"game_id" gorm:"not null;uniqueIndex:ux_reviews_user_game,priority:2"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game"`

	Likes []Review_Like `gorm:"foreignKey:ReviewID" json:"likes"`
}

func (Review) TableName() string { return "reviews" }
