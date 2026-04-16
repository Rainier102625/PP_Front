// src/types/map.ts
// MapContainer에서 추출한 공유 타입들

import { Feature } from "geojson";
import { Polygon, MultiPolygon } from "geojson";

export type SeoulPoly = Feature<Polygon | MultiPolygon>;

export type LatLng = { lat: number; lng: number };

export type Rec = {
    id: string;
    name: string;
    address: string;
    category: string;
    longitude: string;
    latitude: string;
    congestionLevel?: string;
    distance?: number;
    other_info?: string;
};

// 지도에 그릴 선 한 조각
export type PolylineSegment = {
    path: LatLng[];
    color: string;
};
