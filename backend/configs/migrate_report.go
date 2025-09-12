// backend/configs/migrate_reports.go
package configs

import (
	"log"

	"example.com/sa-gameshop/entity"
)

// เรียกไฟล์นี้จาก main หลัง SetupDatabase() อีกที
func MigrateReportTables() {
	db := DB()
	if db == nil {
		log.Println("[MigrateReportTables] DB() is nil, skip")
		return
	}

	// ✅ เพิ่มเฉพาะตารางของระบบ Report ที่เราทำ ไม่ไปยุ่งของเพื่อน
	// เรียงแบบปลอดภัย สามารถเรียกซ้ำได้ (GORM จะเช็คเอง)
	if err := db.AutoMigrate(
		&entity.ProblemReport{},
		&entity.ProblemAttachment{},
		&entity.ProblemReply{},
		&entity.ProblemReplyAttachment{},
	); err != nil {
		log.Println("[MigrateReportTables] AutoMigrate error:", err)
	} else {
		log.Println("[MigrateReportTables] AutoMigrate done for report tables")
	}
}
