// Turns the storefront validator's terse "path: rule" strings into plain English a seller can act on.

const SINGULAR: Record<string, string> = {
  products: 'Product', bundles: 'Bundle', sections: 'Section', faq: 'FAQ item', trust: 'Trust point',
  description: 'Description line', includes: 'Included item', tags: 'Tag', refund: 'Refund policy line',
  privacy: 'Privacy policy line', terms: 'Terms line', productSlugs: 'Bundle product',
};

const words = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

/** `products[0].title` becomes `Product 1 title`. */
export function humanPath(path: string): string {
  const out: string[] = [];
  for (const seg of path.split('.')) {
    const m = /^([A-Za-z]+)(?:\[(\d+)\])?$/.exec(seg);
    if (!m) { out.push(seg); continue; }
    const [, name, idx] = m;
    if (idx !== undefined) out.push(`${SINGULAR[name] ?? words(name)} ${Number(idx) + 1}`);
    else out.push(words(name));
  }
  const text = out.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const dollars = (minor: number) => `$${(minor / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function plainError(raw: string): string {
  const i = raw.indexOf(': ');
  if (i < 0) return raw;
  const label = humanPath(raw.slice(0, i));
  const rule = raw.slice(i + 2);
  let m: RegExpExecArray | null;
  if ((m = /^text (\d+)-(\d+) chars$/.exec(rule))) {
    return Number(m[1]) <= 1 ? `${label} must be filled in and at most ${m[2]} characters.` : `${label} must be ${m[1]} to ${m[2]} characters.`;
  }
  if (rule === 'angle brackets are not allowed') return `${label} cannot contain the < or > characters.`;
  if ((m = /^one of (.+)$/.exec(rule))) return `${label} must be one of: ${m[1]}.`;
  if ((m = /^whole cents between (\d+) and (\d+)$/.exec(rule))) return `${label} must be a price between ${dollars(Number(m[1]))} and ${dollars(Number(m[2]))}.`;
  if ((m = /^list of (\d+)-(\d+)$/.exec(rule))) return `${label} needs ${m[1]} to ${m[2]} items.`;
  if ((m = /^(\d+)-(\d+) items$/.exec(rule))) return `${label} needs ${m[1]} to ${m[2]} items.`;
  if (rule === 'must exceed price') return `${label} must be higher than the normal price.`;
  if (rule === 'valid email') return `${label} must be a real email address.`;
  if (rule === 'boolean') return `${label} must be yes or no.`;
  if (rule === 'object') return `${label} is missing.`;
  if (rule === 'duplicate') return `${label} is already used by another item.`;
  return `${label}: ${rule}.`;
}

export const plainErrors = (raw: string[]): string[] => raw.map(plainError);
