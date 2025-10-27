// src/types/route.ts

// 지도에서 Polyline을 그릴 때 쓰는 타입
export type LatLng = { lat: number; lng: number };

export type RouteSegmentLine = {
    path: LatLng[];
    color: string;
};

// 도보 요약
export interface WalkRouteSummary {
    duration: number;     // 초
    distance: number;     // 미터
    score: number;        // 혼잡도 점수
    instructions: string[];
}

// 대중교통 한 구간 (버스 한 번, 도보 한 번 등)
export interface TransitSegment {
    mode: "WALK" | "BUS" | "SUBWAY" | "EXPRESSBUS" | string;
    routeNumber: string;
    startName: string;
    endName: string;
    duration: number;   // 초
    distance: number;   // 미터
    congestion?: string;
    steps: string[];

    // 💡 중요: 지도에 라인을 그리려면 좌표 쌍이 필요함 (너의 raw 데이터에 이미 있음)
    startX: number; // lon
    startY: number; // lat
    endX: number;   // lon
    endY: number;   // lat
}

// 대중교통 전체 경로 (후보 1개)
export interface TransitRoute {
    totalTime: number;        // 초
    totalDistance: number;    // m
    walkingDistance: number;  // m
    fare: number;             // 원
    segments: TransitSegment[];
}

// Kakao/내 API 검색 결과 통합 장소
export interface AppPlace {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    category?: string;
    congestionLevel?: string;
    phone?: string;
    placeUrl?: string;
    distance?: number;
}

// 지도에서 현재 표시 중인 경로 세그먼트들
export type DisplayRouteSegments = RouteSegmentLine[];
