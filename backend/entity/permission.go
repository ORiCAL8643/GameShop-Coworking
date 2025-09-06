package entity

import "gorm.io/gorm"

type Permission struct {
	gorm.Model
	Title       string `json:"title"`
	Description string `json:"description"`

	RolePermissions []RolePermission `gorm:"foreignKey:PermissionID" json:"role_permissions"`
}
