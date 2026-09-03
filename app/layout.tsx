import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = { title: 'OpenTrackerFi — Plan. Manage. Track.', description: 'Your plan. Your pace. Every peso on track.', manifest: '/manifest.webmanifest' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>; }
