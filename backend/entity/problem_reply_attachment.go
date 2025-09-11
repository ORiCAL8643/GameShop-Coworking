// entity/problem_reply_attachment.go
package entity

type ProblemReplyAttachment struct {
    ID     uint   `gorm:"primaryKey" json:"id"`
    ReplyID uint   `json:"reply_id"`
    FilePath string `json:"file_path"`
}
