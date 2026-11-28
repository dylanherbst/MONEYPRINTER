'use client';
import { useRef } from 'react';
import type { MouseEvent } from 'react';
import { runMotion } from '../../lib/motion/run';

/**
 * The FAQs as native <details> (they open and close without JavaScript). C07: with JavaScript the answer grows or
 * collapses in 200ms and the + turns into ×. No scrolling is changed. Reduced motion: instant.
 */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const busy = useRef(new WeakSet<Element>());
  const toggle = (e: MouseEvent<HTMLElement>) => {
    const details = e.currentTarget.parentElement as HTMLDetailsElement;
    const body = details.querySelector<HTMLElement>('.faq-a');
    const ind = details.querySelector<HTMLElement>('.faq-ind');
    if (!body) return;
    e.preventDefault();
    if (busy.current.has(details)) return;
    busy.current.add(details);
    const opening = !details.open;
    if (opening) details.open = true;
    runMotion('C07', { focus: body, overlay: ind }, {
      params: { open: opening, height: body.scrollHeight },
      onEnd: () => { if (!opening) details.open = false; busy.current.delete(details); },
    });
  };
  return (
    <div className="cells-faq faq-c07">
      {items.map((f) => (
        <details key={f.q}>
          <summary onClick={toggle}>{f.q}<span className="faq-ind" aria-hidden="true">+</span></summary>
          <div className="faq-a"><p>{f.a}</p></div>
        </details>
      ))}
    </div>
  );
}
