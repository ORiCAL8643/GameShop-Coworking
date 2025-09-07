package entity

import (
	"gorm.io/gorm"
)

type KeyGame struct {
	gorm.Model
	Key  string `json:"key" gorm:"uniqueIndex; type:text; default:(lower(hex(randomblob(16))))"`
	Game Game   `json:"game"`
}
