package cli

import (
	"fmt"

	"github.com/manifoldco/promptui"

	"huginin/application"
	"huginin/domain"
	"huginin/infrastructure/config"
)

const joinItem = "＋ 초대코드로 참여..."

// runWorkspacePicker 워크스페이스 목록을 보여주고 선택된 워크스페이스를 config에 저장한다.
func runWorkspacePicker(wsUC *application.WorkspaceUseCase, cfg *config.Config) error {
	workspaces, err := wsUC.List()
	if err != nil {
		return fmt.Errorf("워크스페이스 목록 조회 실패: %w", err)
	}

	if len(workspaces) == 0 {
		fmt.Println("워크스페이스가 없습니다. 대시보드에서 생성하거나 초대코드로 참여하세요.")
		fmt.Println("  https://huginin.vercel.app")
		return nil
	}

	selected, err := selectWorkspace(workspaces)
	if err != nil {
		if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
			return nil
		}
		return err
	}

	if selected == nil {
		// 초대코드로 참여
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
		// 참여 후 목록 재조회해서 이름 확보
		updated, listErr := wsUC.List()
		if listErr == nil {
			for _, w := range updated {
				if w.ID == wsID {
					selected = &w
					break
				}
			}
		}
		if selected == nil {
			cfg.WorkspaceID = wsID
			cfg.WorkspaceName = wsID
			fmt.Printf("✓ 워크스페이스 참여: %s\n", wsID)
			return config.Save(cfg)
		}
		fmt.Printf("✓ 워크스페이스 참여 완료\n")
	}

	cfg.WorkspaceID = selected.ID
	cfg.WorkspaceName = selected.Name
	fmt.Printf("✓ 워크스페이스: %s\n", selected.Name)
	return config.Save(cfg)
}

func selectWorkspace(workspaces []domain.Workspace) (*domain.Workspace, error) {
	items := make([]string, 0, len(workspaces)+1)
	for _, w := range workspaces {
		items = append(items, fmt.Sprintf("%-28s  /%s", w.Name, w.Slug))
	}
	items = append(items, joinItem)

	templates := &promptui.SelectTemplates{
		Label:    "{{ . }}",
		Active:   "▸ {{ . | cyan }}",
		Inactive: "  {{ . }}",
		Selected: "✓ {{ . | green }}",
	}

	sel := promptui.Select{
		Label:     "워크스페이스 선택  (↑↓ 이동, Enter 확인)",
		Items:     items,
		Templates: templates,
		Size:      10,
	}

	idx, _, err := sel.Run()
	if err != nil {
		return nil, err
	}

	if idx == len(workspaces) {
		return nil, nil // 초대코드로 참여 선택됨
	}

	w := workspaces[idx]
	return &w, nil
}
