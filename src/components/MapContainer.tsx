// src/components/MapContainer.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map, MapMarker, useKakaoLoader, Polyline } from "react-kakao-maps-sdk";
import TopSearchBar from "@/components/TopSearchBar";
import Categories from "@/components/Categories";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import AiButton from "@/components/AiButton";
import CurrentLocationButton from "@/components/CurrentLocationButton";
import AutoComplete, { AutoCompleteItem } from "@/components/AutoComplete";
import ResultPanel from "@/components/ResultPanel"; // (RecommendPanel -> ResultPanel)
import { ChatMessage } from "@/types/chatMessage";
import InfoWindow = kakao.maps.InfoWindow;
import RoutePanel from "@/components/RoutePanel";
import * as turf from '@turf/turf';
import {Polygon, MultiPolygon, Feature} from 'geojson';
import {featureCollection } from "@turf/helpers";
import { union } from "@turf/turf";
// @ts-ignore
import { WalkRouteSummary, TransitSegment, TransitRoute, AppPlace} from "@/types/route";


// --- 타입 정의 섹션 ---

// 서울시 경계 폴리곤 타입
type SeoulPoly = Feature<Polygon | MultiPolygon>;

// 위도/경도 타입
type LatLng = { lat: number; lng: number };

// 카카오 API 장소 검색 결과 타입
type Place = kakao.maps.services.PlacesSearchResultItem;

// Spring API 장소 추천 응답 타입
type Rec = {
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



// 통합 장소 타입

export type AppPlace = {

    id: string;

    name: string;

    address: string;

    lat: number;

    lng: number;

    category?: string;

    congestionLevel?: string; // (우리 API에만 있음)

    phone?: string; // (카카오 API에만 있음)

    placeUrl?: string; // (카카오 API에만 있음)

    distance?: number;

};



// 경로 구간 타입

type RouteSegment = {

    path: LatLng[];

    color: string;

};



/** 경로 경유지(턴) 타입 */

type RouteTurn = {

    lat: number;

    lng: number;

// (API가 텍스트 설명을 제공하지 않으므로, 좌표만 저장)

};



/** 경로 요약 정보 타입 */

type RouteSummary = {

    duration: number; // 초

    distance: number; // 미터

    score: number;

    instructions: string[];

};



/** 통합 경로 정보 타입 */

export type RouteInfo = {

    summary: RouteSummary;

    segments: RouteSegment[]; // 지도에 그릴 폴리라인 조각들

    turns: RouteTurn[]; // 패널에 표시할 경유지(턴) 목록

};



export type WalkRouteSummary = {

    duration: number; // 초

    distance: number; // 미터

    score: number;

    instructions: string[];

};



/** [추가] 대중교통 경로 세그먼트 타입 */

export type TransitSegment = {

    mode: "WALK" | "BUS" | "SUBWAY"; // (SUBWAY는 응답에 따라 추가/수정)

    routeNumber: string;

    startName: string;

    endName: string;

    duration: number;

    distance: number;

    congestion?: string;

    steps: string[];

};



/** [추가] 대중교통 전체 경로 타입 */

export type TransitRoute = {

    totalTime: number;

    totalDistance: number;

    walkingDistance: number;

    fare: number;

    segments: TransitSegment[];

// [가정] API 응답에 이 정보가 포함되어 있다고 가정합니다. (도보와 동일)

    congestionPoints?: { latitude: number; longitude: number; congestionLevel: string }[];

};



// 변환 rec -> AppPlace

const recToAppPlace = (rec: Rec): AppPlace => ({

    id: rec.id.toString(),

    name: rec.name,

    address: rec.address,

    lat: Number(rec.latitude),

    lng: Number(rec.longitude),

    category: rec.category,

    congestionLevel: rec.congestionLevel,

});



// 변환 kakao Place -> AppPlace

const kakaoPlaceToAppPlace = (place: Place): AppPlace => ({

    id: place.id,

    name: place.place_name,

    address: place.road_address_name || place.address_name,

    lat: Number(place.y),

    lng: Number(place.x),

    category: place.category_name,

    phone: place.phone,

    placeUrl: place.place_url,

});



// --- 상수 정의 섹션 ---



const INITIAL_CENTER: LatLng = { lat: 37.566826, lng: 126.9786567 };



const CAT_ITEMS = [

    { code: "12", name: "관광지", icon: "📍" },

    { code: "14", name: "문화시설", icon: "🏛️" },

    { code: "15", name: "행사/공연/축제", icon: "🎆" },

    { code: "25", name: "여행코스", icon: "🗺️" },

    { code: "28", name: "레포츠", icon: "🏌️" },

    { code: "32", name: "숙박", icon: "🏨" },

    { code: "38", name: "쇼핑", icon: "🛍️" },

    { code: "39", name: "음식점", icon: "🍽️" },

];



const myImage = {

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

const startMarkerImg = {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="11" fill="#10b981"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`
    )}`,
    size: { width: 32, height: 32 },
    options: { offset: { x: 16, y: 16 } },
} as const;

const destMarkerImg = {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="11" fill="#ef4444"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`
    )}`,
    size: { width: 32, height: 32 },
    options: { offset: { x: 16, y: 16 } },
} as const;

// 혼잡도에 따른 색상 반환 함수
function colorFor(v: string) {
    if (v === '붐빔') return "#ff5a5a"; // 붐빔(빨강)
    if (v === '약간붐빔' || v === '약간 붐빔') return "#febd1a"; // 약간 붐빔(노랑)
    if (v === '보통') return "#4e89ff";// 보통(파랑)
    return "#35b26f"; // 여유(초록)
}
function colorForTransitMode(mode: string): string {
    if (mode === "WALK") return "#888888";        // 회색
    if (mode === "SUBWAY") return "#22c55e";      // 지하철 = 초록
    if (mode === "BUS" || mode === "EXPRESSBUS") return "#2563eb"; // 버스 = 파랑
    return "#000000"; // fallback
}

function buildTransitPolylineSegments(route: TransitRoute) {
    const segs: { path: {lat:number; lng:number}[], color: string }[] = [];

    route.segments.forEach((seg) => {
        // 좌표가 제대로 있는 구간만
        if (
            typeof seg.startX === "number" &&
            typeof seg.startY === "number" &&
            typeof seg.endX === "number" &&
            typeof seg.endY === "number"
        ) {
            const color = colorForTransitMode(seg.mode);

            segs.push({
                path: [
                    { lat: seg.startY, lng: seg.startX }, // Kakao Polyline은 {lat,lng}
                    { lat: seg.endY,   lng: seg.endX   },
                ],
                color,
            });
        }
    });

    return segs;
}

function fitMapToRouteSegments(
    kakaoMaps: any,
    mapObj: kakao.maps.Map | null,
    segs: { path: {lat:number; lng:number}[] }[]
) {
    if (!mapObj || !kakaoMaps || !segs.length) return;

    const bounds = new kakaoMaps.LatLngBounds();
    segs.forEach(seg => {
        seg.path.forEach(p => {
            bounds.extend(new kakaoMaps.LatLng(p.lat, p.lng));
        });
    });
    mapObj.setBounds(bounds);
}

export default function MapContainer() {

    const [loading] = useKakaoLoader({

        appkey: process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY!,

        libraries: ["services"],

    });



// --- State 정의 섹션 ---



// 지도/검색

    const [center, setCenter] = useState<LatLng>(INITIAL_CENTER);

    const [myLocation, setMyLocation] = useState<LatLng | null>(null);

    const [query, setQuery] = useState("");

    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]);



// [수정] 모든 검색 결과(카카오, 우리API)는 AppPlace[] 타입으로 통합

    const [results, setResults] = useState<AppPlace[]>([]);

// [수정] 상세보기 상태도 AppPlace 타입으로 통합

    const [selectedPlace, setSelectedPlace] = useState<AppPlace | null>(null);

// [수정] 검색 패널 상태

    const [resultsPanelOpen, setResultsPanelOpen] = useState(false);



// 추천 API용 카테고리

    const [selectedCat, setSelectedCat] = useState<string | null>(null);



// 기타

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [isSearchLoading, setIsSearchLoading] = useState(false); // [추가] 검색용 로딩 state



// 서울시 경계 폴리곤

    const [seoulPolygon, setSeoulPolygon] = useState<SeoulPoly | null>(null);

// 출발지

    const [origin, setOrigin] = useState<AppPlace | null>(null);

// 목적지

    const [destination, setDestination] = useState<AppPlace | null>(null);

// 길찾기 경로 활성화

    const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);

// 길찾기 패널 활성화

    const [routePanelOpen, setRoutePanelOpen] = useState(false);



// 길찾기 경로 폴리라인 세그먼트 state

    const [routeSegments, setRouteSegments] = useState<RouteSegment[] | null>(null);

// 길찾기 요약 정보 state

    const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);



    /** 경로 정렬 옵션 state (기본값: 'duration') */

    const [sortOption, setSortOption] = useState<'duration' | 'congestion'>('duration');



    /** [추가] 이동 모드 (도보/대중교통) */

    const [travelMode, setTravelMode] = useState<'walk' | 'transit'>('walk');



    /** [수정] 도보 경로 데이터 (패널용) */

    const [walkSummary, setWalkSummary] = useState<WalkRouteSummary | null>(null);

    /** [추가] 대중교통 경로 데이터 (패널용) */

    const [transitRoutes, setTransitRoutes] = useState<TransitRoute[] | null>(null);

    // 어떤 대중교통 경로(index)가 선택/확장되어 있는지
    const [activeTransitIndex, setActiveTransitIndex] = useState<number | null>(null);

// kakao refs

    const mapRef = useRef<kakao.maps.Map | null>(null);

    const placesRef = useRef<kakao.maps.services.Places | null>(null);

    const geocoderRef = useRef<kakao.maps.services.Geocoder | null>(null); // [수정] Geocoder 추가

    const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);



// Ai 대화창 상태

    const [aiChatOpen, setAiChatOpen] = useState(false);

    const [aiQuery, setAiQuery] = useState("");

    const [messages, setMessages] = useState<ChatMessage[]>([

        { id: 'init-1', sender: 'ai' ,text: '안녕하세요! 반갑습니다. 무엇을 도와드릴까요? 궁금한 점이 있으시거나 도움이 필요하시면 언제든지 말씀해주세요! 😊' },

        { id: 'init-2', sender: 'ai', text: '추천 질문을 눌러 시작해보세요!' },

        { id: 'init-3', sender: 'ai', recommendation: '강남역 주변에 카페 찾아줘' }

    ]);

    const [isLoading, setIsLoading] = useState(false); // (AI용 로딩)



// --- kakao SDK 준비 ---

    useEffect(() => {
        if (loading) return;
        const k = (window as any).kakao;
        if (k?.maps?.services) {
            if (!placesRef.current) {
                placesRef.current = new k.maps.services.Places();
            }
            if (!geocoderRef.current) {
                geocoderRef.current = new k.maps.services.Geocoder();
            }
        }
        handleGetCurrentLocation();
    }, [loading]);

// --- 자동완성 (Kakao API) ---
    useEffect(() => {
        const k = (window as any).kakao;
        if (!isSearchFocused || !query.trim() || !placesRef.current) {
            setSuggestions([]);
            return;
        }
        const seoulBounds = new k.maps.LatLngBounds(
            new k.maps.LatLng(37.413294, 126.734086), // 남서쪽 좌표
            new k.maps.LatLng(37.715133, 127.269311) // 북동쪽 좌표
        );
        const t = setTimeout(() => {
            placesRef.current!.keywordSearch(
                query,
                (data, status) => {
                    if (status === k.maps.services.Status.OK) {
                        setSuggestions(
                            data.slice(0, 10).map((d) => ({
                                id: d.id,
                                place_name: d.place_name,
                                road_address_name: d.road_address_name || d.address_name || "",
                                x: d.x,
                                y: d.y,
                            }))
                        );
                    } else setSuggestions([]);
                },
                { sort: k.maps.services.SortBy.ACCURACY,
                    bounds: seoulBounds } // 서울시 경계 내로 검색 제한
            );
        }, 200);
        return () => {
            clearTimeout(t);
            infoWindowRef.current = null;
        };
    }, [query, isSearchFocused]);
//상세 정보 닫기 버튼 감지
    useEffect(() => {
        const k = (window as any).kakao;
        if (!k?.maps || !mapRef.current) return; // 카카오맵이나 지도 객체가 없으면 종료
        const map = mapRef.current; // 지도 객체 가져오기
// --- InfoWindow 생성 (한 번만) ---
        if (!infoWindowRef.current) {

            infoWindowRef.current = new k.maps.InfoWindow({

                removable: 'true',// 기본 'X' 버튼 사용

                content: '', // 초기 내용

            });

        }

        const iw : InfoWindow | null = infoWindowRef.current; // 인포윈도우 객체 가져오기



// --- 'close' 이벤트 핸들러 정의 ---

        const handleClose = () => {

            setSelectedPlace(null); // 'X' 버튼 누르면 state null로

            setRouteSegments(null)

        };



// --- selectedPlace 상태에 따라 열기/닫기/업데이트 ---

        if (selectedPlace && iw) {

// 1. 내용(Content) 설정

// (주의: HTML 문자열로 만들어야 함)

            const contentDiv = document.createElement('div');

            contentDiv.style.padding = '8px 30px 30px 10px';

            contentDiv.style.width = 'auto';

            contentDiv.style.maxWidth = '400px'

            contentDiv.style.minWidth = '200px';

            contentDiv.style.lineHeight = '1.4';

            contentDiv.innerHTML = `

<div style="font-weight: bold; margin-bottom: 5px; font-size: 15px; overflow-wrap: break-word; word-break: keep-all;">${selectedPlace.name}</div>

<div style="font-size: 10px; color: #333; overflow-wrap: break-word; word-break: keep-all;">${selectedPlace.address}</div>

<div style="font-size: 11px; color: #888; margin-top: 4px;">${selectedPlace.category || ''}</div>



${selectedPlace.phone ? `<div style="font-size: 13px; color: green; margin-top: 4px;">${selectedPlace.phone}</div>` : ''}

${selectedPlace.placeUrl ? `<a href="${selectedPlace.placeUrl}" target="_blank" rel="noreferrer" style="color: blue; text-decoration: none; font-size: 12px; margin-top: 6px; display: inline-block;">카카오맵에서 상세보기</a>` : ''}

${selectedPlace.congestionLevel ? `<div style="font-size: 13px; color: #059669; margin-top: 4px; font-weight: bold;">혼잡도: ${selectedPlace.congestionLevel}</div>` : ''}

`;



            const buttonContainer = document.createElement('div');

            buttonContainer.style.marginTop = '10px';

            buttonContainer.style.display = 'flex';

            buttonContainer.style.gap = '8px';



            const startButton = document.createElement('button');

            startButton.textContent = '여기서 출발';

            startButton.style.padding = '4px 8px';

            startButton.style.backgroundColor = '#007bff';

            startButton.style.color = 'white';

            startButton.style.border = 'none';

            startButton.style.borderRadius = '4px';

            startButton.style.cursor = 'pointer';

            startButton.onclick = () => {

                setOrigin(selectedPlace);

                alert(`${selectedPlace.name}을(를) 출발지로 설정했습니다.`);

                iw.close();

            };



            const endButton = document.createElement('button');

            endButton.textContent = '여기로 도착';

            endButton.style.padding = '4px 8px';

            endButton.style.backgroundColor = '#28a745';

            endButton.style.color = 'white';

            endButton.style.border = 'none';

            endButton.style.borderRadius = '4px';

            endButton.style.cursor = 'pointer';

            endButton.onclick = () => {

                setDestination(selectedPlace);

                alert(`${selectedPlace.name}을(를) 도착지로 설정했습니다.`);

                iw.close();

            };



            buttonContainer.appendChild(startButton);

            buttonContainer.appendChild(endButton);

            contentDiv.appendChild(buttonContainer);



// iw.setContent('<div>테스트</div>');

            iw.setContent(contentDiv);



// 2. 위치(Position) 설정

            iw.setPosition(new k.maps.LatLng(selectedPlace.lat, selectedPlace.lng));



            iw.setZIndex(1); // 다른 마커들 위에 표시



// 3. 인포윈도우 열기

            iw.open(map); // 두 번째 인자는 앵커 마커인데, 여기선 불필요



// 4. 'close' 이벤트 리스너 등록

            k.maps.event.addListener(iw, 'close', handleClose);



        } else {

// selectedPlace가 null이면 인포윈도우 닫기

            if(iw){

                iw.close();

            }

        }



// --- 클린업 함수 ---

        return () => {

// 컴포넌트 unmount 시 또는 selectedPlace 변경 시 리스너 제거

            k.maps.event.removeListener(iw, 'close', handleClose);

// (선택) 컴포넌트 unmount 시 인포윈도우 객체 자체를 제거할 수도 있음

// if (iw) iw.setMap(null); // 지도에서 완전히 제거

        };



    }, [selectedPlace, myLocation]); // selectedPlace가 바뀔 때마다 이 로직을 실행



    useEffect(() => {

        (async () => {

            try {

                const res = await fetch("/data/seoul-gu.geojson");

                const geojson = await res.json();



                if (!geojson?.features || geojson.features.length === 0) {

                    console.warn("빈 GeoJSON입니다.");

                    return;

                }



// Polygon / MultiPolygon 만 대상으로 추출

                const polys = geojson.features.filter(

                    (f: any) =>

                        f?.geometry &&

                        (f.geometry.type === "Polygon" ||

                            f.geometry.type === "MultiPolygon")

                );



                if (polys.length === 0) {

                    console.warn("Polygon/MultiPolygon 피처가 없습니다.");

                    return;

                }



// 첫 번째 폴리곤으로 시작

                let combined: SeoulPoly | null = polys[0] as SeoulPoly;



// 나머지 피처와 차례대로 union

                for (let i = 1; i < polys.length; i++) {

                    try {

                        const fc = featureCollection([

                            combined as SeoulPoly,

                            polys[i] as SeoulPoly,

                        ]);



// Turf v7+ union 시그니처: union(FeatureCollection<Polygon|MultiPolygon>)

                        const merged = union(fc) as SeoulPoly | null;



                        if (merged) {

                            combined = merged;

                        } else {

                            console.warn(

                                `union 결과가 null이라 index ${i}는 스킵합니다.`

                            );

                        }

                    } catch (err) {

                        console.error(`Turf union error at index ${i}:`, err);

                    }

                }



                setSeoulPolygon(combined);

            } catch (error) {

                console.error("Failed to load or process GeoJSON:", error);

            }

        })();

    }, [selectedPlace]);



// --- [수정] 길찾기 useEffect (travelMode, sortOption 추가) ---

    useEffect(() => {

        if (origin && destination) {

// 이동 모드, 정렬 옵션이 바뀔 때마다 길찾기 API 다시 호출

            handleGetDirections(origin, destination, travelMode, sortOption);

        }

    }, [origin, destination, travelMode, sortOption]); // 👈 4개 의존



// --- 마커 이미지 ---

    const markerImg = useMemo(

        () => ({

            normal: {

                src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(

                    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32">

<circle cx="16" cy="16" r="10" fill="#374151"/><circle cx="16" cy="16" r="5" fill="white"/>

</svg>`

                )}`,

                size: { width: 28, height: 28 },

                options: { offset: { x: 14, y: 14 } },

            },

            active: {

                src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(

                    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">

<circle cx="16" cy="16" r="11" fill="#2563eb"/><circle cx="16" cy="16" r="6" fill="white"/>

</svg>`

                )}`,

                size: { width: 32, height: 32 },

                options: { offset: { x: 16, y: 16 } },

            },

        }),

        []

    );



// 거리 계산 메서드

    const haversineKm = (a: LatLng, b: LatLng) => {

        const R = 6371;

        const dLat = (Math.PI / 180) * (b.lat - a.lat);

        const dLng = (Math.PI / 180) * (b.lng - a.lng);

        const la1 = (Math.PI / 180) * a.lat,

            la2 = (Math.PI / 180) * b.lat;

        const x =

            Math.sin(dLat / 2) ** 2 +

            Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;

        return 2 * R * Math.asin(Math.sqrt(x));

    };





// 중앙 위치 이동 메서드

    const centerTo = (pos: LatLng) => {

        setCenter(pos);

        const k = (window as any).kakao;

        const m = mapRef.current;

        if (m && k?.maps) m.panTo(new k.maps.LatLng(pos.lat, pos.lng));

    };





// 주소 -> 좌표 변환 메서드 (Geocoder 사용)

    const geocodeQuery = (q: string): Promise<kakao.maps.LatLng> => {

        return new Promise((resolve, reject) => {

            if (!geocoderRef.current) {

                return reject(new Error("Geocoder가 준비되지 않았습니다."));

            }

            const k = (window as any).kakao;

            geocoderRef.current.addressSearch(q, (result, status) => {

                if (status === k.maps.services.Status.OK && result.length > 0) {

                    const coords = new k.maps.LatLng(result[0].y, result[0].x);

                    resolve(coords);

                } else {

// 주소 검색 실패 시 키워드 검색으로 한 번 더 시도

                    placesRef.current?.keywordSearch(q, (data, status) => {

                        if (status === k.maps.services.Status.OK && data.length > 0) {

                            const coords = new k.maps.LatLng(data[0].y, data[0].x);

                            resolve(coords);

                        } else {

                            reject(new Error("지오코딩에 실패했거나 결과가 없습니다."));

                        }

                    });

                }

            });

        });

    };



// --- 핸들러 ---

// 현재 위치 설정 메서드
    const handleGetCurrentLocation = () => {
// ... (기존 코드와 동일) ...

        setErrorMsg(null);
        const fallback = () => {
            centerTo(INITIAL_CENTER);
            setMyLocation(null);
        };
        if (!navigator.geolocation) {

            fallback();

            return;

        }

        const t = setTimeout(fallback, 7000);

        navigator.geolocation.getCurrentPosition(

            ({ coords }) => {

                clearTimeout(t);

                const p = { lat: coords.latitude, lng: coords.longitude };

                centerTo(p);

                setMyLocation(p);

            },

            () => {

                clearTimeout(t);

                fallback();

            },

            { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }

        );

    };







// 일반 검색 ver. kakao API

    const handleKakaoSearch = (q = query) => {

        const k = (window as any).kakao;

        if (!q.trim() || !placesRef.current) return;



        setIsSearchLoading(true);

        setResultsPanelOpen(true);

        setSelectedPlace(null);



        const seoulBounds = new k.maps.LatLngBounds(

            new k.maps.LatLng(37.413294, 126.734086), // 남서쪽 좌표

            new k.maps.LatLng(37.715133, 127.269311) // 북동쪽 좌표

        );



        placesRef.current.keywordSearch(

            q,

            async (data: Place[], status) => {

                if (status === k.maps.services.Status.OK) {



// 서울시 경계 내 필터링

                    const filteredData = data.filter(place => {

                        if (!seoulPolygon) return true; // 폴리곤 로드 안됐으면 일단 통과

                        try {

                            const point = turf.point([Number(place.x), Number(place.y)]);

                            return turf.booleanPointInPolygon(point, seoulPolygon);

                        } catch (e) {

                            console.error("Point in polygon check error:", e);

                            return false; // 에러 시 제외

                        }

                    });



                    const baseLocation = myLocation || center;



// 현재 Spring 서버 응답과 카카오 api 응답 형식이 달라서 통합해줌

                    let spotsForPanel: AppPlace[] = filteredData.map(place => {

                        const appPlace = kakaoPlaceToAppPlace(place);

                        return {

                            ...appPlace,

// 거리순 정렬

                            distance: haversineKm(baseLocation, { lat: appPlace.lat, lng: appPlace.lng },

                            )

                        };

                    });



                    try {

// 2. 파이썬 API 호출하여 혼잡도 추가

                        spotsForPanel = await fetchCongestionData(spotsForPanel);

                    } catch (error) {

                        console.error("혼잡도 데이터 통합 중 오류:", error);

                    }



                    setResults(spotsForPanel);



// 지도 경계 조정

                    const b = new k.maps.LatLngBounds();

                    spotsForPanel.forEach((d) => b.extend(new k.maps.LatLng(d.lat, d.lng)));

                    mapRef.current?.setBounds(b);

                } else {

                    setResults([]);

                    setResultsPanelOpen(false);

                }

                setIsSearchLoading(false);

            },

            {

                sort: k.maps.services.SortBy.ACCURACY,

                bounds: seoulBounds

            } // 서울시 경계 내로 검색 제한

        );

    };



// 카카오 api 아용시 혼잡도 붙이기

    const fetchCongestionData = async (places: AppPlace[]): Promise<AppPlace[]> => {

        if (places.length === 0) {

            return []; // 장소 목록이 없으면 바로 반환

        }



// 1. API 요청 본문(body) 준비

        const now = new Date();

        const pad = (num: number) => num.toString().padStart(2, '0');

        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const datetime = "2025-10-01T" + time; // "YYYY-MM-DD HH:MM:SS" 형식

        const locations = places.map(p => ({ lat: p.lat, lon: p.lng }));

        const requestBody = {

            datetime: datetime,

            locations: locations

        };



        try {

// 2. 파이썬 API 호출 (POST)

            const response = await fetch("http://127.0.0.1:5001/get-congestion", {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json',

                },

                body: JSON.stringify(requestBody),

            });



            if (!response.ok) {

                console.error("혼잡도 API 오류:", response.status, response.statusText);

                return places; // 혼잡도 조회 실패 시 원본 목록 반환

            }



            const data = await response.json();

            const congestionLevels: string[] = data.congestion_levels;



// 3. 결과 병합: 원본 places 배열에 congestionLevel 추가

            if (congestionLevels && congestionLevels.length === places.length) {

                return places.map((place, index) => ({

                    ...place,

                    congestionLevel: congestionLevels[index] // 해당 인덱스의 혼잡도 값 할당

                }));

            } else {

                console.error("혼잡도 API 응답 형식 오류 또는 길이 불일치");

                return places; // 형식 오류 시 원본 반환

            }



        } catch (error) {

            console.error("혼잡도 API 호출 중 오류:", error);

            return places; // 네트워크 오류 등 발생 시 원본 반환

        }

    };



// 추천 검색 ver. Spring API

    const handleRecommendSearch = async (q = query) => {

        if (!q.trim()) {

            alert("검색어를 입력해주세요.");

            return;

        }



        setIsSearchLoading(true);

        setResultsPanelOpen(true);

        setResults([]);

        setSelectedPlace(null);



        let location: kakao.maps.LatLng;

        try {

// 1. 검색어(q)를 좌표로 변환

            location = await geocodeQuery(q);

        } catch (error) {

            console.error(error);

            alert("검색어에 해당하는 위치를 찾을 수 없습니다.");

            setIsSearchLoading(false);

            setResultsPanelOpen(false);

            return;

        }



        try {

            const finalDateTime = new Date();

            const pad = (num: number) => num.toString().padStart(2, '0');

            const time = `${pad(finalDateTime.getHours())}:${pad(finalDateTime.getMinutes())}:${pad(finalDateTime.getSeconds())}`;

            const lat = location.getLat();

            const lon = location.getLng();

            const categoryQuery = selectedCat || ""; // 카테고리 상태 반영



// http://pp-domain.duckdns.org:8082/api/recommend/with-congestion?lat=37.5665&lon=126.9780&time=14:30:00&congestionDateTime=2025-10-01T17:00:00&types=12



// Spring API 호출

            const apiUrl = `http://pp-domain.duckdns.org:8082/api/recommend/?lat=${lat}&lon=${lon}&time=${time}&congestionDateTime=2025-10-01T${time}&type=${categoryQuery}`;

            const response = await fetch(apiUrl);





            if (!response.ok) {

                throw new Error(`HTTP error! status: ${response.status}`);

            }



            const apiResponse = await response.json();

            const resultsData = apiResponse[0]?.results as Record<string, Rec[]>;



            if (!resultsData) {

                alert("추천 장소를 가져오지 못했습니다.");

                setResults([]);

                return;

            }



// 4. 카테고리 필터링

            const categoryIdToKeyMap: { [key: string]: string } = {

                "12": "tourist_attraction", "14": "cultural_facilities", "15": "festivals_performances_events",

                "25": "travel_course", "28": "leisure_sports", "32": "accommodation", "38": "shopping", "39": "food",

            };



            let allSpots: Rec[] = []; // 👈 원본 Rec(ApiRec) 타입

            if (categoryQuery && categoryIdToKeyMap[categoryQuery]) {

                allSpots = resultsData[categoryIdToKeyMap[categoryQuery]] || [];

            } else {

                allSpots = Object.values(resultsData).flat();

            }



            if (allSpots.length === 0) {

                alert("해당 조건에 맞는 추천 장소가 없습니다.");

                setResults([]);

                return;

            }



// 5. [핵심] Rec[] -> AppPlace[]로 변환

            const spotsForPanel: AppPlace[] = allSpots.map(recToAppPlace);





// 7. [핵심] 통합된 state에 저장

            setResults(spotsForPanel);



// 8. 지도 이동

            const k = (window as any).kakao;

            const b = new k.maps.LatLngBounds();

            spotsForPanel.forEach((d) => b.extend(new k.maps.LatLng(d.lat, d.lng)));

            b.extend(location); // 검색 중심점도 포함

            mapRef.current?.setBounds(b);



        } catch (error) {

            console.error("추천 검색 처리 중 오류:", error);

            alert("추천 검색 중 오류가 발생했습니다.");

            setResultsPanelOpen(false);

        } finally {

            setIsSearchLoading(false);

        }

    };



    /**

     * 자동완성 항목 클릭 (검색창 채우기만 함)

     */

    const handleSuggestionSelect = (item: AutoCompleteItem) => {

        setQuery(item.place_name);

        setIsSearchFocused(false);

    };



    /**

     * 카테고리 버튼 클릭 (state 변경만 함)

     */

    const handleCategoryChange = (code: string | null) => {

        if (code === null || code === selectedCat) {

            setSelectedCat(null); // (resetCategory 단순화)

            return;

        }

        setSelectedCat(code);

    };



    /**

     * [수정] 상세보기 클릭 (확대 레벨 3 적용)

     */

    const handleResultItemClick = (item: AppPlace) => {

        setSelectedPlace(item); // 1. 상세보기 state 저장



        const pos = { lat: item.lat, lng: item.lng };

        setCenter(pos); // 2. React center state 동기화



        const k = (window as any).kakao;

        const m = mapRef.current; // 3. 지도 객체 가져오기



        if (m && k?.maps) {

            const moveLatLon = new k.maps.LatLng(pos.lat, pos.lng);

            m.panTo(moveLatLon); // 4. 부드럽게 이동

            m.setLevel(3, { animate: true }); // 5. 레벨 3으로 확대

        }

    };



    /**

     * [수정] 검색창 X버튼 (전체 초기화)

     */

    const handleClearSearch = () => {

        setQuery(""); // 검색창 텍스트

        setResults([]); // 결과 목록 (마커)

        setSelectedPlace(null); // 상세보기 (인포윈도우)

        setResultsPanelOpen(false); // 패널

        setIsSearchFocused(false); // 포커스

        setSelectedCat(null); // 카테고리



// 길찾기 관련 state 초기화

        setOrigin(null);

        setDestination(null);

        setActiveRoute(null);

        setRouteSegments(null);

        setSortOption('duration');

        setOrigin(null);

        setDestination(null);

        setRoutePanelOpen(false);

        setRouteSegments(null); // 👈 폴리라인

        setWalkSummary(null); // 👈 도보 데이터

        setTransitRoutes(null); // 👈 대중교통 데이터

        setTravelMode('walk'); // 👈 이동 모드 초기화

        setSortOption('duration'); // 👈 정렬 옵션 초기화

    };



    /**

     * AI 챗봇 전송

     */

    const handleAiSummit = async (textOverride?: string) => {

// ... (기존 코드와 동일) ...

        const textToSend = textOverride || aiQuery;

        const trimmedQuery = textToSend.trim();

        if (!trimmedQuery || isLoading) return;

        const newUserMessage: ChatMessage = { id: Date.now(), text: trimmedQuery, sender: 'user' };

        const currentMessages = [...messages, newUserMessage];

        setMessages(currentMessages);

        setAiQuery("");

        setIsLoading(true);

        try {

            const response = await fetch('/api/chat', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ messages: currentMessages }),

            });

            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const data = await response.json();

            const aiResponse: ChatMessage = { id: Date.now() + 1, text: data.text, sender: 'ai' };

            setMessages(prevMessages => [...prevMessages, aiResponse]);

        } catch (error) {

            console.error("Failed to fetch AI response:", error);

            const errorResponse: ChatMessage = { id: Date.now() + 1, text: "죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.", sender: 'ai' };

            setMessages(prevMessages => [...prevMessages, errorResponse]);

        } finally {
            setIsLoading(false);
        }
    };
    const handleGetDirections = async (
        startPoint: AppPlace,
        endPoint: AppPlace,
        mode: 'walk' | 'transit',
        sort: 'duration' | 'congestion'
    ) => {
        setIsSearchLoading(true);

        // 초기화
        setRouteSegments(null);
        setWalkSummary(null);
        setTransitRoutes(null);
        // setRoutePanelOpen(false); // 깜빡임 방지로 유지해도 ok
        setActiveTransitIndex(null);

        try {
            // 1. 요청 바디
            let requestBody: any;
            if (mode === 'transit') {
                requestBody = {
                    startX: startPoint.lng,
                    startY: startPoint.lat,
                    endX: endPoint.lng,
                    endY: endPoint.lat,
                    mode: "transit",
                    departureTime: new Date().toISOString(),
                };
            } else {
                requestBody = {
                    startX: startPoint.lng,
                    startY: startPoint.lat,
                    endX: endPoint.lng,
                    endY: endPoint.lat,
                    sort: sort,
                    departureTime: new Date().toISOString(),
                };
            }

            const response = await fetch("http://pp-domain.duckdns.org:8082/api/route", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`길찾기 API 호출 실패 (${response.status})`);
            }

            const data = await response.json();

            let routesFound = false;

            // ---------- 대중교통 모드 ----------
            if (mode === 'transit') {
                if (
                    data &&
                    Array.isArray(data.transitRoutes) &&
                    data.transitRoutes.length > 0
                ) {
                    const transitData = data.transitRoutes as TransitRoute[];

                    setTransitRoutes(transitData);

                    // 기본으로 0번째 루트 선택
                    setActiveTransitIndex(0);

                    // 지도 라인 세팅
                    const firstSegs = buildTransitPolylineSegments(transitData[0]);
                    setRouteSegments(firstSegs);

                    // 지도 bounds 맞추기
                    const k = (window as any).kakao;
                    fitMapToRouteSegments(k.maps, mapRef.current, firstSegs);

                    routesFound = true;
                }
            }

            // ---------- 도보 모드 ----------
            if (!routesFound && mode === 'walk') {
                if (
                    data &&
                    data.routes &&
                    Array.isArray(data.routes) &&
                    data.routes.length > 0
                ) {
                    const firstRoute = data.routes[0];

                    const summary: WalkRouteSummary = {
                        duration: firstRoute.durationInSeconds,
                        distance: firstRoute.distanceInMeters,
                        score: firstRoute.congestionScore,
                        instructions: firstRoute.instructions || [],
                    };
                    setWalkSummary(summary);

                    // 도보 전용 라인 (혼잡도 색)
                    parseAndSetPolyline(firstRoute.congestionPoints || []);

                    routesFound = true;
                }
            }

            // ---------- 패널/화면 전환 ----------
            if (routesFound) {
                setRoutePanelOpen(true);
                setResultsPanelOpen(false);
                setSelectedPlace(null);
            } else {
                alert("경로 정보를 찾을 수 없습니다.");
                setRoutePanelOpen(false);
            }

        } catch (error: any) {
            console.error("길찾기 오류:", error);
            alert(`길찾기 중 오류가 발생했습니다: ${error.message || error}`);
        } finally {
            setIsSearchLoading(false);
        }
    };
    // --- 👇 [수정] parseAndSetPolyline 함수 ---

    /** 폴리라인 파싱 함수 (congestionPoints가 없는 경우도 처리) */

    const parseAndSetPolyline = (congestionPoints: { latitude: number; longitude: number; congestionLevel: string }[]) => {
        // [수정] congestionPoints가 null이거나 비어있으면 즉시 종료
        if (!congestionPoints || congestionPoints.length < 2) {
            setRouteSegments(null);
            return;
        }
        const segments: RouteSegment[] = [];
        let currentSegment: RouteSegment = {
            path: [],
            color: colorFor(congestionPoints[0].congestionLevel)
        };
        for (let i = 0; i < congestionPoints.length; i++) {
        // ... (기존 for 루프 로직은 동일) ...
            const point = congestionPoints[i];
            const latLng = { lat: point.latitude, lng: point.longitude };
            const color = colorFor(point.congestionLevel);
            if (i === 0) {
                currentSegment.path.push(latLng);
            } else {
                if (color !== currentSegment.color) {
                    segments.push(currentSegment);
                    const lastPoint = currentSegment.path[currentSegment.path.length - 1];
                    currentSegment = { path: [lastPoint, latLng], color: color };
                } else {
                    currentSegment.path.push(latLng);
                }
            }
        }
        segments.push(currentSegment);
        setRouteSegments(segments);
        // 지도 범위 조정
        const bounds = new (window as any).kakao.maps.LatLngBounds();
        congestionPoints.forEach((p) => bounds.extend(new (window as any).kakao.maps.LatLng(p.latitude, p.longitude)));
        mapRef.current?.setBounds(bounds);
    }

    if (loading) {
        return (
            <div className="w-full h-full grid place-items-center bg-gray-100">
                <span className="text-lg font-semibold text-gray-700">
                    지도 로딩 중...
                </span>
            </div>
        );
    }

    // --- 렌더링 섹션 ---
    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* 1. 지도 */}
            <div className="absolute inset-0">
                <Map
                    center={center}
                    level={3}
                    style={{ width: "100%", height: "100%" }}
                    onCreate={(m) => (mapRef.current = m)}
                >
                    {/* 현재 내 위치 마커 (이건 항상 보이게 둘지 여부는 너 마음) */}
                    {myLocation &&
                        <MapMarker position={myLocation} image={myImage} zIndex={999} />
                    }

                    {/* 검색 결과 마커들: 길찾기 패널이 열려있지 않을 때만 표시 */}
                    {!routePanelOpen && results.map((r) => {
                        const pos = { lat: r.lat, lng: r.lng };
                        const active = r.id === selectedPlace?.id;

                        return (
                            <MapMarker
                                key={`item-${r.id}`}
                                position={pos}
                                image={active ? markerImg.active : markerImg.normal}
                                title={r.name}
                                zIndex={active ? 10 : 0}
                                onClick={() => {
                                    handleResultItemClick(r);
                                }}
                            />
                        );
                    })}

                    {/* 출발지 / 도착지 마커: 길찾기 모드일 때만 표시 */}
                    {routePanelOpen && origin && (
                        <MapMarker
                            position={{ lat: origin.lat, lng: origin.lng }}
                            image={startMarkerImg}
                            title={`출발: ${origin.name}`}
                            zIndex={1000}
                        />
                    )}

                    {routePanelOpen && destination && (
                        <MapMarker
                            position={{ lat: destination.lat, lng: destination.lng }}
                            image={destMarkerImg}
                            title={`도착: ${destination.name}`}
                            zIndex={1000}
                        />
                    )}

                    {/* 경로 Polyline (walk 혼잡색 / transit 세그먼트 색) */}
                    {routeSegments && routeSegments.map((seg, index) => (
                        <Polyline
                            key={`route-seg-${index}`}
                            path={seg.path}
                            strokeWeight={6}
                            strokeColor={seg.color}
                            strokeOpacity={0.8}
                            strokeStyle={"solid"}
                        />
                    ))}
                </Map>

            </div>
            {/* 2. 왼쪽 패널 */}
            <ResultPanel
                open={resultsPanelOpen}
                items={results} // 👈 AppPlace[] 전달
                activeId={selectedPlace?.id ?? null}
                onClose={() => {
                    setResultsPanelOpen(false);
                    setSelectedPlace(null);
                }}
                onSelect={(item) => {
                    // ResultPanel의 items가 AppPlace[]이므로 item은 AppPlace
                    handleResultItemClick(item as AppPlace);
                }}
                panelWidth={360}
                topMobileRem={9}
                topDesktopRem={5}
            />
            <RoutePanel
                open={routePanelOpen}
                originName={origin?.name}
                destinationName={destination?.name}

                travelMode={travelMode}
                onTravelModeChange={(mode) => {
                    setTravelMode(mode);
                    if (!(origin && destination)) {
                        alert("출발지와 도착지를 먼저 선택해주세요.");
                        return;
                    }
                    handleGetDirections(origin, destination, mode, sortOption);
                }}

                sortOption={sortOption}
                onSortChange={(sort) => {
                    setSortOption(sort);
                    if (origin && destination) {
                        handleGetDirections(origin, destination, travelMode, sort);
                    }
                }}

                // 도보
                walkSummary={walkSummary}

                // 대중교통
                transitRoutes={transitRoutes}
                activeTransitIndex={activeTransitIndex}
                onSelectTransitRoute={(idx) => {
                    // 1) 패널에서 어떤 경로 클릭했는지 state 반영
                    setActiveTransitIndex(prev => (prev === idx ? null : idx));

                    // 2) 지도 라인 업데이트
                    if (transitRoutes && transitRoutes[idx]) {
                        const segs = buildTransitPolylineSegments(transitRoutes[idx]);
                        setRouteSegments(segs);

                        // 지도 bounds 새로 잡기
                        const k = (window as any).kakao;
                        fitMapToRouteSegments(k.maps, mapRef.current, segs);
                    }
                }}

                onBack={() => {
                    setRoutePanelOpen(false);
                    setRouteSegments(null);
                    setWalkSummary(null);
                    setTransitRoutes(null);
                    setOrigin(null);
                    setDestination(null);
                    setActiveTransitIndex(null);
                    setTravelMode('walk');

                    if (results.length > 0) {
                        setResultsPanelOpen(true);
                    }
                }}
            />

            {/* 3. 상단 UI (검색, 버튼, 카테고리) */}
            <div className="absolute top-4 left-4 right-4 md:left-4 z-[1400] flex flex-col gap-2 md:flex-row md:items-center">
                {/* 1. 검색창 (TopSearchBar가 '검색' 버튼 포함) */}
                <div className="w-full md:w-auto md:min-w-[360px]">
                    <TopSearchBar
                        query={query}
                        onQueryChange={setQuery}
                        onClear={handleClearSearch}
                        onSearch={handleKakaoSearch} // 👈 '검색' 버튼은 카카오 검색
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                            // 자동완성 클릭을 위해 지연
                            setTimeout(() => setIsSearchFocused(false), 150);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleKakaoSearch(query); // 👈 'Enter' 키는 카카오 검색
                                setIsSearchFocused(false);
                            }
                        }}
                        isFocused={isSearchFocused}
                        isLoading={isSearchLoading} // 👈 검색용 로딩 state 전달
                    >
                        <AutoComplete suggestions={suggestions} onSelect={handleSuggestionSelect} />
                    </TopSearchBar>
                </div>
                {/* 2. "추천" 버튼 */}
                <button
                    type="button"
                    onClick={() => handleRecommendSearch(query)} // 👈 '추천' 버튼은 우리 API 검색
                    disabled={isSearchLoading || !query.trim()}
                    className="h-12 px-4 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 active:scale-95 disabled:bg-gray-400"
                >
                    추천
                </button>
                {/* 3. 카테고리 */}
                <Categories
                    items={CAT_ITEMS}
                    value={selectedCat}
                    onChange={handleCategoryChange}
                    className="w-full md:min-w-0 md:flex-1"
                />
                {/* 4. AI 버튼 */}
                <div className="self-end md:self-auto">
                    <AiButton onClick={() => setAiChatOpen(true)} />
                </div>
            </div>
            {/* 4. AI 패널 */}
            <AiAssistantPanel
                open={aiChatOpen}
                onClose={() => setAiChatOpen(true)}
                onButtonClose={(()=> setAiChatOpen(false))}
                onSubmit={handleAiSummit}
                query={aiQuery}
                onQueryChange={setAiQuery}
                messages={messages}
            />
            {/* 5. 현재 위치 버튼 */}
            <CurrentLocationButton onClick={handleGetCurrentLocation} />
        </div>
    );
}