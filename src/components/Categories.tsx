// src/app/components/CategoryPills.tsx

"use client";
import React from "react";

// (임시) 카테고리 목록
const categories = [
    { name: "관광지", icon: "📍" },
    { name: "문화시설", icon: "🏛️"},
    { name: "행사/공연/축제", icon: "🎆" },
    { name: "여행코스", icon: "🗺️" },
    { name: "레포츠", icon: "🏌️" },
    { name: "숙박", icon: "🏨" },
    { name: "쇼핑", icon: "🛍️" },
    { name: "음식점", icon: "🍽️" }
];

/**
 * 가로 스크롤을 위한 카테고리 버튼 리스트
 */
const Categories = () => {
    const handleCategoryClick = (categoryName: string) => {
        console.log(`${categoryName} 클릭됨`);
    };

    return (
        // flex-1: 남은 공간을 차지, no-scrollbar: 스크롤바 숨김
        <div className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap py-2 space-x-2 ">
            {categories.map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="
                        inline-flex items-center gap-1.5 px-3 py-1.5
                        bg-white rounded-full shadow
                        text-sm font-semibold text-gray-700
                        hover:bg-gray-100 transition-colors
                    "
                >
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                </button>
            ))}
        </div>
    );
};

export default Categories;