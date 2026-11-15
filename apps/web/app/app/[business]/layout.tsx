import type { ReactNode } from 'react';
import { WorkspaceNav } from './workspace-nav';

// Every owner-workspace page for one business shares the navigation bar (owner request, 15 Nov).
export default async function BusinessLayout({ children, params }: { children: ReactNode; params: Promise<{ business: string }> }) {
  const { business } = await params;
  return (
    <>
      <WorkspaceNav business={business} />
      {children}
    </>
  );
}
