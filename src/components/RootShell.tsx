"use client"; // 👈 1. 클라이언트 컴포넌트로 선언

import { useState } from "react";
import AppShell from "@/components/AppShell";
import AsideBar from "@/components/AsideBar"; // (파일명이 AsideBar.tsx라고 가정)
import MenuDrawer from "@/components/MenuDrawer";

export default function RootShell({
                                      children,
                                  }: {
    children: React.ReactNode;
}) {
    // 2. (핵심) MenuDrawer의 'open' 상태를 여기서 관리
    const [menuOpen, setMenuOpen] = useState(false);

    return (
            <AppShell mode="desktop" width={1280}>
            <div className="flex h-full w-full ">
                {/* 3. AsideBar에 'onMenuOpen' 함수를 prop으로 전달 */}
                <AsideBar onMenuOpen={() => setMenuOpen(true)} />

                {/* 4. 메인 컨텐츠 (page.tsx가 됨) */}
                <main className="flex-1 relative h-full">
                    {children}
                </main>
            </div>

            <MenuDrawer
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            />

        </AppShell>
    );
}