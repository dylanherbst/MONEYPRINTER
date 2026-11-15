// The public site's one small icon set: 24px grid, 1.7px round strokes, drawn in the current text colour.
const paths = {
  menu: <path d="M4 8h16M4 16h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUp: <path d="M7 17L17 7M9 7h8v8" />,
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />,
  leaf: <path d="M12 21c0-5 0-8 4.5-12.5C18.5 6.5 20 6 21 6c0 1-.5 2.5-2.5 4.5C14 15 12 16 12 21zm0 0c0-3.5-1-6-4-8.5C6.5 11.3 5 11 4 11c0 1 .4 2.3 2 3.8C8.6 17.4 12 18 12 21z" />,
  idea: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z" />,
  build: <path d="M4 7l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4" />,
  launch: <path d="M5 19l3.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L5 19zM13.5 7.5l3 3" />,
  product: <path d="M7 3h7l4 4v14H7V3zM14 3v4h4M10 12h5M10 16h5" />,
  shop: <path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" />,
  post: <path d="M4 5h16v11H9l-5 4V5zM8 9h8M8 12.5h5" />,
} as const;
export type IconName = keyof typeof paths;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="amp-i" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}
