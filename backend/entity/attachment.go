package entity

import (
	"gorm.io/gorm"
)

type Attachment struct {
	gorm.Model
	TargetType string `json:"target_type"`
	TargetID   uint   `json:"target_id"`
	FileURL    string `json:"file_url"`
	UserID     uint   `json:"user_id"`
	User       *User  `gorm:"foreignKey:UserID" json:"user"`
}