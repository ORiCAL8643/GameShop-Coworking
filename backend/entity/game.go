package entity

import (
	"time"

	"gorm.io/gorm"
)

type Game struct {
	gorm.Model
	GameName       string     `json:"game_name"`
	//KeyGameID      uint       `json:"key_id"`
	CategoriesID   int        `json:"categories_id"`
	Categories     Categories `json:"categories" gorm:"foreignkey:CategoriesID"`
	Date           time.Time  `json:"release_date" gorm:"autoCreateTime"`
	BasePrice      int        `json:"base_price"`
	Status         string     `json:"status" gorm:"type:varchar(20);default:'pending';not null;index"`
	Minimum_specID uint       `json:"minimum_spec_id"`
	AgeRating      int        `json:"age_rating"`

	Requests []Request `gorm:"foreignKey:GameRefer"`
	Market   Market    `json:"market"`

	Threads   []Thread   `gorm:"foreignKey:GameID" json:"threads,omitempty"`
	UserGames []UserGame `gorm:"foreignKey:GameID" json:"user_games,omitempty"`

	Reviews     []Review      `gorm:"foreignKey:GameID" json:"reviews,omitempty"`
	ReviewLikes []Review_Like `gorm:"foreignKey:GameID" json:"review_likes,omitempty"`

	Promotions     []Promotion      `json:"promotions,omitempty"       gorm:"many2many:promotion_games"`
	PromotionGames []Promotion_Game `json:"promotion_games,omitempty"  gorm:"foreignKey:GameID"`
	ImgSrc         string           `json:"img_src"    gorm:"type:varchar(512)"`
}

// Hook function ไว้หลังสร้างเกมเสร็จแล้ว keygame จะเจนเอง
/*func (g *Game) AfterCreate(tx *gorm.DB) (err error) {
	kg := KeyGame{}
	if err = tx.Create(&kg).Error; err != nil {
		return err
	}
	return tx.Model(g).Update("key_game_id", kg.ID).Error
}
*/