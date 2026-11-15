import { Inter } from 'next/font/google';

// One family for the whole site, self-hosted at build time by next/font (no runtime request to Google).
export const bodyFont = Inter({ subsets: ['latin'], display: 'swap', variable: '--amp-body' });
export const fontVars = bodyFont.variable;
