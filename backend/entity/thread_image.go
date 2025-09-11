package entity

import "gorm.io/gorm"

// รูปแนบเฉพาะเธรด (ไม่แนบกับคอมเมนต์)
type ThreadImage struct {
	gorm.Model
	ThreadID uint   `json:"thread_id" gorm:"index;not null"`
	Thread   Thread `json:"-"`
	FileURL  string `json:"file_url" gorm:"not null"`
	AltText  string `json:"alt_text"`
}