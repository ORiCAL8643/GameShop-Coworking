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
	FilePath    string    `json:"file_path"`   // path ของไฟล์ .zip/.rar
	ImagePath   string    `json:"image_path"`  // path ของรูปภาพ (thumbnail/screenshot)
	Status      string    `json:"status"`

	UserGameID uint      `json:"user_game_id"`
	UserGame   *UserGame `gorm:"foreignKey:UserGameID" json:"user_game"`

	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game"`

	//ModTags []ModTags `gorm:"foreignKey:ModID" json:"mod_tags"`
}
