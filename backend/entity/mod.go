package entity

import (
	"time"

	"gorm.io/gorm"
)

type Mod struct {
	gorm.Model

	Title       string    `json:"title"`
	Description string    `json:"description"`
	UploadDate  time.Time `json:"upload_date"`
	FilePath    string    `json:"file_path"`
	Status      string    `json:"status"`

	GameUserID uint     `json:"game_user_id"`
	GameUser   *GameUser `gorm:"foreignKey:GameUserID" json:"game_user"`

	GameID uint   `json:"game_id"`
	Game   *Game  `gorm:"foreignKey:GameID" json:"game"`

	ModTags []ModTag `gorm:"foreignKey:ModID" json:"mod_tags"`
}