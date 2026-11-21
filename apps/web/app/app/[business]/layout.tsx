import type { ReactNode } from 'react';
import { WorkspaceNav } from './workspace-nav';
import { AppBackdrop } from './app-backdrop';
import { PageStage } from './page-stage';
import { buildSidePanels } from './carousel/side-data';
import { loadOverviewVm } from './_server/overview-load';
import './workspace-skin.css';

// Every owner-workspace page for one business shares the navigation bar (owner request, 15 Nov).
export default async function BusinessLayout({ children, params }: { children: ReactNode; params: Promise<{ business: string }> }) {
  const { business } = await params;
  const vm = await loadOverviewVm(business);
  const sides = vm ? buildSidePanels(vm) : {};
  return (
    <>
      <AppBackdrop />
      <WorkspaceNav business={business} />
      <div className="amg amg-skin"><PageStage business={business} sides={sides}>{children}</PageStage></div>
    </>
  );
}
