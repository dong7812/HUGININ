package application

import (
	"fmt"
	"huginin/domain"
)

type LoginUseCase struct {
	api      domain.APIClient
	keystore domain.TokenRepository
}

func NewLoginUseCase(api domain.APIClient, ks domain.TokenRepository) *LoginUseCase {
	return &LoginUseCase{api: api, keystore: ks}
}

func (uc *LoginUseCase) Login(email, password string) error {
	token, userID, err := uc.api.Login(email, password)
	if err != nil {
		return err
	}
	return uc.keystore.Save(token, userID)
}

func (uc *LoginUseCase) Register(email, name, password string) error {
	token, userID, err := uc.api.Register(email, name, password)
	if err != nil {
		return err
	}
	return uc.keystore.Save(token, userID)
}

func (uc *LoginUseCase) CreateServiceToken() (string, error) {
	token, _, err := uc.keystore.Load()
	if err != nil || token == "" {
		return "", fmt.Errorf("not logged in — run: huginin login")
	}
	return uc.api.CreateServiceToken(token)
}
