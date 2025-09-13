// entity/mod.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type Mod struct {
	gorm.Model

	Title       string    `json:"title"`
	Description string    `json:"description"`
	UploadDate  time.Time `json:"upload_date"` // 🟡 ใช้ได้ แต่ซ้ำกับ CreatedAt; ถ้าไม่จำเป็น ลบออกได้
	FilePath    string    `json:"file_path"`   // path ของไฟล์ .zip/.rar
	ImagePath   string    `json:"image_path"`  // path ของรูป (thumbnail)
	Status      string    `json:"status"`

	// ✅ เกมที่ม็อดนี้สังกัด
	GameID uint  `json:"game_id" gorm:"index"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game,omitempty"`

	// ✅ ผู้ใช้งานที่อัปโหลดม็อด (สำคัญมากสำหรับการเช็คว่าเป็นของใคร)
	UserID uint  `json:"user_id" gorm:"index"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"uploader,omitempty"`

	// 🟡 ความเป็นเจ้าของ ‘เกม’ ในคลังของผู้ใช้ (ออปชัน)
	// เดิมเป็น uint ไม่ nullable; ถ้าจะให้ไม่บังคับ -> ใช้ *uint
	UserGameID *uint     `json:"user_game_id,omitempty" gorm:"index"`
	UserGame   *UserGame `gorm:"foreignKey:UserGameID" json:"user_game,omitempty"`

	//ModTags []ModTags `gorm:"foreignKey:ModID" json:"mod_tags"`

	ViewCount     int64 `json:"view_count" gorm:"default:0"`
	DownloadCount int64 `json:"download_count" gorm:"default:0"`
}
