package entity

import (
	"time"

	"gorm.io/gorm"
)

type DiscountType string

const (
	DiscountPercent DiscountType = "PERCENT" // ลดเป็น %
	DiscountAmount  DiscountType = "AMOUNT"  // ลดเป็นจำนวนเงิน
)

type Promotion struct {
	gorm.Model

	Title         string       `json:"title"           gorm:"type:varchar(120);not null;index"`
	Description   string       `json:"description"     gorm:"type:text"`
	DiscountType  DiscountType `json:"discount_type"   gorm:"type:varchar(20);not null;default:PERCENT"`
	DiscountValue int          `json:"discount_value"  gorm:"not null;check:discount_value_nonneg,discount_value>=0"`
	StartDate     time.Time    `json:"start_date"      gorm:"not null;index"`
	EndDate       time.Time    `json:"end_date"        gorm:"not null;index"`
	PromoImage    string       `json:"promo_image"`
	Status        bool         `json:"status"          gorm:"default:true;index"` // เปิด/ปิดโปร

	// ผู้สร้างโปรโมชัน
	UserID uint  `json:"user_id" gorm:"index"`
	User   *User `json:"user"    gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`

	// Many-to-Many ผ่านตารางกลาง promotion_games (มี struct เฉพาะ)
	Games          []Game           `json:"games"           gorm:"many2many:promotion_games"`
	PromotionGames []Promotion_Game `json:"promotion_games" gorm:"foreignKey:PromotionID"`
}
