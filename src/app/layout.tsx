import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import RootShell from "@/components/RootShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "지도 애플리케이션",
    description: "Next.js로 만든 지도 검색 애플리케이션",
};

export default function RootLayout({ children,}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={"h-full"}>
            <body className={`${inter.variable} h-full`}>

            <RootShell>
                {children}
            </RootShell>
            </body>
        </html>
    );
}
