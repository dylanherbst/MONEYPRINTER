/** VENTRA Liquid Glass — window.VentraGlass. Docs only. */
type IconName = 'home'|'leads'|'sparkle'|'calendar'|'more'|'bell'|'user'|'search'|'plus'|'chat'|'headset'|'chart'|'arrow'|'up'|'down'|'check'|'chevron'|'close'|'phone'|'alert';
type Tone = 'violet'|'teal'|'magenta'|'indigo';
export interface IconProps { name: IconName; size?: number; strokeWidth?: number; gradient?: Tone; className?: string }
export interface WordmarkProps { href?: string; markOnly?: boolean; id?: string; className?: string }
/** variant: primary = violet liquid (one per view); secondary = teal; glass = default; ghost = hairline only. */
export interface GlassButtonProps { variant?: 'primary'|'secondary'|'glass'|'ghost'; size?: 'sm'|'md'|'lg'; icon?: IconName; iconRight?: IconName; block?: boolean; href?: string; disabled?: boolean; onClick?: () => void; children: React.ReactNode }
/** label is required: it is the accessible name. */
export interface IconButtonProps { icon: IconName; label: string; dot?: boolean; variant?: 'glass'|'violet'; size?: 'sm'|'md'; onClick?: () => void }
export interface GlassCardProps { as?: string; tight?: boolean; promo?: boolean; className?: string; children: React.ReactNode }
export interface IconTileProps { icon: IconName; tone?: Tone; size?: 'sm'|'md' }
export interface BadgeProps { tone?: 'violet'|'success'|'warning'|'danger'|'neutral'; icon?: IconName; trend?: 'up'|'down'; children: React.ReactNode }
export interface StatCardProps { icon: IconName; tone?: Tone; label: string; value: React.ReactNode; badge?: React.ReactNode; control?: React.ReactNode; onMenu?: () => void }
export interface AnalyticsMetric { value: string; label: string; delta?: string; trend?: 'up'|'down' }
export interface AnalyticsCardProps { title: string; points: number[]; metrics: AnalyticsMetric[]; note?: string }
export interface SearchFieldProps { placeholder?: string; label?: string; value?: string; onChange?: (e: any) => void; action?: { icon: IconName; label: string; onClick?: () => void } }
export interface TextFieldProps { label?: string; hint?: string; state?: 'valid'|'invalid'; id?: string; value?: string; defaultValue?: string; placeholder?: string; onChange?: (e: any) => void }
export interface SelectPillProps { label: string; options: (string|{value:string;label:string})[]; value?: string; defaultValue?: string; onChange?: (e: any) => void }
export interface SegmentedTabsProps { items: string[]; label: string; value?: string; defaultValue?: string; onChange?: (v: string) => void }
export interface ToggleProps { label?: string; ariaLabel?: string; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void }
export interface CheckboxProps { label: string; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void }
export interface TopBarProps { unread?: number; homeHref?: string }
export interface BottomNavItem { id: string; label: string; icon: IconName; href?: string }
export interface BottomNavProps { active?: string; items?: BottomNavItem[] }
export interface AppFrameProps { children: React.ReactNode }
export interface ChipProps { icon?: IconName; onClick?: () => void; children: React.ReactNode }
export interface PromoCardProps { title: string; text?: string; action?: { label: string; icon?: IconName; onClick?: () => void } }
