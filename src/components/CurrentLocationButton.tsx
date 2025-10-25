"use client";
import React from 'react';

type Props = {
    onClick: () => void;
};

const CurrentLocationButton = ({ onClick }: Props) => {
    return (
        <button
            type="button"
            onClick={onClick}
            title="현재 위치로"
            className="
                absolute z-[1400]
                right-3 bottom-[76px]

                w-12 h-12 /* 👈 48x48px 고정 크기 */
                rounded-full
                bg-white text-gray-800 /* 👈 흰색 배경, 어두운 아이콘 */

                flex items-center justify-center
                shadow-lg /* 👈 그림자 */
                cursor-pointer
                border border-gray-200
                hover:bg-gray-100

                md:bottom-8 md:right-8 /* 👈 PC에서는 조금 더 크게 */
                md:w-14 md:h-14
            "
        >
            {/* 십자선 아이콘 (SVG) */}
            <svg
                width="24" height="24"
                viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <line x1="12" y1="3" x2="12" y2="7"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
                <line x1="21" y1="12" x2="17" y2="12"></line>
                <line x1="7" y1="12" x2="3" y2="12"></line>
            </svg>
        </button>
    );
};

export default CurrentLocationButton;