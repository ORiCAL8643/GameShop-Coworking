package entity

import "gorm.io/gorm"

type Tag struct {
	gorm.Model
	Title string `json:"title"`

	ModTags []ModTag `gorm:"foreignKey:TagID" json:"mod_tags"`
}
