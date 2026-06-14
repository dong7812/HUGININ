import type { IDashboardRepository } from "@/domain/ports";
import type { WorkspaceOverview } from "@/domain/entities";

// SRP: 이 함수는 overview 조회 하나만 담당
export async function getDashboardOverview(
  repo: IDashboardRepository,
  workspaceId: string
): Promise<WorkspaceOverview> {
  return repo.getOverview(workspaceId);
}
