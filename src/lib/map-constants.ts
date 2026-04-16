// src/lib/map-constants.ts
// MapContainer에서 추출한 공유 상수들

import { LatLng } from "@/types/map";

export type CatItem = { code: string; name: string; icon?: string };

export const INITIAL_CENTER: LatLng = { lat: 37.566826, lng: 126.9786567 };

export const CAT_ITEMS: CatItem[] = [
    { code: "12", name: "관광지", icon: "📍" },
    { code: "14", name: "문화시설", icon: "🏛️" },
    { code: "15", name: "행사/공연/축제", icon: "🎆" },
    { code: "25", name: "여행코스", icon: "🗺️" },
    { code: "28", name: "레포츠", icon: "🏌️" },
    { code: "32", name: "숙박", icon: "🏨" },
    { code: "38", name: "쇼핑", icon: "🛍️" },
    { code: "39", name: "음식점", icon: "🍽️" },
];

// 마커 이미지 상수
export const myMarkerImage = {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="10" fill="white"/>
          <circle cx="16" cy="16" r="10" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1"/>
          <circle cx="16" cy="16" r="5.5" fill="#ef4444"/>
        </svg>`
    )}`,
    size: { width: 40, height: 40 },
    options: { offset: { x: 20, y: 20 } },
} as const;

export const startMarkerImage = {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" fill="#10b981"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`
    )}`,
    size: { width: 32, height: 32 },
    options: { offset: { x: 16, y: 16 } },
} as const;

export const destMarkerImage = {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" fill="#ef4444"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`
    )}`,
    size: { width: 32, height: 32 },
    options: { offset: { x: 16, y: 16 } },
} as const;
