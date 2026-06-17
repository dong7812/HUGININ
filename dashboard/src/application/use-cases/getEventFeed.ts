import type { IDashboardRepository } from "@/domain/ports";
import type { FeedPage } from "@/domain/entities";

export async function getEventFeed(
  repo: IDashboardRepository,
  workspaceId: string,
  limit = 15,
  offset = 0,
  branch?: string,
  dateFrom?: string,
  frame?: string,
): Promise<FeedPage> {
  return repo.getFeed(workspaceId, limit, offset, branch, dateFrom, frame);
}
