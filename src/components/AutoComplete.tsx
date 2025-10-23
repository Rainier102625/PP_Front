// src/app/components/KakaoAutocomplete.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

// Sidebar에서 가져온 타입
export interface AutoCompleteItem {
    id: string;
    place_name: string;
    road_address_name: string;
    x: string; // 경도 (longitude)
    y: string; // 위도 (latitude)
}

type Props = {
    suggestions: AutoCompleteItem[]; // 👈 [수정] query 대신 suggestions 배열을 직접 받음
    onSelect: (item: AutoCompleteItem) => void;
};

// Sidebar의 로직을 그대로 가져옵니다.
const AutoComplete = ({ suggestions, onSelect }: Props) => {

    if (suggestions.length === 0) {
        return <div className="p-4 text-gray-500 text-center">검색 결과가 없습니다.</div>;
    }

    // 2. Sidebar에서 가져온 JSX (자동완성 목록)
    return (
        <ul className="p-2">
            <ul>
                {suggestions.map((item) => (
                    <li key={item.id}
                        className="flex items-center px-4 py-2.5 hover:bg-gray-100 cursor-pointer"
                        // 3. 클릭 시 onSelect(item) 호출
                        onClick={() => onSelect(item)} >
                        <Search className="w-5 h-5 mr-3 text-gray-400"/>
                        <div>
                            <p className="font-medium text-base truncate">{item.place_name}</p>
                            <p className="text-xs text-gray-500 truncate">{item.road_address_name}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </ul>
    );
};

export default AutoComplete;