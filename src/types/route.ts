// src/types/route.ts

export type AppPlace = {
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
};

export type WalkRouteSummary = {
    duration: number;      // 초
    distance: number;      // m
    score: number;         // 혼잡도 점수 등
    instructions: string[]; // turn-by-turn 안내
};

// API의 세부 경로 step 하나가 가질 수 있는 형태
export type TransitStep = {
    streetName?: string;
    distance?: number;
    description?: string;
    linestring?: string; // "lng,lat lng,lat ..." 형식 좌표열
};

export type TransitSegment = {
    mode: "WALK" | "BUS" | "SUBWAY" | "EXPRESSBUS";
    routeNumber: string;
    startName: string;
    endName: string;
    duration: number;
    distance: number;
    congestion?: string;
    steps: TransitStep[];

    // 지도 bounds 잡는 용도로 서버가 넘겨줬던 값이면 optional로 둬도 OK
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
};


export type TransitRoute = {
    totalTime: number;
    totalDistance: number;
    walkingDistance: number;
    fare: number;
    segments: TransitSegment[];

    // 도보 모드에서 쓰던 형식이 혹시 붙어올 수도 있으니까 optional
    congestionPoints?: {
        latitude: number;
        longitude: number;
        congestionLevel: string;
    }[];
};