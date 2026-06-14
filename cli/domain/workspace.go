package domain

// Workspace 워크스페이스 도메인 모델.
type Workspace struct {
	ID   string
	Name string
	Slug string
}

// WorkspaceRole 워크스페이스 레벨 역할.
type WorkspaceRole string

const (
	RoleOwner  WorkspaceRole = "owner"
	RoleAdmin  WorkspaceRole = "admin"
	RoleMember WorkspaceRole = "member"
	RoleGuest  WorkspaceRole = "guest"
)
