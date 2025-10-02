"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TopBarProps {
    query: string;
    onQueryChange: (value: string) => void;
    onSearch: () => void;
    onMenuClick: () => void;
}

export function TopBar({ query, onQueryChange, onSearch, onMenuClick }: TopBarProps) {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-10">
            <div className="relative flex items-center w-full bg-white rounded-full shadow-lg p-2 border-2 border-gray-200">
                <Button variant="ghost" size="icon" onClick={onMenuClick} className="flex-shrink-0 rounded-full">
                    <img src="/menu.svg" alt="Menu" />
                </Button>
                <Input
                    type="text"
                    placeholder="장소, 주소 검색"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow bg-transparent border-none focus:ring-0 text-lg"
                />
                <Button variant="ghost" size="icon" onClick={onSearch} className="flex-shrink-0 rounded-full">
                    <img src="/search.svg" alt="Search" />
                </Button>
            </div>
        </div>
    );
}
