package services

import (
	"math/rand"
	"strings"
	"time"

	"example.com/sa-gameshop/entity"
	"gorm.io/gorm"
)

var keyRunes = []rune("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

func randomKey(n int) string {
	rand.Seed(time.Now().UnixNano())
	b := make([]rune, n)
	for i := range b {
		b[i] = keyRunes[rand.Intn(len(keyRunes))]
	}
	return string(b)
}

// CreateRandomKeyGames generates unique key codes for the given game and
// inserts them into the database as available keys.
func CreateRandomKeyGames(db *gorm.DB, gameID uint, qty int) error {
	if qty <= 0 {
		return nil
	}
	for i := 0; i < qty; i++ {
		for {
			code := randomKey(16)
			kg := entity.KeyGame{GameID: gameID, KeyCode: code}
			if err := db.Create(&kg).Error; err != nil {
				if strings.Contains(strings.ToLower(err.Error()), "unique") {
					// duplicate key, retry
					continue
				}
				return err
			}
			break
		}
	}
	return nil
}
