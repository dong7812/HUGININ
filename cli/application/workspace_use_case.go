package application

import (
	"fmt"
	"huginin/domain"
)

type WorkspaceUseCase struct {
	api      domain.APIClient
	keystore domain.TokenRepository
}

func NewWorkspaceUseCase(api domain.APIClient, ks domain.TokenRepository) *WorkspaceUseCase {
	return &WorkspaceUseCase{api: api, keystore: ks}
}

func (uc *WorkspaceUseCase) token() (string, error) {
	token, _, err := uc.keystore.Load()
	if err != nil || token == "" {
		return "", fmt.Errorf("not logged in — run: huginin login")
	}
	return token, nil
}

func (uc *WorkspaceUseCase) Create(name string) (id, slug string, err error) {
	t, err := uc.token()
	if err != nil {
		return "", "", err
	}
	return uc.api.CreateWorkspace(t, name)
}

func (uc *WorkspaceUseCase) Join(inviteCode string) (id, role string, err error) {
	t, err := uc.token()
	if err != nil {
		return "", "", err
	}
	return uc.api.JoinWorkspace(t, inviteCode)
}

func (uc *WorkspaceUseCase) List() ([]domain.Workspace, error) {
	t, err := uc.token()
	if err != nil {
		return nil, err
	}
	return uc.api.ListWorkspaces(t)
}

func (uc *WorkspaceUseCase) Invite(workspaceID, role string, expiresHours int) (string, error) {
	t, err := uc.token()
	if err != nil {
		return "", err
	}
	return uc.api.InviteMember(t, workspaceID, role, expiresHours)
}

func (uc *WorkspaceUseCase) Members(workspaceID string) ([]domain.Member, error) {
	t, err := uc.token()
	if err != nil {
		return nil, err
	}
	return uc.api.ListMembers(t, workspaceID)
}

func (uc *WorkspaceUseCase) ChangeRole(workspaceID, targetUserID, newRole string) error {
	t, err := uc.token()
	if err != nil {
		return err
	}
	return uc.api.ChangeRole(t, workspaceID, targetUserID, newRole)
}
