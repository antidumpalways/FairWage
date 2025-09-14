import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { WalletProvider } from '@/contexts/WalletContext';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import { BrowserWarning } from '@/components/BrowserWarning';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FairWage - Professional Blockchain Payroll',
  description: 'Professional earned wage access platform powered by Stellar blockchain. Streamline payroll with real-time wage accrual and instant withdrawals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <WalletProvider>
            <BrowserWarning />
            <Header />
            {children}
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}