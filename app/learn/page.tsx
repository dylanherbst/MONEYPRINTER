import { permanentRedirect } from 'next/navigation';

// The old Learn more address now opens How it works.
export default function LearnPage() {
  permanentRedirect('/how-it-works');
}
