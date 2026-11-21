import { permanentRedirect } from 'next/navigation';

// Learn more was split into How it works, FAQs and About us (22 Nov 2026).
export default function LearnPage() {
  permanentRedirect('/how-it-works');
}
