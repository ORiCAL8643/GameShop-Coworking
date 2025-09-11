package entity

import "gorm.io/gorm"

type Role struct {
    gorm.Model
    Title       string  `gorm:"size:60;uniqueIndex;not null" json:"title"`
    Description string  `gorm:"type:text" json:"description"`
    Color       string  `gorm:"size:7" json:"color"` // เช่น "#1890ff"

    // ลบ role → ลบ mapping ใน role_permissions ตาม (CASCADE)
    RolePermissions []RolePermission `gorm:"foreignKey:RoleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"role_permissions"`

    // ลบ role → ถูกบล็อคถ้ายังมี user ใช้อยู่ (RESTRICT)
    Users []User `gorm:"foreignKey:RoleID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"users"`
}
