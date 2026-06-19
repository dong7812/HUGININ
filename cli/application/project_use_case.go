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

func (uc *ProjectUseCase) CollectEvent(workspaceID, projectID, commitHash, prompt, response, diff, branch, committedAt string) (string, error) {
	t, err := uc.token()
	if err != nil {
		return "", err
	}
	return uc.api.CollectEvent(t, workspaceID, projectID, commitHash, prompt, response, diff, branch, committedAt)
}

func (uc *ProjectUseCase) GetCommitHashes(workspaceID string) ([]string, error) {
	t, err := uc.token()
	if err != nil {
		return nil, err
	}
	return uc.api.GetCommitHashes(t, workspaceID)
}

func (uc *ProjectUseCase) FixCommitTimestamps(workspaceID string, timestamps map[string]string) (int, error) {
	t, err := uc.token()
	if err != nil {
		return 0, err
	}
	return uc.api.FixCommitTimestamps(t, workspaceID, timestamps)
}
