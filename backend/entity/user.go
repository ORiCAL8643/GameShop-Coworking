package entity

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username  string    `json:"username"`
	Password  string    `json:"password"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Birthday  time.Time `json:"birthday"`
	RoleID    uint      `json:"role_id"`

	Threads       []Thread       `gorm:"foreignKey:UserID" json:"threads,omitempty"`
	Comments      []Comment      `gorm:"foreignKey:UserID" json:"comments,omitempty"`
	Reactions     []Reaction     `gorm:"foreignKey:UserID" json:"reactions,omitempty"`
	Attachments   []Attachment   `gorm:"foreignKey:UserID" json:"attachments,omitempty"`
	Notifications []Notification `gorm:"foreignKey:UserID" json:"notifications,omitempty"`
	UserGames     []UserGame     `gorm:"foreignKey:UserID" json:"user_games,omitempty"`

	Reviews     []Review      `gorm:"foreignKey:UserID" json:"reviews,omitempty"`
	ReviewLikes []Review_Like `gorm:"foreignKey:UserID" json:"review_likes,omitempty"`

	Promotions []Promotion `json:"promotions,omitempty" gorm:"foreignKey:UserID"`
	Requests   []Request   `json:"request" gorm:"foreignKey:UserRefer"`
}
