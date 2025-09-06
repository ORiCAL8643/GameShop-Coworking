package entity

import "gorm.io/gorm"

type Review struct {
	gorm.Model
	ReviewTitle string `json:"review_title" gorm:"type:varchar(255);not null"` // ชื่อรีวิว
	ReviewText  string `json:"review_text" gorm:"type:text"`                   // เนื้อหารีวิว
	Rating      int    `json:"rating" gorm:"not null"`                         // คะแนนรีวิว

	// FK → Users
	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	// FK → Games
	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game"`

	// 1:N ReviewLike
	Likes []Review_Like `gorm:"foreignKey:ReviewID" json:"likes"`
}
