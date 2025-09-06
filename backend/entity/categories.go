package entity

import (
	"gorm.io/gorm"
)

type Categories struct {
	gorm.Model
	Title string `json:"title" gorm:"unique"`
}
