import { permanentRedirect } from 'next/navigation';

// The questions now live on the Learn more page.
export default function FaqPage() {
  permanentRedirect('/learn#faqs');
}
