package entity

import "gorm.io/gorm"

type Tags struct {
	gorm.Model
	Title string `json:"title"`

	ModTags []ModTags `gorm:"foreignKey:TagID" json:"mod_tags"`
}
