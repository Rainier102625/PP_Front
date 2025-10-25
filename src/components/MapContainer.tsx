// src/components/MapContainer.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map, MapMarker, useKakaoLoader, MapInfoWindow } from "react-kakao-maps-sdk";
import TopSearchBar from "@/components/TopSearchBar";
import Categories from "@/components/Categories";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import AiButton from "@/components/AiButton";
import CurrentLocationButton from "@/components/CurrentLocationButton";
import AutoComplete, { AutoCompleteItem } from "@/components/AutoComplete";
import ResultPanel from "@/components/ResultPanel"; // (RecommendPanel -> ResultPanel)
import { ChatMessage } from "@/types/chatMessage";

// --- 타입 정의 섹션 ---

type LatLng = { lat: number; lng: number };
/** 카카오 API 원본 타입 */
type Place = kakao.maps.services.PlacesSearchResultItem;
/** 우리 API 원본 타입 */
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

/** [핵심] 카카오 + 우리 API를 통합하는 앱 전용 타입 */
export type AppPlace = {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    category?: string;
    congestionLevel?: string; // (우리 API에만 있음)
    phone?: string;           // (카카오 API에만 있음)
    placeUrl?: string;        // (카카오 API에만 있음)
    distance?: number;
};

/**
 * [어댑터 1] 우리 API 응답(Rec)을 AppPlace로 변환
 */
const recToAppPlace = (rec: Rec): AppPlace => ({
    id: rec.id.toString(),
    name: rec.name,
    address: rec.address,
    lat: Number(rec.latitude),
    lng: Number(rec.longitude),
    category: rec.category,
    congestionLevel: rec.congestionLevel,
});

/**
 * [어댑터 2] 카카오 API 응답(Place)을 AppPlace로 변환
 */
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

    // kakao refs
    const mapRef = useRef<kakao.maps.Map | null>(null);
    const placesRef = useRef<kakao.maps.services.Places | null>(null);
    const geocoderRef = useRef<kakao.maps.services.Geocoder | null>(null); // [수정] Geocoder 추가
    const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

    // Ai 대화창 상태
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'init-1', text: '안녕하세요! 반갑습니다. 무엇을 도와드릴까요? 궁금한 점이 있으시거나 도움이 필요하시면 언제든지 말씀해주세요! 😊', sender: 'ai' },
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
        if (!isSearchFocused || !query.trim() || !placesRef.current) {
            setSuggestions([]);
            return;
        }
        const k = (window as any).kakao;
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
                { sort: k.maps.services.SortBy.ACCURACY }
            );
        }, 200);
        return () => clearTimeout(t);
    }, [query, isSearchFocused]);

    // --- 👇 [추가] MapInfoWindow의 'close' 이벤트를 감지하는 훅 ---
    useEffect(() => {
        // 1. selectedPlace가 있고(인포윈도우가 열렸고),
        //    ref에 카카오 InfoWindow 객체가 잡혔을 때
        if (selectedPlace && infoWindowRef.current) {

            const k = (window as any).kakao;
            const iw = infoWindowRef.current;

            // 2. 'close' 이벤트(네이티브 X버튼)가 발생하면 실행할 함수
            const handleClose = () => {
                setSelectedPlace(null); // 👈 React state를 업데이트
            };

            // 3. 카카오맵 이벤트 리스너 등록
            k.maps.event.addListener(iw, 'close', handleClose);

            // 4. 클린업: selectedPlace가 바뀌거나(e.g., null이 됨)
            //    컴포넌트가 unmount될 때 리스너를 꼭 제거합니다.
            return () => {
                k.maps.event.removeListener(iw, 'close', handleClose);
            };
        }
    }, [selectedPlace]); // 👈 selectedPlace가 바뀔 때마다 이 로직을 실행
    // --- 👆 [추가] ---

    // --- 마커 이미지 (Memo) ---
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
    // [삭제] recMarkerImg (markerImg로 통합됨)

    // --- 유틸 함수 ---
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

    const centerTo = (pos: LatLng) => {
        setCenter(pos);
        const k = (window as any).kakao;
        const m = mapRef.current;
        if (m && k?.maps) m.panTo(new k.maps.LatLng(pos.lat, pos.lng));
    };

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

    // --- 핸들러 함수 ---

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

    /**
     * [검색 1 - 카카오] Enter키로 검색 (카카오 API)
     */
    const handleKakaoSearch = (q = query) => {
        const k = (window as any).kakao;
        if (!q.trim() || !placesRef.current) return;

        setIsSearchLoading(true);
        setResultsPanelOpen(true);
        setSelectedPlace(null);

        placesRef.current.keywordSearch(
            q,
            (data: Place[], status) => { // 👈 원본 Place 타입
                if (status === k.maps.services.Status.OK) {

                    const baseLocation = myLocation || center;

                    // [핵심] Place[] -> AppPlace[]로 변환 (distance 포함)
                    const spotsForPanel: AppPlace[] = data.map(place => {
                        const appPlace = kakaoPlaceToAppPlace(place);
                        return {
                            ...appPlace,
                            distance: haversineKm(baseLocation, { lat: appPlace.lat, lng: appPlace.lng })
                        };
                    });
                    // --- 👆 [수정] ---

                    setResults(spotsForPanel); // 👈 통합 state에 저장

                    // 지도 경계 이동
                    const b = new k.maps.LatLngBounds();
                    spotsForPanel.forEach((d) => b.extend(new k.maps.LatLng(d.lat, d.lng)));
                    mapRef.current?.setBounds(b);
                } else {
                    setResults([]);
                    setResultsPanelOpen(false);
                }
                setIsSearchLoading(false);
            },
            { sort: k.maps.services.SortBy.ACCURACY }
        );
    };

    /**
     * [검색 2 - 추천] "추천" 버튼으로 검색 (우리 API)
     */
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
            // 2. API 파라미터 준비
            const finalDateTime = new Date();
            const pad = (num: number) => num.toString().padStart(2, '0');
            const time = `${pad(finalDateTime.getHours())}:${pad(finalDateTime.getMinutes())}:${pad(finalDateTime.getSeconds())}`;
            const lat = location.getLat();
            const lon = location.getLng();
            const categoryQuery = selectedCat || ""; // 👈 카테고리 state 사용

            // http://pp-domain.duckdns.org:8082/api/recommend/with-congestion?lat=37.5665&lon=126.9780&time=14:30:00&congestionDateTime=2025-10-23T17:00:00&types=12

            // 3. 우리 API 호출
            const apiUrl = `http://pp-domain.duckdns.org:8082/api/recommend/?lat=${lat}&lon=${lon}&time=${time}&congestionDateTime=2025-10-01T17:00&type=${categoryQuery}`;
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
        setQuery("");                // 1. 검색창 텍스트
        setResults([]);            // 2. 결과 목록 (마커)
        setSelectedPlace(null);    // 3. 상세보기 (인포윈도우)
        setResultsPanelOpen(false);  // 4. 패널
        setIsSearchFocused(false);   // 5. 포커스
        setSelectedCat(null);        // 6. 카테고리
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
                    {myLocation &&
                        <MapMarker position={myLocation} image={myImage} zIndex={999} />}

                    {/* --- 👇 [수정] --- */}

                    {/* [요청 1] 상세검색 시에도 모든 마커를 표시합니다.
                      - selectedPlace ? : ... (삼항 연산자)를 제거합니다.
                      - results.map()을 항상 실행합니다.
                    */}
                    {results.map((r) => { // 👈 r은 AppPlace
                        const pos = { lat: r.lat, lng: r.lng };
                        // 👈 현재 아이템이 선택된 아이템(selectedPlace)인지 확인
                        const active = r.id === selectedPlace?.id;

                        return (
                            <MapMarker
                                key={`item-${r.id}`}
                                position={pos}
                                // 👈 active 상태에 따라 이미지와 zIndex 변경
                                image={active ? markerImg.active : markerImg.normal}
                                title={r.name}
                                zIndex={active ? 10 : 0} // 👈 선택된 마커가 위로 오도록
                                onClick={() => {
                                    handleResultItemClick(r);
                                }}
                            />
                        );
                    })}

                    {/*
                      [요청 2] MapInfoWindow를 수정합니다.
                      - selectedPlace가 있을 때만 렌더링합니다.
                      - removable={true}와 onClose를 사용해 기본 UI를 활용합니다.
                      - [버그 수정] selectedPlace의 속성명을 AppPlace 기준으로 수정합니다.
                    */}
                    {selectedPlace && (
                        <MapInfoWindow
                            // --- 👇 [수정] ---
                            onCreate={(iw) => (infoWindowRef.current = iw)} // 👈 ref 대신 onCreate 사용
                            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                            removable={true}  // 👈 기본 UI ('X' 버튼, 말풍선) 사용
                            // --- 👆 [수정] ---
                        >
                            {/* 기본 UI를 쓰므로, 커스텀 'X' 버튼과 배경 스타일은 제거합니다.
                              padding-right(30px)를 주어 'X' 버튼과 겹치지 않게 합니다.
                            */}
                            <div style={{ padding: '5px 30px 5px 5px', width: 'auto', minWidth: '200px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                    {selectedPlace.name}
                                </div>
                                <div style={{ fontSize: '13px' }}>
                                    {selectedPlace.address}
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                                    {selectedPlace.category}
                                </div>
                                {selectedPlace.congestionLevel && (
                                    <div style={{ fontSize: '13px', color: '#059669', marginTop: '3px', fontWeight: 'bold' }}>
                                        혼잡도: {selectedPlace.congestionLevel}
                                    </div>
                                )}
                                {selectedPlace.phone && (
                                    <div style={{ fontSize: '13px', color: 'green', marginTop: '3px' }}>
                                        {selectedPlace.phone}
                                    </div>
                                )}
                                {selectedPlace.placeUrl && (
                                    <a
                                        href={selectedPlace.placeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: 'blue', textDecoration: 'none', fontSize: '12px', marginTop: '5px', display: 'inline-block' }}
                                    >
                                        카카오맵에서 상세보기
                                    </a>
                                )}
                            </div>
                        </MapInfoWindow>
                    )}
                    {/* --- 👆👆 수정 완료 --- */}
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