package services

import (
	"sync"
	"time"

	"gorm.io/gorm"
)

type PermService struct {
	DB      *gorm.DB
	cache   map[uint]map[string]struct{}
	expires map[uint]time.Time
	ttl     time.Duration
	mu      sync.RWMutex
}

func NewPermService(db *gorm.DB, ttl time.Duration) *PermService {
	return &PermService{
		DB:      db,
		cache:   make(map[uint]map[string]struct{}),
		expires: make(map[uint]time.Time),
		ttl:     ttl,
	}
}

func (s *PermService) GetByRole(roleID uint) (map[string]struct{}, error) {
	now := time.Now()
	s.mu.RLock()
	if set, ok := s.cache[roleID]; ok {
		if exp, ok2 := s.expires[roleID]; ok2 && now.Before(exp) {
			s.mu.RUnlock()
			return set, nil
		}
	}
	s.mu.RUnlock()

	rows := []string{}
	if err := s.DB.Table("permissions p").
		Select("p.code").
		Joins("JOIN role_permissions rp ON rp.permission_id = p.id").
		Where("rp.role_id = ?", roleID).
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	set := make(map[string]struct{}, len(rows))
	for _, r := range rows {
		set[r] = struct{}{}
	}

	s.mu.Lock()
	s.cache[roleID] = set
	s.expires[roleID] = now.Add(s.ttl)
	s.mu.Unlock()
	return set, nil
}

func (s *PermService) Invalidate(roleID uint) {
	s.mu.Lock()
	delete(s.cache, roleID)
	delete(s.expires, roleID)
	s.mu.Unlock()
}
