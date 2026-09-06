import type { Metadata } from 'next';
import '../src/lib/fonts';
import './globals.css';
export const metadata: Metadata = { title: 'OpenTrackerFi — Plan. Manage. Track.', description: 'Your plan. Your pace. Every peso on track.', manifest: '/manifest.webmanifest' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className="font-sans antialiased">{children}</body></html>; }
