package entity

import (
	"gorm.io/gorm"
)

type MinimumSpec struct {
	gorm.Model
	OS        string `json:"os" gorm:"type:varchar(20)"`
	Processor string `json:"processor" gorm:"type:varchar(20)"`
	Memory    string `json:"memory" gorm:"type:varchar(20)"`
	Graphics  string `json:"graphics" gorm:"type:varchar(20)"`
	Storage   string `json:"storage" gorm:"type:varchar(20)"`
}
