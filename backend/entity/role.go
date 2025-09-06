package entity

import "gorm.io/gorm"

type Role struct {
	gorm.Model
	Title       string `json:"title"`
	Description string `json:"description"`

	RolePermissions []RolePermission `gorm:"foreignKey:RoleID" json:"role_permissions"`
	Users           []User           `gorm:"foreignKey:RoleID" json:"users"`
}
