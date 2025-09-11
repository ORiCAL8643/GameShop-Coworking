package entity

import "gorm.io/gorm"

// ProblemReplyAttachment stores a file attached to an admin reply.
type ProblemReplyAttachment struct {
	gorm.Model
	FilePath string `json:"file_path"`
	ReplyID  uint   `json:"reply_id"`
}
