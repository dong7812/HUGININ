import type { IDashboardRepository } from "@/domain/ports";
import type { ActivityDay } from "@/domain/entities";

export async function getActivity(
  repo: IDashboardRepository,
  workspaceId: string,
  days = 30
): Promise<ActivityDay[]> {
  return repo.getActivity(workspaceId, days);
}
