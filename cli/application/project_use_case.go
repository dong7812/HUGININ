package application

import (
	"fmt"
	"huginin/domain"
)

type ProjectUseCase struct {
	api      domain.APIClient
	keystore domain.TokenRepository
}

func NewProjectUseCase(api domain.APIClient, ks domain.TokenRepository) *ProjectUseCase {
	return &ProjectUseCase{api: api, keystore: ks}
}

func (uc *ProjectUseCase) token() (string, error) {
	token, _, err := uc.keystore.Load()
	if err != nil || token == "" {
		return "", fmt.Errorf("not logged in — run: huginin login")
	}
	return token, nil
}

func (uc *ProjectUseCase) Link(workspaceID, name, gitRemote string) (string, error) {
	t, err := uc.token()
	if err != nil {
		return "", err
	}
	return uc.api.LinkProject(t, workspaceID, name, gitRemote)
}

func (uc *ProjectUseCase) CollectEvent(workspaceID, projectID, commitHash, prompt, response, diff, branch string) (string, error) {
	t, err := uc.token()
	if err != nil {
		return "", err
	}
	return uc.api.CollectEvent(t, workspaceID, projectID, commitHash, prompt, response, diff, branch)
}
