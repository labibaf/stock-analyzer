import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IDX Swing Analyzer | Analisis Saham Indonesia & AI Copilot',
  description:
    'Aplikasi analisis swing trading saham Bursa Efek Indonesia (IHSG / IDX) dengan kalkulasi indikator teknikal deterministik dan AI Copilot anti-halusinasi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#070a12] text-slate-100 antialiased min-h-screen flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
