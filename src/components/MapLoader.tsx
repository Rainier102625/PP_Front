"use client"; // 👈 1. 이 파일이 클라이언트 컴포넌트임을 명시 (가장 중요)

import dynamic from "next/dynamic";

// 2. dynamic import 로직을 page.tsx에서 그대로 가져옵니다.
const MapWithLogic = dynamic(
    () => import("@/components/MapContainer"),
    {
        ssr: false, // 👈 클라이언트 컴포넌트 안에서는 'ssr: false' 사용 가능
        loading: () => (
            <div className="relative mx-auto max-w-[1280px] h-[100dvh] grid place-items-center">
                <p>지도 로딩 중...</p>
            </div>
        )
    }
);

// 3. 이 컴포넌트는 MapWithLogic을 렌더링하는 역할만 합니다.
export default function MapLoader() {
    return (
        <MapWithLogic />
    );
}