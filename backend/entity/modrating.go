package entity

import "gorm.io/gorm"

type ModRating struct {
	gorm.Model

	Score   int    `json:"score"`
	Comment string `json:"comment,omitempty" gorm:"type:text"`
	UserID  uint   `json:"user_id" gorm:"index"`
	User    *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ModID   uint   `json:"mod_id" gorm:"index"`
	Mod     *Mod   `gorm:"foreignKey:ModID" json:"-"`
}
