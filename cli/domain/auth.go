package domain

// TokenRepository 로컬 토큰 영속성 추상화.
type TokenRepository interface {
	Save(token, userID string) error
	Load() (token, userID string, err error)
	Clear() error
}
