package http

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"huginin/domain"
)

// Client domain.APIClient 구현체.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

func New(baseURL string) *Client {
	return &Client{baseURL: baseURL, httpClient: &http.Client{}}
}

func (c *Client) post(path, token string, body any) (map[string]any, error) {
	b, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, c.baseURL+path, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("server error %d: %s", resp.StatusCode, string(data))
	}
	var result map[string]any
	json.Unmarshal(data, &result)
	return result, nil
}

func (c *Client) get(path, token string) ([]map[string]any, error) {
	req, err := http.NewRequest(http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("server error %d: %s", resp.StatusCode, string(data))
	}
	var result []map[string]any
	json.Unmarshal(data, &result)
	return result, nil
}

func (c *Client) Register(email, name, password string) (string, string, error) {
	r, err := c.post("/auth/register", "", map[string]string{
		"email": email, "name": name, "password": password,
	})
	if err != nil {
		return "", "", err
	}
	return r["access_token"].(string), r["user_id"].(string), nil
}

func (c *Client) Login(email, password string) (string, string, error) {
	r, err := c.post("/auth/login", "", map[string]string{
		"email": email, "password": password,
	})
	if err != nil {
		return "", "", err
	}
	return r["access_token"].(string), r["user_id"].(string), nil
}

func (c *Client) CreateWorkspace(token, name string) (string, string, error) {
	r, err := c.post("/workspace", token, map[string]string{"name": name})
	if err != nil {
		return "", "", err
	}
	return r["workspace_id"].(string), r["slug"].(string), nil
}

func (c *Client) JoinWorkspace(token, inviteCode string) (string, string, error) {
	r, err := c.post("/workspace/join", token, map[string]string{"invite_code": inviteCode})
	if err != nil {
		return "", "", err
	}
	return r["workspace_id"].(string), r["role"].(string), nil
}

func (c *Client) ListWorkspaces(token string) ([]domain.Workspace, error) {
	rows, err := c.get("/workspace", token)
	if err != nil {
		return nil, err
	}
	out := make([]domain.Workspace, 0, len(rows))
	for _, r := range rows {
		out = append(out, domain.Workspace{
			ID:   r["id"].(string),
			Name: r["name"].(string),
			Slug: r["slug"].(string),
		})
	}
	return out, nil
}

func (c *Client) InviteMember(token, workspaceID, role string, expiresHours int) (string, error) {
	r, err := c.post("/workspace/"+workspaceID+"/invite", token, map[string]any{
		"role": role, "expires_hours": expiresHours,
	})
	if err != nil {
		return "", err
	}
	return r["code"].(string), nil
}

func (c *Client) ListMembers(token, workspaceID string) ([]domain.Member, error) {
	rows, err := c.get("/workspace/"+workspaceID+"/members", token)
	if err != nil {
		return nil, err
	}
	out := make([]domain.Member, 0, len(rows))
	for _, r := range rows {
		out = append(out, domain.Member{
			UserID:   r["user_id"].(string),
			Role:     r["role"].(string),
			JoinedAt: r["joined_at"].(string),
		})
	}
	return out, nil
}

func (c *Client) ChangeRole(token, workspaceID, targetUserID, newRole string) error {
	_, err := c.post("/workspace/"+workspaceID+"/role", token, map[string]string{
		"target_user_id": targetUserID, "new_role": newRole,
	})
	return err
}

func (c *Client) DeleteWorkspace(token, workspaceID string) error {
	req, err := http.NewRequest(http.MethodDelete, c.baseURL+"/workspace/"+workspaceID, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		data, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("server error %d: %s", resp.StatusCode, string(data))
	}
	return nil
}

func (c *Client) LinkProject(token, workspaceID, name, gitRemote string) (string, error) {
	r, err := c.post("/project", token, map[string]any{
		"workspace_id": workspaceID, "name": name, "git_remote": gitRemote,
	})
	if err != nil {
		return "", err
	}
	return r["project_id"].(string), nil
}

func (c *Client) CreateServiceToken(token string) (string, error) {
	r, err := c.post("/auth/service-token", token, map[string]any{})
	if err != nil {
		return "", err
	}
	return r["access_token"].(string), nil
}

func (c *Client) CreateCLISession() (string, string, error) {
	r, err := c.post("/auth/cli/session", "", map[string]any{})
	if err != nil {
		return "", "", err
	}
	return r["session_id"].(string), r["auth_url"].(string), nil
}

func (c *Client) PollCLISession(sessionID string) (string, string, string, error) {
	req, err := http.NewRequest(http.MethodGet, c.baseURL+"/auth/cli/poll/"+sessionID, nil)
	if err != nil {
		return "", "", "", err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", "", "", fmt.Errorf("server error %d: %s", resp.StatusCode, string(data))
	}
	var r map[string]any
	json.Unmarshal(data, &r)
	status, _ := r["status"].(string)
	tok, _ := r["token"].(string)
	userID, _ := r["user_id"].(string)
	return status, tok, userID, nil
}

func (c *Client) CollectEvent(token, workspaceID, projectID, commitHash, prompt, response, diff, branch string) (string, error) {
	body := map[string]any{
		"workspace_id": workspaceID,
		"raw_prompt":   prompt,
		"raw_response": response,
	}
	if projectID != "" {
		body["project_id"] = projectID
	}
	if commitHash != "" {
		body["commit_hash"] = commitHash
	}
	if diff != "" {
		body["diff"] = diff
	}
	if branch != "" {
		body["branch"] = branch
	}
	r, err := c.post("/collect/event", token, body)
	if err != nil {
		return "", err
	}
	return r["event_id"].(string), nil
}
