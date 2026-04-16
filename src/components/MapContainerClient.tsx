// src/components/MapContainerClient.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map, MapMarker, useKakaoLoader, Polyline } from "react-kakao-maps-sdk";
import TopSearchBar from "@/components/TopSearchBar";
import Categories from "@/components/Categories";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import AiButton from "@/components/AiButton";
import CurrentLocationButton from "@/components/CurrentLocationButton";
import AutoComplete, { AutoCompleteItem } from "@/components/AutoComplete";
import ResultPanel from "@/components/ResultPanel";
import { ChatMessage } from "@/types/chatMessage";
import RoutePanel from "@/components/RoutePanel";
import * as turf from "@turf/turf";

import type { SeoulPoly, LatLng, Rec, PolylineSegment } from "@/types/map";
import type { AppPlace, WalkRouteSummary, TransitSegment, TransitRoute } from "@/types/route";
import { CatItem, INITIAL_CENTER, myMarkerImage, startMarkerImage, destMarkerImage } from "@/lib/map-constants";
import {
    colorFor,
    colorForTransitMode,
    kakaoPlaceToAppPlace,
    recToAppPlace,
    buildTransitPolylineSegments,
    fitMapToRouteSegments,
} from "@/lib/map-utils";

// Re-export shared types for consumers that previously imported from MapContainer
export type { AppPlace, WalkRouteSummary, TransitSegment, TransitRoute };

import InfoWindow = kakao.maps.InfoWindow;

type Place = kakao.maps.services.PlacesSearchResultItem;

// 지도 bounds를 경로 전체에 맞게 조정 (내부 헬퍼 — 이미 map-utils에 있지만 kakao 글로벌 참조가 필요)
function fitMapToCongestionPoints(
    mapObj: kakao.maps.Map | null,
    congestionPoints: { latitude: number; longitude: number; congestionLevel: string }[]
) {
    if (!mapObj || !congestionPoints.length) return;
    const bounds = new (window as any).kakao.maps.LatLngBounds();
    congestionPoints.forEach((p) =>
        bounds.extend(new (window as any).kakao.maps.LatLng(p.latitude, p.longitude))
    );
    mapObj.setBounds(bounds);
}

// ----------------- Props -----------------

interface MapContainerClientProps {
    seoulBoundary: SeoulPoly | null;
    categoryItems: CatItem[];
}

// ----------------- 컴포넌트 -----------------

export default function MapContainerClient({ seoulBoundary, categoryItems }: MapContainerClientProps) {
    const [loading] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY!,
        libraries: ["services"],
    });

    // 지도/검색 관련 state
    const [center, setCenter] = useState<LatLng>(INITIAL_CENTER);
    const [myLocation, setMyLocation] = useState<LatLng | null>(null);
    const [query, setQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]);

    // 검색 결과들
    const [results, setResults] = useState<AppPlace[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<AppPlace | null>(null);
    const [resultsPanelOpen, setResultsPanelOpen] = useState(false);

    // 추천 카테고리
    const [selectedCat, setSelectedCat] = useState<string | null>(null);

    // 로딩/에러
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSearchLoading, setIsSearchLoading] = useState(false);

    // 길찾기
    const [origin, setOrigin] = useState<AppPlace | null>(null);
    const [destination, setDestination] = useState<AppPlace | null>(null);

    // 길찾기 패널 열림 여부
    const [routePanelOpen, setRoutePanelOpen] = useState(false);

    // 지도에 그릴 라인(도보/대중교통)
    const [routeSegments, setRouteSegments] = useState<PolylineSegment[] | null>(null);

    // 정렬 옵션
    const [sortOption, setSortOption] = useState<"duration" | "congestion">("duration");

    // 이동 모드
    const [travelMode, setTravelMode] = useState<"walk" | "transit">("walk");

    // 패널 표시용 도보 요약
    const [walkSummary, setWalkSummary] = useState<WalkRouteSummary | null>(null);

    // 패널 표시용 대중교통 경로 후보들
    const [transitRoutes, setTransitRoutes] = useState<TransitRoute[] | null>(null);

    // 현재 선택된 대중교통 경로 index
    const [activeTransitIndex, setActiveTransitIndex] = useState<number | null>(null);

    // kakao 관련 ref
    const mapRef = useRef<kakao.maps.Map | null>(null);
    const placesRef = useRef<kakao.maps.services.Places | null>(null);
    const geocoderRef = useRef<kakao.maps.services.Geocoder | null>(null);
    const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

    // AI 패널
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "init-1",
            sender: "ai",
            text: "안녕하세요! 반갑습니다. 무엇을 도와드릴까요? 궁금한 점이 있으시거나 도움이 필요하시면 언제든지 말씀해주세요! 😊",
        },
        { id: "init-2", sender: "ai", text: "추천 질문을 눌러 시작해보세요!" },
        { id: "init-3", sender: "ai", recommendation: "강남역 주변에 카페 찾아줘" },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Kakao SDK 준비
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

    // 자동완성
    useEffect(() => {
        const k = (window as any).kakao;
        if (!isSearchFocused || !query.trim() || !placesRef.current) {
            setSuggestions([]);
            return;
        }

        const seoulBounds = new k.maps.LatLngBounds(
            new k.maps.LatLng(37.413294, 126.734086),
            new k.maps.LatLng(37.715133, 127.269311)
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
                    } else {
                        setSuggestions([]);
                    }
                },
                {
                    sort: k.maps.services.SortBy.ACCURACY,
                    bounds: seoulBounds,
                }
            );
        }, 200);

        return () => {
            clearTimeout(t);
        };
    }, [query, isSearchFocused]);

    // 인포윈도우
    useEffect(() => {
        const k = (window as any).kakao;
        if (!k?.maps || !mapRef.current) return;

        const map = mapRef.current;

        if (!infoWindowRef.current) {
            infoWindowRef.current = new k.maps.InfoWindow({
                removable: true,
                content: "",
            });
        }

        const iw: InfoWindow | null = infoWindowRef.current;

        const handleClose = () => {
            setSelectedPlace(null);
            setRouteSegments(null);
        };

        if (selectedPlace && iw) {
            const contentDiv = document.createElement("div");
            contentDiv.style.padding = "8px 30px 30px 10px";
            contentDiv.style.width = "auto";
            contentDiv.style.maxWidth = "400px";
            contentDiv.style.minWidth = "200px";
            contentDiv.style.lineHeight = "1.4";
            contentDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 15px; overflow-wrap: break-word; word-break: keep-all;">
                    ${selectedPlace.name}
                </div>
                <div style="font-size: 10px; color: #333; overflow-wrap: break-word; word-break: keep-all;">
                    ${selectedPlace.address}
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 4px;">
                    ${selectedPlace.category || ""}
                </div>
                ${
                selectedPlace.phone
                    ? `<div style="font-size: 13px; color: green; margin-top: 4px;">${selectedPlace.phone}</div>`
                    : ""
            }
                ${
                selectedPlace.placeUrl
                    ? `<a href="${selectedPlace.placeUrl}" target="_blank" rel="noreferrer" style="color: blue; text-decoration: none; font-size: 12px; margin-top: 6px; display: inline-block;">카카오맵에서 상세보기</a>`
                    : ""
            }
                ${
                selectedPlace.congestionLevel
                    ? `<div style="font-size: 13px; color: #059669; margin-top: 4px; font-weight: bold;">혼잡도: ${selectedPlace.congestionLevel}</div>`
                    : ""
            }
            `;

            const buttonContainer = document.createElement("div");
            buttonContainer.style.marginTop = "10px";
            buttonContainer.style.display = "flex";
            buttonContainer.style.gap = "8px";

            const startButton = document.createElement("button");
            startButton.textContent = "여기서 출발";
            startButton.style.padding = "4px 8px";
            startButton.style.backgroundColor = "#007bff";
            startButton.style.color = "white";
            startButton.style.border = "none";
            startButton.style.borderRadius = "4px";
            startButton.style.cursor = "pointer";
            startButton.onclick = () => {
                setOrigin(selectedPlace);
                alert(`${selectedPlace.name}을(를) 출발지로 설정했습니다.`);
                iw.close();
            };

            const endButton = document.createElement("button");
            endButton.textContent = "여기로 도착";
            endButton.style.padding = "4px 8px";
            endButton.style.backgroundColor = "#28a745";
            endButton.style.color = "white";
            endButton.style.border = "none";
            endButton.style.borderRadius = "4px";
            endButton.style.cursor = "pointer";
            endButton.onclick = () => {
                setDestination(selectedPlace);
                alert(`${selectedPlace.name}을(를) 도착지로 설정했습니다.`);
                iw.close();
            };

            buttonContainer.appendChild(startButton);
            buttonContainer.appendChild(endButton);
            contentDiv.appendChild(buttonContainer);

            iw.setContent(contentDiv);
            iw.setPosition(new k.maps.LatLng(selectedPlace.lat, selectedPlace.lng));
            iw.setZIndex(1);
            iw.open(map);

            k.maps.event.addListener(iw, "close", handleClose);
        } else {
            if (iw) iw.close();
        }

        return () => {
            if (iw) {
                k.maps.event.removeListener(iw, "close", handleClose);
            }
        };
    }, [selectedPlace]);

    // 출발/도착/모드/정렬 바뀔 때마다 경로 호출
    useEffect(() => {
        if (origin && destination) {
            handleGetDirections(origin, destination, travelMode, sortOption);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origin, destination, travelMode, sortOption]);

    // 마커 이미지 memo
    const markerImg = useMemo(
        () => ({
            normal: {
                src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="10" fill="#374151"/>
                      <circle cx="16" cy="16" r="5" fill="white"/>
                    </svg>`
                )}`,
                size: { width: 28, height: 28 },
                options: { offset: { x: 14, y: 14 } },
            },
            active: {
                src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="11" fill="#2563eb"/>
                      <circle cx="16" cy="16" r="6" fill="white"/>
                    </svg>`
                )}`,
                size: { width: 32, height: 32 },
                options: { offset: { x: 16, y: 16 } },
            },
        }),
        []
    );

    // 거리 계산
    const haversineKm = (a: LatLng, b: LatLng) => {
        const R = 6371;
        const dLat = (Math.PI / 180) * (b.lat - a.lat);
        const dLng = (Math.PI / 180) * (b.lng - a.lng);
        const la1 = (Math.PI / 180) * a.lat;
        const la2 = (Math.PI / 180) * b.lat;
        const x =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(x));
    };

    // 지도 중심 이동
    const centerTo = (pos: LatLng) => {
        setCenter(pos);
        const k = (window as any).kakao;
        const m = mapRef.current;
        if (m && k?.maps) m.panTo(new k.maps.LatLng(pos.lat, pos.lng));
    };

    // 지오코딩
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

    // 현재 위치
    const handleGetCurrentLocation = () => {
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

    // 카카오 검색
    const handleKakaoSearch = (q = query) => {
        const k = (window as any).kakao;
        if (!q.trim() || !placesRef.current) return;

        setIsSearchLoading(true);
        setResultsPanelOpen(true);
        setSelectedPlace(null);

        const seoulBounds = new k.maps.LatLngBounds(
            new k.maps.LatLng(37.413294, 126.734086),
            new k.maps.LatLng(37.715133, 127.269311)
        );

        placesRef.current.keywordSearch(
            q,
            async (data: Place[], status) => {
                if (status === k.maps.services.Status.OK) {
                    const filteredData = data.filter((place) => {
                        if (!seoulBoundary) return true;
                        try {
                            const point = turf.point([Number(place.x), Number(place.y)]);
                            return turf.booleanPointInPolygon(point, seoulBoundary);
                        } catch (e) {
                            console.error("Point in polygon check error:", e);
                            return false;
                        }
                    });

                    const baseLocation = myLocation || center;

                    let spotsForPanel: AppPlace[] = filteredData.map((place) => {
                        const appPlace = kakaoPlaceToAppPlace(place);
                        return {
                            ...appPlace,
                            distance: haversineKm(baseLocation, {
                                lat: appPlace.lat,
                                lng: appPlace.lng,
                            }),
                        };
                    });

                    try {
                        spotsForPanel = await fetchCongestionData(spotsForPanel);
                    } catch (error) {
                        console.error("혼잡도 데이터 통합 중 오류:", error);
                    }

                    setResults(spotsForPanel);

                    const b = new k.maps.LatLngBounds();
                    spotsForPanel.forEach((d) =>
                        b.extend(new k.maps.LatLng(d.lat, d.lng))
                    );
                    mapRef.current?.setBounds(b);
                } else {
                    setResults([]);
                    setResultsPanelOpen(false);
                }
                setIsSearchLoading(false);
            },
            {
                sort: k.maps.services.SortBy.ACCURACY,
                bounds: seoulBounds,
            }
        );
    };

    // 혼잡도 API
    const fetchCongestionData = async (places: AppPlace[]): Promise<AppPlace[]> => {
        if (places.length === 0) {
            return [];
        }

        const now = new Date();
        const pad = (num: number) => num.toString().padStart(2, "0");
        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
            now.getSeconds()
        )}`;
        const datetime = "2025-10-01T" + time;

        // /api/congestion 이 기대하는 형식: [{latitude, longitude, datetime}]
        const requestBody = places.map((p) => ({
            latitude: p.lat,
            longitude: p.lng,
            datetime,
        }));

        try {
            const response = await fetch("/api/congestion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                console.error(
                    "혼잡도 API 오류:",
                    response.status,
                    response.statusText
                );
                return places;
            }

            const data: { latitude: number; longitude: number; datetime: string; congestionLevel: string }[] = await response.json();

            if (Array.isArray(data) && data.length === places.length) {
                return places.map((place, index) => ({
                    ...place,
                    congestionLevel: data[index].congestionLevel,
                }));
            } else {
                console.error("혼잡도 API 응답 형식 오류 또는 길이 불일치");
                return places;
            }
        } catch (error) {
            console.error("혼잡도 API 호출 중 오류:", error);
            return places;
        }
    };

    // 추천 검색
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
            const pad = (num: number) => num.toString().padStart(2, "0");
            const time = `${pad(finalDateTime.getHours())}:${pad(
                finalDateTime.getMinutes()
            )}:${pad(finalDateTime.getSeconds())}`;

            const lat = location.getLat();
            const lon = location.getLng();
            const categoryQuery = selectedCat || "";

            const apiUrl = `/api/recommend?lat=${lat}&lon=${lon}&time=${time}&congestionDateTime=2025-10-01T${time}&type=${categoryQuery}`;

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

            const categoryIdToKeyMap: { [key: string]: string } = {
                "12": "tourist_attraction",
                "14": "cultural_facilities",
                "15": "festivals_performances_events",
                "25": "travel_course",
                "28": "leisure_sports",
                "32": "accommodation",
                "38": "shopping",
                "39": "food",
            };

            let allSpots: Rec[] = [];
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

            const spotsForPanel: AppPlace[] = allSpots.map(recToAppPlace);

            setResults(spotsForPanel);

            const k = (window as any).kakao;
            const b = new k.maps.LatLngBounds();
            spotsForPanel.forEach((d) =>
                b.extend(new k.maps.LatLng(d.lat, d.lng))
            );
            b.extend(location);
            mapRef.current?.setBounds(b);
        } catch (error) {
            console.error("추천 검색 처리 중 오류:", error);
            alert("추천 검색 중 오류가 발생했습니다.");
            setResultsPanelOpen(false);
        } finally {
            setIsSearchLoading(false);
        }
    };

    // 자동완성 항목 클릭
    const handleSuggestionSelect = (item: AutoCompleteItem) => {
        setQuery(item.place_name);
        setIsSearchFocused(false);
    };

    // 카테고리 변경
    const handleCategoryChange = (code: string | null) => {
        if (code === null || code === selectedCat) {
            setSelectedCat(null);
            return;
        }
        setSelectedCat(code);
    };

    // 검색 결과 리스트 아이템 클릭
    const handleResultItemClick = (item: AppPlace) => {
        setSelectedPlace(item);

        const pos = { lat: item.lat, lng: item.lng };
        setCenter(pos);

        const k = (window as any).kakao;
        const m = mapRef.current;
        if (m && k?.maps) {
            const moveLatLon = new k.maps.LatLng(pos.lat, pos.lng);
            m.panTo(moveLatLon);
            m.setLevel(3, { animate: true });
        }
    };

    // 전체 초기화
    const handleClearSearch = () => {
        setQuery("");
        setResults([]);
        setSelectedPlace(null);
        setResultsPanelOpen(false);
        setIsSearchFocused(false);
        setSelectedCat(null);

        setOrigin(null);
        setDestination(null);
        setRouteSegments(null);
        setWalkSummary(null);
        setTransitRoutes(null);
        setRoutePanelOpen(false);
        setActiveTransitIndex(null);
        setTravelMode("walk");
        setSortOption("duration");
    };

    // AI 전송
    const handleAiSummit = async (textOverride?: string) => {
        const textToSend = textOverride || aiQuery;
        const trimmedQuery = textToSend.trim();
        if (!trimmedQuery || isLoading) return;

        const newUserMessage: ChatMessage = {
            id: Date.now(),
            text: trimmedQuery,
            sender: "user",
        };
        const currentMessages = [...messages, newUserMessage];

        setMessages(currentMessages);
        setAiQuery("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: currentMessages }),
            });

            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const data = await response.json();
            const aiResponse: ChatMessage = {
                id: Date.now() + 1,
                text: data.text,
                sender: "ai",
            };
            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            console.error("Failed to fetch AI response:", error);
            const errorResponse: ChatMessage = {
                id: Date.now() + 1,
                text: "죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.",
                sender: "ai",
            };
            setMessages((prev) => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    // 경로 API 호출
    const handleGetDirections = async (
        startPoint: AppPlace,
        endPoint: AppPlace,
        mode: "walk" | "transit",
        sort: "duration" | "congestion"
    ) => {
        setIsSearchLoading(true);

        setRouteSegments(null);
        setWalkSummary(null);
        setTransitRoutes(null);
        setActiveTransitIndex(null);

        try {
            let requestBody: any;
            if (mode === "transit") {
                requestBody = {
                    startX: startPoint.lng,
                    startY: startPoint.lat,
                    endX: endPoint.lng,
                    endY: endPoint.lat,
                    mode: "transit",
                    departureTime: `2025-10-01T${new Date().toISOString().substring(11, 19)}`,
                };
            } else {
                requestBody = {
                    startX: startPoint.lng,
                    startY: startPoint.lat,
                    endX: endPoint.lng,
                    endY: endPoint.lat,
                    sort: sort,
                    departureTime: `2025-10-01T${new Date().toISOString().substring(11, 19)}`,
                };
            }

            const response = await fetch("/api/route-directions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`길찾기 API 호출 실패 (${response.status})`);
            }

            const data = await response.json();

            let routesFound = false;

            // 대중교통
            if (mode === "transit") {
                if (
                    data &&
                    Array.isArray(data.transitRoutes) &&
                    data.transitRoutes.length > 0
                ) {
                    const transitData = data.transitRoutes as TransitRoute[];
                    setTransitRoutes(transitData);

                    setActiveTransitIndex(0);

                    const firstSegs = buildTransitPolylineSegments(transitData[0]);
                    setRouteSegments(firstSegs);

                    const k = (window as any).kakao;
                    fitMapToRouteSegments(k.maps, mapRef.current, firstSegs);

                    routesFound = true;
                }
            }

            // 도보
            if (!routesFound && mode === "walk") {
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

                    parseAndSetPolyline(firstRoute.congestionPoints || []);

                    routesFound = true;
                }
            }

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

    // 도보 혼잡도 -> PolylineSegment[]
    const parseAndSetPolyline = (
        congestionPoints: {
            latitude: number;
            longitude: number;
            congestionLevel: string;
        }[]
    ) => {
        if (!congestionPoints || congestionPoints.length < 2) {
            setRouteSegments(null);
            return;
        }

        const segments: PolylineSegment[] = [];

        let currentSegment: PolylineSegment = {
            path: [],
            color: colorFor(congestionPoints[0].congestionLevel),
        };

        for (let i = 0; i < congestionPoints.length; i++) {
            const point = congestionPoints[i];
            const latLng = {
                lat: point.latitude,
                lng: point.longitude,
            };
            const color = colorFor(point.congestionLevel);

            if (i === 0) {
                currentSegment.path.push(latLng);
            } else {
                if (color !== currentSegment.color) {
                    segments.push(currentSegment);
                    const lastPoint =
                        currentSegment.path[currentSegment.path.length - 1];
                    currentSegment = {
                        path: [lastPoint, latLng],
                        color: color,
                    };
                } else {
                    currentSegment.path.push(latLng);
                }
            }
        }
        segments.push(currentSegment);

        setRouteSegments(segments);
        fitMapToCongestionPoints(mapRef.current, congestionPoints);
    };

    if (loading) {
        return (
            <div className="w-full h-full grid place-items-center bg-gray-100">
                <span className="text-lg font-semibold text-gray-700">
                    지도 로딩 중...
                </span>
            </div>
        );
    }

    // --------- 렌더링 ---------
    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* 지도 */}
            <div className="absolute inset-0">
                <Map
                    center={center}
                    level={3}
                    style={{ width: "100%", height: "100%" }}
                    onCreate={(m) => (mapRef.current = m)}
                >
                    {myLocation && (
                        <MapMarker position={myLocation} image={myMarkerImage} zIndex={999} />
                    )}

                    {!routePanelOpen &&
                        results.map((r) => {
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

                    {routePanelOpen && origin && (
                        <MapMarker
                            position={{ lat: origin.lat, lng: origin.lng }}
                            image={startMarkerImage}
                            title={`출발: ${origin.name}`}
                            zIndex={1000}
                        />
                    )}

                    {routePanelOpen && destination && (
                        <MapMarker
                            position={{ lat: destination.lat, lng: destination.lng }}
                            image={destMarkerImage}
                            title={`도착: ${destination.name}`}
                            zIndex={1000}
                        />
                    )}

                    {routeSegments &&
                        routeSegments.map((seg, index) => (
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

            {/* 검색 결과 패널 */}
            <ResultPanel
                open={resultsPanelOpen}
                items={results}
                activeId={selectedPlace?.id ?? null}
                onClose={() => {
                    setResultsPanelOpen(false);
                    setSelectedPlace(null);
                }}
                onSelect={(item) => {
                    handleResultItemClick(item as AppPlace);
                }}
                panelWidth={360}
                topMobileRem={9}
                topDesktopRem={5}
            />

            {/* 경로 패널 */}
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
                }}
                sortOption={sortOption}
                onSortChange={(sort) => {
                    setSortOption(sort);
                    if (!(origin && destination)) {
                        alert("출발지와 도착지를 먼저 선택해주세요.");
                        return;
                    }
                }}
                walkSummary={walkSummary}
                transitRoutes={transitRoutes}
                activeTransitIndex={activeTransitIndex}
                onSelectTransitRoute={(idx) => {
                    setActiveTransitIndex((prev) => (prev === idx ? null : idx));

                    if (transitRoutes && transitRoutes[idx]) {
                        const segs = buildTransitPolylineSegments(transitRoutes[idx]);
                        setRouteSegments(segs);

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
                    setTravelMode("walk");

                    if (results.length > 0) {
                        setResultsPanelOpen(true);
                    }
                }}
            />

            {/* 상단 UI */}
            <div className="absolute top-4 left-4 right-4 md:left-4 z-[1400] flex flex-col gap-2 md:flex-row md:items-center">
                <div className="w-full md:w-auto md:min-w-[360px]">
                    <TopSearchBar
                        query={query}
                        onQueryChange={setQuery}
                        onClear={handleClearSearch}
                        onSearch={handleKakaoSearch}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                            setTimeout(() => setIsSearchFocused(false), 150);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleKakaoSearch(query);
                                setIsSearchFocused(false);
                            }
                        }}
                        isFocused={isSearchFocused}
                        isLoading={isSearchLoading}
                    >
                        <AutoComplete suggestions={suggestions} onSelect={handleSuggestionSelect} />
                    </TopSearchBar>
                </div>

                <button
                    type="button"
                    onClick={() => handleRecommendSearch(query)}
                    disabled={isSearchLoading || !query.trim()}
                    className="h-12 px-4 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 active:scale-95 disabled:bg-gray-400"
                >
                    추천
                </button>

                <Categories
                    items={categoryItems}
                    value={selectedCat}
                    onChange={handleCategoryChange}
                    className="w-full md:min-w-0 md:flex-1"
                />

                <div className="self-end md:self-auto">
                    <AiButton onClick={() => setAiChatOpen(true)} />
                </div>
            </div>

            {/* AI 패널 */}
            <AiAssistantPanel
                open={aiChatOpen}
                onClose={() => setAiChatOpen(true)}
                onButtonClose={() => setAiChatOpen(false)}
                onSubmit={handleAiSummit}
                query={aiQuery}
                onQueryChange={setAiQuery}
                messages={messages}
            />

            {/* 내 위치 버튼 */}
            <CurrentLocationButton onClick={handleGetCurrentLocation} />
        </div>
    );
}
