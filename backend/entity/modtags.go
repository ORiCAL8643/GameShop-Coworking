package entity

import "gorm.io/gorm"

type ModTag struct {
	gorm.Model

	ModID uint  `json:"mod_id"`
	Mod   *Mod  `gorm:"foreignKey:ModID" json:"mod"`

	TagID uint `json:"tag_id"`
	Tag   *Tag `gorm:"foreignKey:TagID" json:"tag"`
}
