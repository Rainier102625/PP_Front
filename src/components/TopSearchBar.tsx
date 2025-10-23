"use client";
import React from "react";

type Props = {
    query: string;
    onQueryChange: (value: string) => void;
    onSearch: () => void;
    onFocus?: () => void;
    onBlur?: () => void;                 // 추가
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    isFocused: boolean;
    children: React.ReactNode;
};

const TopSearchBar = ({
                          query,
                          onQueryChange,
                          onSearch,
                          onFocus,
                          onBlur,
                          onKeyDown,
                          isFocused,
                          children,
                      }: Props) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    // 클릭으로 제안 선택할 수 있도록 약간 지연 후 닫기
    const handleBlur = () => setTimeout(() => onBlur?.(), 120);

    return (
        <header className="flex gap-2 items-center">
            <div className="relative w-full">
                <form
                    onSubmit={handleSubmit}
                    className={[
                        "pointer-events-auto flex items-center gap-2 px-[14px] h-[48px] w-full",
                        "rounded-[22px] shadow-xl shadow-black/25 cursor-text",
                        "bg-white text-gray-900 border border-gray-200",
                        isFocused ? "rounded-b-none" : "", // 열렸을 때 아래 모서리 제거
                    ].join(" ")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M20 20l-3.3-3.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="장소, 주소 검색"
                        className="w-full h-full bg-transparent text-gray-500 placeholder:text-[#666a73]/80 outline-none"
                        onFocus={onFocus}
                        onBlur={handleBlur}
                        onKeyDown={onKeyDown}
                    />
                </form>

                {isFocused && (
                    <div className="absolute left-0 right-0 top-full z-20">
                        <div className="bg-white shadow-lg overflow-hidden rounded-b-[22px] border border-t-0 border-gray-200">
                            <div className="max-h-[60vh] overflow-y-auto">{children}</div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopSearchBar;
