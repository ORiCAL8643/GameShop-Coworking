package entity

import "gorm.io/gorm"

type RolePermission struct {
	gorm.Model

	RoleID       uint       `json:"role_id"`
	Role         *Role      `gorm:"foreignKey:RoleID" json:"role"`

	PermissionID uint        `json:"permission_id"`
	Permission   *Permission `gorm:"foreignKey:PermissionID" json:"permission"`
}
