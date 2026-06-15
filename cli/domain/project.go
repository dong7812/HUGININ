package domain

// Project 프로젝트 도메인 모델.
type Project struct {
	ID        string
	Name      string
	GitRemote string
}

// APIClient 서버 HTTP 통신 추상화.
type APIClient interface {
	Register(email, name, password string) (token, userID string, err error)
	Login(email, password string) (token, userID string, err error)
	CreateWorkspace(token, name string) (id, slug string, err error)
	JoinWorkspace(token, inviteCode string) (id, role string, err error)
	ListWorkspaces(token string) ([]Workspace, error)
	InviteMember(token, workspaceID, role string, expiresHours int) (code string, err error)
	ListMembers(token, workspaceID string) ([]Member, error)
	ChangeRole(token, workspaceID, targetUserID, newRole string) error
	LinkProject(token, workspaceID, name, gitRemote string) (id string, err error)
	CollectEvent(token, workspaceID, projectID, commitHash, prompt, response, diff, branch string) (eventID string, err error)
	CreateServiceToken(token string) (serviceToken string, err error)
}

// Member 워크스페이스 멤버.
type Member struct {
	UserID   string
	Role     string
	JoinedAt string
}
