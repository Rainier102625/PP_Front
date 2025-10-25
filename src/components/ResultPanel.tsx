// src/components/ResultPanel.tsx

"use client";

import React from "react";
// --- 👇 [수정] AppPlace 타입을 MapContainer에서 import ---
// (경로가 다르면 "@/components/MapContainer" 등으로 수정하세요)
import type { AppPlace } from "./MapContainer";

type Props = {
    open: boolean;
    // --- 👇 [수정] items 타입을 AppPlace[]로 변경 ---
    items: AppPlace[];
    activeId: string | null;
    // --- 👇 [수정] onSelect 타입을 AppPlace로 변경 ---
    onSelect: (item: AppPlace) => void;
    onClose: () => void;

    // (옵션 props는 동일)
    panelWidth?: number;
    topMobileRem?: number;
    topDesktopRem?: number;
    className?: string;
};

// --- ❌ [삭제] isPlace 타입 가드 함수 (더 이상 필요 없음) ---

export default function ResultPanel({
                                        open,
                                        items,
                                        activeId,
                                        onSelect,
                                        onClose,
                                        panelWidth = 360,
                                        topMobileRem = 9,
                                        topDesktopRem = 5,
                                        className,
                                    }: Props) {
    if (!open) return null;

    return (
        <>
            <aside
                className={[
                    "absolute left-0 right-0 bottom-4 z-[1200]",
                    "top-[var(--panel-top-mobile)]",
                    "md:top-[var(--panel-top-desktop)] md:right-auto md:left-4",
                    "md:w-[var(--panel-w)] md:max-w-[40vw]",
                    className || "",
                ].join(" ")}
                style={
                    {
                        ["--panel-top-mobile" as any]: `${topMobileRem}rem`,
                        ["--panel-top-desktop" as any]: `${topDesktopRem}rem`,
                        ["--panel-w" as any]: `${panelWidth}px`,
                    } as React.CSSProperties
                }
            >
                <div className="h-full md:h-auto md:max-h-[calc(100%-2rem)] bg-white rounded-none md:rounded-2xl shadow-none md:shadow-xl border-0 md:border md:border-gray-200 flex flex-col">
                    {/* 모바일 전용 헤더 (동일) */}
                    <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10 md:hidden">
                        <button
                            aria-label="뒤로가기"
                            onClick={onClose}
                            className="h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50 grid place-items-center"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* --- 👇 [수정] 렌더링 로직 (AppPlace 기준으로 단순화) --- */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {items.map((item) => {
                            const active = item.id === activeId;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item)} // 👈 item은 AppPlace
                                    className={[
                                        "w-full text-left rounded-xl border p-3 transition",
                                        active
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:bg-gray-50",
                                    ].join(" ")}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* 1. name (통합) */}
                                        <h3 className="font-semibold">{item.name}</h3>

                                        {/* 2. congestionLevel (통합) */}
                                        {item.congestionLevel && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                                                {item.congestionLevel}
                                            </span>
                                        )}
                                    </div>
                                    {/* 3. address (통합) */}
                                    <p className="text-sm text-gray-600 mt-1 truncate">{item.address}</p>

                                    {/* 4. distance (통합) */}
                                    {typeof item.distance === "number" && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {item.distance.toFixed(2)} km
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                        {items.length === 0 && (
                            <div className="p-4 text-sm text-gray-500">결과가 없습니다.</div>
                        )}
                    </div>
                </div>
            </aside>

            {/* 데스크톱: 패널 우측 닫기 핸들 (동일) */}
            <button
                aria-label="패널 닫기"
                onClick={onClose}
                className="hidden md:flex items-center justify-center absolute z-[1300] top-1/2 -translate-y-1/2 rounded-l-none rounded-r-xl border border-gray-200 bg-white shadow hover:bg-gray-50 active:scale-95"
                style={
                    {
                        left: `calc(${panelWidth}px + 1rem - 12px)`,
                        width: "24px",
                        height: "48px",
                    } as React.CSSProperties
                }
            >
                <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M14 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
            </button>
        </>
    );
}