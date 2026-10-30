import type {ReactNode} from 'react';
import VentraShell from '../ui/ventra-shell';
export default function Layout({children}:{children:ReactNode}){return <VentraShell><div className="v-editor v-legacy-route">{children}</div></VentraShell>;}
