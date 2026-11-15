// BrandMark: the AiMoneyPrinter logo (the owner's gradient ribbon mark, public/brand/aimp-logo.webp). Decorative by
// default, because the name is nearly always written beside or under it; pass `label` where the mark stands alone.
export function BrandMark({ size = 40, label, className = '' }: { size?: number; label?: string; className?: string }) {
  return <img className={`plg-brand-mark ${className}`.trim()} src="/brand/aimp-logo.webp" alt={label ?? ''} width={size} height={size} decoding="async" />;
}
