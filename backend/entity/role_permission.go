package entity

import "gorm.io/gorm"

type RolePermission struct {
	gorm.Model

	RoleID uint `json:"role_id" gorm:"index:idx_role_perm,unique"`
	Role   Role `gorm:"foreignKey:RoleID" json:"role"`

	PermissionID uint       `json:"permission_id" gorm:"index:idx_role_perm,unique"`
	Permission   Permission `gorm:"foreignKey:PermissionID" json:"permission"`
}
