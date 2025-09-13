package entity

import "gorm.io/gorm"

type Permission struct {
	gorm.Model
	Code        string `json:"code" gorm:"uniqueIndex"`
	Description string `json:"description"`

	RolePermissions []RolePermission `gorm:"foreignKey:PermissionID" json:"role_permissions"`
}
