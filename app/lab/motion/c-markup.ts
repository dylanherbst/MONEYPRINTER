// Demo markup for the C-series presets in the development studio. Illustrative data only.
// Each demo is sized for the studio's 350×260 ".stage.wide" box.
export function cMarkup(id: string, variant: string): string {
  const s = '<div class="shell"></div>';
  switch (id) {
    case 'C01': // one element, two layouts: a list row (ghost marks its old box) becomes the detail panel
      return s + `<div class="label">Shared-element morph · list row → detail</div>
        <div class="c01-ghost">Quote Q-0142</div>
        <div class="card c01-box" data-t="focus"><span class="c01-row" data-t="overlay">Quote Q-0142 · draft</span>
          <b class="" data-t="node">Quote Q-0142</b><span class="tiny" data-t="node">Draft from your price list</span><div class="line" data-t="node"></div><div class="line short" data-t="node"></div></div>`;
    case 'C02':
      return s + `<div class="label">Connector routing · one path, one token</div>
        <svg class="c02-svg" viewBox="0 0 350 260" aria-hidden="true">
          <path d="M70 190 C 120 60, 230 60, 280 120" class="c02-base"/>
          <path d="M70 190 C 120 60, 230 60, 280 120" class="c02-path" data-t="beam"/>
          <circle r="16" cx="70" cy="190" class="c02-node"/><text x="70" y="226" text-anchor="middle" class="c02-t">Integrations</text>
          <circle r="16" cx="280" cy="120" class="c02-node"/><circle r="22" cx="280" cy="120" class="c02-ring" data-t="overlay"/><text x="280" y="156" text-anchor="middle" class="c02-t">Job Manager</text>
          <circle r="6" cx="0" cy="0" class="c02-token" data-t="focus"/></svg>`;
    case 'C03':
      return s + `<div class="label">Workflow progress · step 2 → 3</div>
        <div class="c03-rail"><div class="c03-fill" data-t="beam"></div>${[1, 2, 3, 4].map((n) => `<span data-t="node" class="c03-m${n <= 2 ? ' done' : ''}${n === 3 ? ' on' : ''}">${n}</span>`).join('')}</div>
        ${['Step 1 · Enquiry in', 'Step 2 · Reply drafted', 'Step 3 · Quote drafted from your price list', 'Step 4 · Booked (demo)'].map((t, i) => `<div class="card c03-p" data-t="layer" style="opacity:${i === 2 ? 1 : 0}">${t}</div>`).join('')}`;
    case 'C04':
      return s + `<div class="label">Approval gate · ${variant === 'unlock' ? 'owner approves' : 'draft waits'}</div>
        <div class="card c04-draft" data-t="focus"><b>Draft reply</b><span class="tiny">to Priya · not sent</span></div>
        <div class="c04-gate" data-t="beam"></div>
        <span class="c04-st c04-wait" data-t="node">Waiting for your OK</span><span class="c04-st c04-ok" data-t="node">Approved by you (demo)</span>
        <span class="c04-btn" data-t="overlay">Approve</span>`;
    case 'C05':
      return s + `<div class="label">Directional glass reflection · move the pointer over the card</div>
        <div class="card c05-card" data-t="focus" data-c05><b>Growth</b><span class="tiny">Pointer or focus highlight; the card never tilts.</span></div>`;
    case 'C06':
      return s + `<div class="c06-glow" data-t="beam"></div><div class="c06-copy"><b>Your business deserves a team behind it.</b><span class="tiny">Text never moves.</span></div>`;
    case 'C07':
      return s + `<div class="label">Accordion · ${variant === 'close' ? 'collapse' : 'expand'}</div>
        <div class="card c07"><div class="c07-sum"><b>Will it send anything without me?</b><span class="c07-ind" data-t="overlay">+</span></div>
        <div class="c07-body" data-t="focus"><p class="tiny">No. Every customer message, quote and action is a draft until you approve it.</p></div></div>`;
    case 'C08':
      return s + `<div class="label">Navigation sheet · ${variant === 'close' ? 'close' : 'open'}</div>
        <div class="c08-phone"><div class="c08-bar">◈ <span>Menu</span></div><div class="c08-sheet" data-t="focus">${['Home', 'How it works', 'Ecosystem', 'FAQs', 'About us'].map((l) => `<span class="" data-t="node">${l}</span>`).join('')}</div></div>`;
    case 'C09':
      return `<div class="c09-frame"><div class="c09-head shell">◈ Header stays still</div><div class="c09-page" data-t="layer"><b>How it works</b><div class="line"></div><div class="line short"></div></div><div class="c09-page c09-next" data-t="layer"><b>Ecosystem</b><div class="line short"></div><div class="line"></div></div></div>`;
    case 'C10':
      return s + `<div class="label">Masked detail reveal</div><div class="card c10" data-t="focus"><b>Shared record</b><span class="tiny">Services and prices · Customers · Jobs · Invoices</span><div class="line"></div></div><div class="c10-edge" data-t="beam"></div>`;
    case 'C11':
      return s + `<div class="label">Integration handshake</div><div class="c11"><span class="card c11-a" data-t="node">Integrations</span><span class="c11-link" data-t="beam"></span><span class="card c11-b" data-t="node">Calendar</span></div><span class="c11-st" data-t="overlay">Illustrative demo · not connected</span>`;
    case 'C12':
      return s + `<div class="label">Contextual focus zoom · ${variant === 'exit' ? 'reset' : 'zoom'}</div><div class="c12-view"><div class="c12-cam stage-cam">${['Enquiries', 'Quotes', 'Payments', 'Weekly fixes'].map((n, i) => `<div class="card c12-p" data-t="${i === 1 ? 'focus' : 'node'}"><b>${n}</b><div class="line"></div></div>`).join('')}</div></div>`;
  }
  return s;
}

export const C_VARIANTS: Record<string, string[]> = { C04: ['arrive', 'unlock'], C07: ['open', 'close'], C08: ['open', 'close'], C12: ['enter', 'exit'] };
