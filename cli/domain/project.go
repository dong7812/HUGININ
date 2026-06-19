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
	DeleteWorkspace(token, workspaceID string) error
	LinkProject(token, workspaceID, name, gitRemote string) (id string, err error)
	CollectEvent(token, workspaceID, projectID, commitHash, prompt, response, diff, branch, committedAt string) (eventID string, err error)
	GetCommitHashes(token, workspaceID string) ([]string, error)
	FixCommitTimestamps(token, workspaceID string, timestamps map[string]string) (int, error)
	CreateServiceToken(token string) (serviceToken string, err error)
	CreateCLISession() (sessionID, authURL string, err error)
	PollCLISession(sessionID string) (status, token, userID string, err error)
}

// Member 워크스페이스 멤버.
type Member struct {
	UserID   string
	Role     string
	JoinedAt string
}
