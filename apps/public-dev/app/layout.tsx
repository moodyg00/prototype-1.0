import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Public Dev — Static Site IDE',
  description: 'Lightweight static-site IDE for editing and deploying plain HTML/CSS/JS projects.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
