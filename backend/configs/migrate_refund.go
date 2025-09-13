package configs

import (
	"example.com/sa-gameshop/entity"
	"log"
)

// MigrateRefundTables migrates refund-related tables only.
func MigrateRefundTables() {
	db := DB()
	if db == nil {
		log.Println("[MigrateRefundTables] DB() is nil, skip")
		return
	}

	if err := db.AutoMigrate(
		&entity.RefundStatus{},
		&entity.RefundRequest{},
		&entity.RefundAttachment{},
	); err != nil {
		log.Println("[MigrateRefundTables] AutoMigrate error:", err)
	} else {
		log.Println("[MigrateRefundTables] AutoMigrate done for refund tables")
	}

	// seed default statuses if table empty
	var cnt int64
	if err := db.Model(&entity.RefundStatus{}).Count(&cnt).Error; err == nil && cnt == 0 {
		statuses := []entity.RefundStatus{
			{StatusName: "Pending"},
			{StatusName: "Approved"},
			{StatusName: "Rejected"},
		}
		db.Create(&statuses)
	}
}
