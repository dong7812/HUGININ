package keystore

import (
	"huginin/infrastructure/config"
)

// LocalKeystore TokenRepository 구현체 — ~/.huginin/config.json 저장.
type LocalKeystore struct{}

func New() *LocalKeystore { return &LocalKeystore{} }

func (k *LocalKeystore) Save(token, userID string) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	cfg.Token = token
	cfg.UserID = userID
	return config.Save(cfg)
}

func (k *LocalKeystore) Load() (token, userID string, err error) {
	cfg, err := config.Load()
	if err != nil {
		return "", "", err
	}
	return cfg.Token, cfg.UserID, nil
}

func (k *LocalKeystore) Clear() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	cfg.Token = ""
	cfg.UserID = ""
	return config.Save(cfg)
}
