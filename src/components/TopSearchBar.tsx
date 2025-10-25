"use client";
import React from "react";

type Props = {
    query: string;
    onQueryChange: (value: string) => void;
    onClear: () => void;
    onSearch: () => void;
    onFocus?: () => void;
    onBlur?: () => void;                 // 추가
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    isFocused: boolean;
    isLoading?: boolean;
    children?: React.ReactNode;
};


const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);
const ClearIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
    </svg>
);
const TopSearchBar = ({
                          query,
                          onQueryChange,
                          onClear,
                          onSearch,
                          onFocus,
                          onBlur,
                          onKeyDown,
                          isFocused,
                          isLoading,
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
                    {/* --- [수정] 텍스트 지우기 버튼 / 로딩 스피너 --- */}
                    <div className="flex-shrink-0 w-5 h-5">
                        {isLoading ? (
                            // 3-1. 로딩 스피너
                            <div className="w-full h-full border-t-2 border-blue-500 rounded-full animate-spin"></div>
                        ) : query ? (
                            // 3-2. 텍스트 지우기 버튼
                            <button
                                type="button"
                                onClick={onClear}
                                className="text-gray-400 hover:text-gray-700"
                                aria-label="텍스트 지우기"
                            >
                                <ClearIcon />
                            </button>
                        ) : null}
                    </div>

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
