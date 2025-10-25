// components/AsideBar.tsx (새 파일)

"use client"; // 👈 1. 클라이언트 컴포넌트로 선언

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

// 1. (중요) 부모로부터 'onMenuOpen' 함수를 받도록 props 타입 정의
interface AsideBarProps {
    onMenuOpen: () => void;
}
const mobileNavLabels = ["메뉴", "지도", "맵", "레이어"];
export default function AsideBar({ onMenuOpen }: AsideBarProps) {
    // 2. usePathname 훅으로 현재 URL 경로를 가져옴
    const pathname = usePathname();

    return (
        // 3. (예시) page.tsx에서 가져온 aside 마크업
        <>
            <aside className="hidden md:block w-16 bg-white/95 border-r border-gray-200 shadow-xl z-[1200]">
                <div className="h-full flex flex-col items-center gap-2 py-2">

                    <button
                        aria-label="menu"
                        onClick={onMenuOpen} // 4. 부모가 준 함수를 클릭 시 호출
                        className="w-10 h-10 grid place-items-center rounded-xl bg-blue-600 text-white shadow"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24">
                            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {/* 4. '지도' 버튼: Link 컴포넌트로 / (또는 /map) 경로로 이동 */}
                    <Link
                        href="/"
                        aria-label="지도"
                        // 5. 현재 경로(pathname)가 '/'일 때 활성 스타일 적용
                        className={`w-10 h-10 grid place-items-center rounded-xl shadow ${
                            pathname === '/' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
                        }`}
                    >
                        {/* (지도 아이콘) */}
                        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5zm0 9l9 5-9 5-9-5 9-5z" fill="currentColor"/></svg>
                    </Link>

                    {/* 6. '그림' 버튼: /art 경로로 이동 (예시) */}
                    <Link
                        href="/CongestionMap"
                        aria-label="그림"
                        className={`w-10 h-10 grid place-items-center rounded-xl shadow ${
                            pathname === '/CongestionMap' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
                        }`}
                    >
                        {/* (그림 아이콘) */}
                        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z" fill="currentColor"/></svg>
                    </Link>

                    {/* 7. '설정' 버튼: /settings 경로로 이동 (예시) */}
                    <Link
                        href="/settings"
                        aria-label="설정"
                        className={`w-10 h-10 grid place-items-center rounded-xl shadow ${
                            pathname === '/settings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
                        }`}
                    >
                        {/* (설정 아이콘) */}
                        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 8v5l4 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                    </Link>
                </div>
            </aside>

            <nav className="md:hidden absolute left-0 right-0 bottom-0 z-[1300]">
                <div className="
            h-16 w-full backdrop-blur-md bg-white/80
            border-t border-gray-200 rounded-t-2xl
            shadow-[0_-8px_24px_rgba(0,0,0,0.15)]
            flex items-center px-2
            divide-x divide-gray-200/60
            pb-[env(safe-area-inset-bottom)]
          ">
                    {mobileNavLabels.map((label) => (
                        <button
                            key={label}
                            // 5. (중요) 모바일에서도 부모의 setMenuOpen state를 사용
                            onClick={label === "메뉴" ? onMenuOpen : undefined}
                            className="flex-1 h-10 mx-2 rounded-xl
                         hover:bg-gray-50/70 active:scale-95 transition
                           focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-blue-500/50"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </nav>
        </>
    );
}