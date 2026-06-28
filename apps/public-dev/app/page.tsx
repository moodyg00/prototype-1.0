import { Ide } from '@/src/components/Ide';
import { listProjects } from '@/src/lib/projects';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const projects = await listProjects();
  return <Ide initialProjects={projects} />;
}
