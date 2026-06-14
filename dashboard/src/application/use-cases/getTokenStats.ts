import type { IDashboardRepository } from "@/domain/ports";
import type { TokenStats } from "@/domain/entities";

export async function getTokenStats(
  repo: IDashboardRepository,
  workspaceId: string,
  days = 30,
  branch?: string
): Promise<TokenStats> {
  return repo.getTokenStats(workspaceId, days, branch);
}
