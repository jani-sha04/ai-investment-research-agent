import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Research Desk — AI Investment Agent",
  description:
    "Give it a company name. It researches the business, the numbers, the news, and the risks — then stamps a verdict: Invest, Watch, or Pass."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-grid-paper bg-grid min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
