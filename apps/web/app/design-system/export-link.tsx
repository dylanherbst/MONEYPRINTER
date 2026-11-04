import Link from 'next/link';
import { OutlineIcon } from './primitives';

/** Outlined header button. The real "Download my data" export lives in Settings, so this opens it. Nothing is exported from here. */
export function ExportLink() {
  return <Link className="v-button v-export" href="/settings"><OutlineIcon name="share" />Export</Link>;
}
