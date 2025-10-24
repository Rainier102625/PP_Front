import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import "leaflet/dist/leaflet.css";


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "지도 애플리케이션",
    description: "Next.js로 만든 지도 검색 애플리케이션",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body className={inter.variable}>
            {children}
            <Script
                strategy="beforeInteractive"
                type="text/javascript"
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=gbw3otoupx&submodules=geocoder,places&language=en`}
            />
        </body>
        </html>
    );
}
//
// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import Home from "./pages/Home";          // 네가 만든 홈 파일명에 맞게 수정 (HomePage.tsx면 ./pages/HomePage)
// import SearchPage from "./pages/SearchPage";
// import RoutePage from "./pages/RoutePage";
//
// function App() {
//     return (
//         <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/search" element={<SearchPage />} />
//             <Route path="/route" element={<RoutePage />} />
//         </Routes>
//     );
// }
//
// export default App;
