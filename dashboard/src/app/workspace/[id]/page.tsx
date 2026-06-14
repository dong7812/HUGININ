import { WorkspaceDashboard } from "@/presentation/components/WorkspaceDashboard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceDashboardPage({ params }: Props) {
  const { id } = await params;
  return <WorkspaceDashboard workspaceId={id} />;
}
