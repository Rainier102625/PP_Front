// src/lib/map-utils.ts
// MapContainer에서 추출한 순수 유틸리티 함수들

import type { LatLng, PolylineSegment, Rec } from "@/types/map";
import type { AppPlace, TransitRoute, TransitStep } from "@/types/route";

export function colorFor(v: string): string {
    if (v === "붐빔") return "#ff5a5a";
    if (v === "약간붐빔" || v === "약간 붐빔") return "#febd1a";
    if (v === "보통") return "#4e89ff";
    return "#35b26f";
}

export function colorForTransitMode(mode: string): string {
    if (mode === "WALK") return "#888888";
    if (mode === "SUBWAY") return "#22c55e";
    if (mode === "BUS" || mode === "EXPRESSBUS") return "#2563eb";
    return "#000000";
}

type Place = kakao.maps.services.PlacesSearchResultItem;

export function kakaoPlaceToAppPlace(place: Place): AppPlace {
    return {
        id: place.id,
        name: place.place_name,
        address: place.road_address_name || place.address_name,
        lat: Number(place.y),
        lng: Number(place.x),
        category: place.category_name,
        phone: place.phone,
        placeUrl: place.place_url,
    };
}

export function recToAppPlace(rec: Rec): AppPlace {
    return {
        id: rec.id.toString(),
        name: rec.name,
        address: rec.address,
        lat: Number(rec.latitude),
        lng: Number(rec.longitude),
        category: rec.category,
        congestionLevel: rec.congestionLevel,
    };
}

// "lng,lat lng,lat ..." -> LatLng[]
export function parseLineStringToPath(linestring: string): LatLng[] {
    return linestring
        .trim()
        .split(" ")
        .map((pair) => {
            const [lngStr, latStr] = pair.split(",");
            return {
                lat: parseFloat(latStr),
                lng: parseFloat(lngStr),
            };
        });
}

// 여러 step을 이어붙여서 한 경로로
export function buildPathFromSteps(steps: TransitStep[]): LatLng[] {
    const merged: LatLng[] = [];

    steps.forEach((step) => {
        if (!step.linestring) return;
        const pts = parseLineStringToPath(step.linestring);

        pts.forEach((p) => {
            const last = merged[merged.length - 1];
            if (!last || last.lat !== p.lat || last.lng !== p.lng) {
                merged.push(p);
            }
        });
    });

    return merged;
}

export function stepLinestringToPath(step: { linestring?: string }): LatLng[] {
    if (!step.linestring || step.linestring.trim() === "") return [];
    return parseLineStringToPath(step.linestring);
}

// 대중교통 경로 전체 -> 지도에 그릴 PolylineSegment[]
export function buildTransitPolylineSegments(route: TransitRoute): PolylineSegment[] {
    const segs: PolylineSegment[] = [];

    route.segments.forEach((seg) => {
        (seg.steps || []).forEach((step: any) => {
            const pts = stepLinestringToPath(step);
            if (pts.length >= 2) {
                segs.push({
                    path: pts,
                    color: colorForTransitMode(seg.mode),
                });
            }
        });
    });

    return segs;
}

// 지도 bounds를 경로 전체에 맞게 조정
export function fitMapToRouteSegments(
    kakaoMaps: any,
    mapObj: kakao.maps.Map | null,
    segs: PolylineSegment[]
) {
    if (!mapObj || !kakaoMaps || !segs.length) return;

    const bounds = new kakaoMaps.LatLngBounds();
    segs.forEach((seg) => {
        seg.path.forEach((p) => {
            bounds.extend(new kakaoMaps.LatLng(p.lat, p.lng));
        });
    });
    mapObj.setBounds(bounds);
}
