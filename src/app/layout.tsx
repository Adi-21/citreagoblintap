import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PrivyCitreaWrapper as PrivyWrapper } from "@/config/privy";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Citrea Slingers - Skill-Based Blockchain Game",
  description: "A skill-based physics puzzler game on the Citrea blockchain. Bet cBTC and use your slingshot skills to defeat goblins and earn rewards!",
  keywords: "blockchain game, citrea, cBTC, slingshot, physics game, web3 gaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyWrapper>
          {children}
        </PrivyWrapper>
      </body>
    </html>
  );
}
