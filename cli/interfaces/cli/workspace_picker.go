package cli

import (
	"fmt"

	"github.com/manifoldco/promptui"

	"huginin/application"
	"huginin/domain"
	"huginin/infrastructure/config"
)

const joinItem = "＋ 초대코드로 참여..."
const createItem = "＋ 새 워크스페이스 만들기..."

// runWorkspacePicker 워크스페이스 목록을 보여주고 선택된 워크스페이스를 config에 저장한다.
func runWorkspacePicker(wsUC *application.WorkspaceUseCase, cfg *config.Config) error {
	workspaces, err := wsUC.List()
	if err != nil {
		return fmt.Errorf("워크스페이스 목록 조회 실패: %w", err)
	}

	if len(workspaces) == 0 {
		fmt.Println("워크스페이스가 없습니다.")
		fmt.Println()
		action, err := selectEmptyAction()
		if err != nil {
			if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
				return nil
			}
			return err
		}
		switch action {
		case "create":
			return createWorkspaceFlow(wsUC, cfg)
		case "join":
			return joinWorkspaceFlow(wsUC, cfg, nil)
		}
		return nil
	}

	selected, joinCode, err := selectWorkspace(workspaces)
	if err != nil {
		if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
			return nil
		}
		return err
	}

	if joinCode {
		return joinWorkspaceFlow(wsUC, cfg, nil)
	}
	if selected == nil {
		return createWorkspaceFlow(wsUC, cfg)
	}

	cfg.WorkspaceID = selected.ID
	cfg.WorkspaceName = selected.Name
	fmt.Printf("✓ 워크스페이스: %s\n", selected.Name)
	return config.Save(cfg)
}

func selectEmptyAction() (string, error) {
	sel := promptui.Select{
		Label: "워크스페이스",
		Items: []string{createItem, joinItem},
		Templates: &promptui.SelectTemplates{
			Label:    "{{ . }}",
			Active:   "▸ {{ . | cyan }}",
			Inactive: "  {{ . }}",
			Selected: "✓ {{ . | green }}",
		},
	}
	idx, _, err := sel.Run()
	if err != nil {
		return "", err
	}
	if idx == 0 {
		return "create", nil
	}
	return "join", nil
}

func createWorkspaceFlow(wsUC *application.WorkspaceUseCase, cfg *config.Config) error {
	namePrompt := promptui.Prompt{Label: "워크스페이스 이름"}
	name, err := namePrompt.Run()
	if err != nil {
		if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
			return nil
		}
		return err
	}
	if name == "" {
		return fmt.Errorf("이름을 입력해주세요")
	}
	id, _, err := wsUC.Create(name)
	if err != nil {
		return fmt.Errorf("생성 실패: %w", err)
	}
	cfg.WorkspaceID = id
	cfg.WorkspaceName = name
	fmt.Printf("✓ 워크스페이스 생성: %s\n", name)
	return config.Save(cfg)
}

func joinWorkspaceFlow(wsUC *application.WorkspaceUseCase, cfg *config.Config, existing []domain.Workspace) error {
	codePrompt := promptui.Prompt{Label: "초대코드 입력"}
	code, err := codePrompt.Run()
	if err != nil {
		if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
			return nil
		}
		return err
	}
	wsID, _, err := wsUC.Join(code)
	if err != nil {
		return fmt.Errorf("참여 실패: %w", err)
	}
	updated, listErr := wsUC.List()
	if listErr == nil {
		for _, w := range updated {
			if w.ID == wsID {
				cfg.WorkspaceID = w.ID
				cfg.WorkspaceName = w.Name
				fmt.Printf("✓ 워크스페이스 참여: %s\n", w.Name)
				return config.Save(cfg)
			}
		}
	}
	cfg.WorkspaceID = wsID
	cfg.WorkspaceName = wsID
	fmt.Printf("✓ 워크스페이스 참여: %s\n", wsID)
	return config.Save(cfg)
}

// selectWorkspace returns (selected, isJoin, err). selected==nil && !isJoin means create.
func selectWorkspace(workspaces []domain.Workspace) (*domain.Workspace, bool, error) {
	items := make([]string, 0, len(workspaces)+2)
	for _, w := range workspaces {
		items = append(items, fmt.Sprintf("%-28s  /%s", w.Name, w.Slug))
	}
	items = append(items, createItem, joinItem)

	sel := promptui.Select{
		Label: "워크스페이스 선택  (↑↓ 이동, Enter 확인)",
		Items: items,
		Templates: &promptui.SelectTemplates{
			Label:    "{{ . }}",
			Active:   "▸ {{ . | cyan }}",
			Inactive: "  {{ . }}",
			Selected: "✓ {{ . | green }}",
		},
		Size: 10,
	}

	idx, _, err := sel.Run()
	if err != nil {
		return nil, false, err
	}

	if idx == len(workspaces)+1 {
		return nil, true, nil // 초대코드로 참여
	}
	if idx == len(workspaces) {
		return nil, false, nil // 새 워크스페이스 만들기
	}

	w := workspaces[idx]
	return &w, false, nil
}
