import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ChatWidget from '@/components/chat/ChatWidget'

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team Esper - AI Quiz Generator",
  description: "Generate interview-grade questions with AI",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps){
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <ChatWidget />
        </body>
      </html>
    </ClerkProvider>
  );
}
