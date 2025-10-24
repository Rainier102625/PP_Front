"use client";

import { useState, useEffect } from "react";

import { MapContainer } from "@/components/MapContainer";

import { OdsayRoute } from "@/types/odsay";
import { Spot } from "@/types/spot";
import { format } from "date-fns";
import { getDistance } from "@/lib/distance";

import AppShell from "@/components/AppShell";
import TopSearchBar from "@/components/TopSearchBar";
import MenuDrawer from "@/components/MenuDrawer";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import Categories from "@/components/Categories";
import AiButton from "@/components/AiButton";
import CurrentLocationButton from "@/components/CurrentLocationButton";
import AutoComplete, { AutoCompleteItem } from "@/components/AutoComplete";

// 추가: 혼잡도 지도 컴포넌트
import SeoulCongestionMap from "@/components/ui/SeoulCongestionMap";

export default function Home() {
    // 애플리케이션의 핵심 상태들을 관리합니다.
    const [query, setQuery] = useState("");
    // 새로운 상태 추가
    const [menuOpen, setMenuOpen] = useState(false);
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiSideOpen, setAiSideOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]);

    const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>("13:30");

    const [recommendedSpots, setRecommendedSpots] = useState<Spot[]>([]);
    const [isRecsPanelOpen, setIsRecsPanelOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [directionsDestination, setDirectionsDestination] = useState<Spot | null>(null);
    const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
    const [directionsResult, setDirectionsResult] = useState<OdsayRoute[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

    // 추가: 혼잡도 모드 on/off
    const [isCongestionMode, setIsCongestionMode] = useState(false);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const location = new window.naver.maps.LatLng(latitude, longitude);
                    setSearchedLocation(location);
                    setQuery("현재 위치");
                },
                (error) => {
                    console.error("Error getting current location:", error);
                    alert("현재 위치를 가져오는 데 실패했습니다.");
                }
            );
        } else {
            alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
        }
    };

    // 페이지 로드 시 기본 위치(서울역) 설정
    useEffect(() => {
        if (window.naver) {
            const defaultLocation = new window.naver.maps.LatLng(37.5557, 126.9730);
            setSearchedLocation(defaultLocation);
        }
    }, []);

    // 자동완성
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        const handler = setTimeout(() => {
            const fetchSuggestions = async () => {
                try {
                    const response = await fetch(`/api/search?query=${query}`);
                    const data = await response.json();
                    setSuggestions(data.documents || []);
                } catch (error) {
                    console.error("자동 완성 검색 실패:", error);
                    setSuggestions([]);
                }
            };
            fetchSuggestions();
        }, 200);
        return () => clearTimeout(handler);
    }, [query]);

    // 텍스트 → 좌표
    const geocodeQuery = (queryToGeocode: string): Promise<naver.maps.LatLng> => {
        return new Promise(async (resolve, reject) => {
            if (!queryToGeocode.trim()) {
                reject("검색어가 없습니다.");
                return;
            }
            try {
                const response = await fetch(`/api/search?query=${queryToGeocode}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
                }
                const data = await response.json();
                if (data.documents && data.documents.length > 0) {
                    const firstResult = data.documents[0];
                    const location = new window.naver.maps.LatLng(Number(firstResult.y), Number(firstResult.x));
                    resolve(location);
                } else {
                    reject(`'${queryToGeocode}'에 대한 검색 결과가 없습니다.`);
                }
            } catch (error) {
                if (error instanceof Error) {
                    reject(`좌표 변환 중 오류: ${error.message}`);
                } else {
                    reject("알 수 없는 오류로 좌표 변환에 실패했습니다.");
                }
            }
        });
    };

    const handleSearch = async () => {
        setIsLoading(true);
        setIsRecsPanelOpen(true);
        setRecommendedSpots([]);
        setDirectionsDestination(null);
        setDirectionsResult([]);
        setSelectedRouteIndex(0);

        try {
            const location = await geocodeQuery(query);
            setSearchedLocation(location);

            const finalDateTime = new Date();
            if (selectedTime) {
                const [hours, minutes] = selectedTime.split(":");
                finalDateTime.setHours(Number(hours), Number(minutes), 0, 0);
            }

            const lat = location.lat();
            const lon = location.lng();
            const time = format(finalDateTime, "HH:mm:ss");
            const categoryQuery = selectedCategory || "";

            const apiUrl = `http://pp-domain.duckdns.org:8082/api/recommend/?lat=${lat}&lon=${lon}&time=${time}&type=${categoryQuery}&radius=8000`;

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiResponse = await response.json();

            const results = apiResponse[0]?.results;
            if (!results) {
                alert("추천 장소를 가져오지 못했습니다.");
                setRecommendedSpots([]);
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

            let allSpots: any[] = [];
            if (categoryQuery && categoryIdToKeyMap[categoryQuery]) {
                const categoryKey = categoryIdToKeyMap[categoryQuery];
                allSpots = results[categoryKey] || [];
            } else {
                allSpots = Object.values(results).flat();
            }

            if (allSpots.length === 0) {
                alert("해당 조건에 맞는 추천 장소가 없습니다.");
            }

            const spotsWithRecalculatedDistance = allSpots.map((item) => ({
                id: item.id,
                name: item.name,
                address: item.address,
                longitude: Number(item.longitude),
                latitude: Number(item.latitude),
                category: item.category,
                distanceMeters: getDistance(lat, lon, Number(item.latitude), Number(item.longitude)),
                details: item,
            }));

            spotsWithRecalculatedDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
            setRecommendedSpots(spotsWithRecalculatedDistance as Spot[]);
        } catch (error) {
            console.error("검색 처리 중 오류 발생:", error);
            alert(typeof error === "string" ? error : "검색 중 오류가 발생했습니다.");
            setIsRecsPanelOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionSelect = (item: AutoCompleteItem) => {
        setQuery(item.place_name);
        setSuggestions([]);
        setIsSearchFocused(false);

        if (window.naver) {
            const location = new window.naver.maps.LatLng(parseFloat(item.y), parseFloat(item.x));
            setSearchedLocation(location);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (suggestions.length > 0) {
                handleSuggestionSelect(suggestions[0]);
            } else {
                handleSearch();
            }
            setIsSearchFocused(false);
        }
    };

    const handleGetDirections = async (spot: Spot) => {
        if (!searchedLocation) {
            alert("출발지가 설정되지 않았습니다. 먼저 지역을 검색해주세요.");
            return;
        }

        setDirectionsDestination(spot);
        setIsDirectionsLoading(true);
        setDirectionsResult([]);
        setSelectedRouteIndex(0);

        const distance = getDistance(searchedLocation.lat(), searchedLocation.lng(), spot.latitude, spot.longitude);

        if (distance < 700) {
            const walkingTime = Math.round(distance / 80);

            const walkingRoute: OdsayRoute = {
                pathInfo: {
                    info: {
                        totalTime: walkingTime,
                        payment: 0,
                        busTransitCount: 0,
                        subwayTransitCount: 0,
                        totalDistance: distance,
                    },
                    subPath: [
                        {
                            trafficType: 3,
                            distance: distance,
                            sectionTime: walkingTime,
                            startX: searchedLocation.lng(),
                            startY: searchedLocation.lat(),
                            endX: spot.longitude,
                            endY: spot.latitude,
                        },
                    ],
                },
                geometry: null,
            };

            setDirectionsResult([walkingRoute]);
            setIsDirectionsLoading(false);
            return;
        }

        try {
            const url = `/api/odsay-directions?sx=${searchedLocation.lng().toFixed(6)}&sy=${searchedLocation.lat().toFixed(6)}&ex=${spot.longitude.toFixed(6)}&ey=${spot.latitude.toFixed(6)}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "경로 데이터를 가져오는 데 실패했습니다.");
            }
            const data = await response.json();
            data.sort((a: OdsayRoute, b: OdsayRoute) => a.pathInfo.info.totalTime - b.pathInfo.info.totalTime);
            setDirectionsResult(data);
        } catch (e) {
            if (e instanceof Error) {
                alert(e.message);
            } else {
                alert("경로를 가져오는 중 알 수 없는 오류가 발생했습니다.");
            }
            setDirectionsDestination(null);
        } finally {
            setIsDirectionsLoading(false);
        }
    };

    const handleSelectRoute = (index: number) => {
        setSelectedRouteIndex(index);
    };

    return (
        <AppShell mode="desktop" width={1280}>
            <div className="relative mx-auto max-w-[1280px] h-[100dvh]">
                {/* 좌측 고정 레일 */}
                <aside className="hidden md:block absolute top-0 bottom-0 left-0 z-[1200] w-16">
                    <div className="h-full bg-white/95 border border-gray-200 shadow-xl flex flex-col items-center gap-2 py-2">
                        <button
                            aria-label="menu"
                            onClick={() => setMenuOpen(true)}
                            className="w-10 h-10 grid place-items-center rounded-xl bg-blue-600 text-white shadow"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24">
                                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>

                        {/* 혼잡도 토글 버튼 (링크 → 버튼으로 변경) */}
                        <button
                            aria-label="혼잡도 지도"
                            onClick={() => setIsCongestionMode((v) => !v)}
                            className={`w-10 h-10 grid place-items-center rounded-xl border text-gray-700 hover:bg-gray-50 active:scale-95 transition shadow ${
                                isCongestionMode ? "bg-gray-100" : "bg-white"
                            }`}
                            title="혼잡도 지도 토글"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 3v9l7.5 4.33A9 9 0 1 1 12 3z" fill="currentColor" />
                            </svg>
                        </button>

                        {/* 나머지 버튼들 그대로 */}
                        <button className="w-10 h-10 grid place-items-center rounded-xl bg-white text-gray-700 border">
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z" fill="currentColor" /></svg>
                        </button>
                        <button className="w-10 h-10 grid place-items-center rounded-xl bg-white text-gray-700 border">
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 8v5l4 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                        </button>
                        <div className="mt-auto" />
                        <button className="w-10 h-10 grid place-items-center rounded-xl bg-white text-gray-700 border">
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5zm0 9l9 5-9 5-9-5 9-5z" fill="currentColor" /></svg>
                        </button>
                    </div>
                </aside>

                {/* 모바일 하단 도크 */}
                <nav className="md:hidden absolute left-0 right-0 bottom-0 z-[1300]">
                    <div
                        className="
              h-16 w-full backdrop-blur-md bg-white/80
              border-t border-gray-200 rounded-t-2xl
              shadow-[0_-8px_24px_rgba(0,0,0,0.15)]
              flex items-center px-2
              divide-x divide-gray-200/60
              pb-[env(safe-area-inset-bottom)]
            "
                    >
                        {["메뉴", "저장", "최근", "레이어"].map((label) => (
                            <button
                                key={label}
                                onClick={label === "메뉴" ? () => setMenuOpen(true) : undefined}
                                className="flex-1 h-10 mx-2 rounded-xl hover:bg-gray-50/70 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* 모바일 전용 혼잡도 FAB (링크 → 토글 버튼) */}
                <button
                    onClick={() => setIsCongestionMode((v) => !v)}
                    className="md:hidden fixed bottom-24 right-4 z-[1400] w-12 h-12 rounded-full bg-white text-gray-700 border grid place-items-center shadow-xl hover:bg-gray-50 active:scale-95 transition"
                    aria-label="혼잡도 지도"
                    title="혼잡도 지도 토글"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3v9l7.5 4.33A9 9 0 1 1 12 3z" fill="currentColor" />
                    </svg>
                </button>

                {/* 3. 지도 영역: 여기서만 교체 */}
                <div className="absolute top-0 right-0 bottom-0 left-0 md:left-16">
                    {isCongestionMode ? (
                        <SeoulCongestionMap />
                    ) : (
                        <MapContainer
                            searchedLocation={searchedLocation}
                            recommendedSpots={recommendedSpots}
                            selectedRoute={directionsResult?.[selectedRouteIndex]}
                            directionsDestination={directionsDestination}
                        />
                    )}
                </div>

                {/* --- 상단 UI 그룹 --- */}
                <div className="absolute top-4 right-4 left-4 md:left-18 z-[1100] flex gap-4 flex-col md:flex-row">
                    <div className="flex-shrink-0 md:w-[350px]">
                        <TopSearchBar
                            query={query}
                            onQueryChange={setQuery}
                            onSearch={handleSearch}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onKeyDown={handleKeyDown}
                            isFocused={isSearchFocused}
                        >
                            <AutoComplete suggestions={suggestions} onSelect={handleSuggestionSelect} />
                        </TopSearchBar>
                    </div>

                    <Categories />

                    <div className="w-full md:w-auto md:flex-shrink-0">
                        <AiButton onClick={() => setAiChatOpen(true)} />
                    </div>
                </div>

                {/* 6. 그 외 떠 있는 컴포넌트들 */}
                <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
                <AiAssistantPanel
                    open={aiChatOpen}
                    onClose={() => setAiChatOpen(false)}
                    onSearch={handleSearch}
                    query={""}
                    onQueryChange={function (_value: string): void {
                        throw new Error("Function not implemented.");
                    }}
                />
                <CurrentLocationButton onClick={handleGetCurrentLocation} />
            </div>
        </AppShell>
    );
}
