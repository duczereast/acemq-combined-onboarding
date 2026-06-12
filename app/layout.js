import localFont from 'next/font/local';
import './globals.css';

const skModernist = localFont({
  src: [{ path: './fonts/Sk-Modernist-Regular.otf', weight: '400', style: 'normal' }],
  display: 'swap',
  variable: '--font-sk-modernist',
});

export const metadata = {
  title: 'AceMQ — Onboarding',
  description: 'Complete your AceMQ onboarding for RabbitMQ engagement, support, and licensing.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={skModernist.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
