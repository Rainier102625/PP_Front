"use client";
import React from 'react';

type Props = {
    onClick: () => void;
};

const AiButton = ({ onClick }: Props) => {
    return (
        <button
            onClick={onClick}
            className="
                flex-shrink-0 /* 1. flex 컨테이너에서 줄어들지 않도록 설정 */
                flex items-center gap-2
                py-2.5 px-3.5 /* 10px 14px */
                rounded-full /* 999px */
                font-black /* 900 */
                bg-gradient-to-r from-blue-600 to-purple-500 /* 그라데이션 */
                text-white
                shadow-[0_8px_25px_rgba(0,0,0,0.4)] /* 그림자 (globals.css에서 가져옴) */
                cursor-pointer
                border-2 border-white /* 테두리 (globals.css에서 가져옴) */
            "
        >
            {/* 아이콘 */}

            {/* 2. 화면이 좁을(sm) 때는 텍스트 숨김 */}
            <span className="inline">AI 어시스턴트</span>
        </button>
    );
};

export default AiButton;