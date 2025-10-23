"use client";

import { useState, useEffect } from "react";

import { MapContainer } from "@/components/MapContainer";

import { OdsayRoute } from "@/types/odsay";
import { Spot, SpotDetails } from "@/types/spot";
import { format } from "date-fns";
import { getDistance } from "@/lib/distance";


import AppShell from "@/components/AppShell";
import TopSearchBar from "@/components/TopSearchBar";
import MenuDrawer from "@/components/MenuDrawer";
import AiAssistantPanel from "@/components/AiAssistantPanel"; // , { Message }
import Categories from "@/components/Categories";
import AiButton from "@/components/AiButton";
import CurrentLocationButton from "@/components/CurrentLocationButton";
import AutoComplete, { AutoCompleteItem } from "@/components/AutoComplete"; //


export default function Home() {
    // 애플리케이션의 핵심 상태들을 관리합니다.
    const [query, setQuery] = useState("");
    // 새로운 상태 추가
    const [menuOpen, setMenuOpen] = useState(false);
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiSideOpen, setAiSideOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]); // 👈 [추가] 자동완성 목록 (Enter키 사용 위함)

    const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 카테고리 기본 선택 없음
    const [selectedTime, setSelectedTime] = useState<string>("13:30");

    const [recommendedSpots, setRecommendedSpots] = useState<Spot[]>([]);
    const [isRecsPanelOpen, setIsRecsPanelOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [directionsDestination, setDirectionsDestination] = useState<Spot | null>(null);
    const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
    const [directionsResult, setDirectionsResult] = useState<OdsayRoute[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const location = new window.naver.maps.LatLng(latitude, longitude);
                    setSearchedLocation(location);
                    setQuery("현재 위치"); // 👈 텍스트 업데이트 추가
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
    // [추가] 📍 자동 완성 검색 로직 (Sidebar에서 가져옴)
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        const handler = setTimeout(() => {
            const fetchSuggestions = async () => {
                try {
                    // 'geocodeQuery'와 동일한 API 라우트를 사용합니다.
                    const response = await fetch(`/api/search?query=${query}`);
                    const data = await response.json();
                    setSuggestions(data.documents || []);
                } catch (error) {
                    console.error("자동 완성 검색 실패:", error);
                    setSuggestions([]);
                }
            };
            fetchSuggestions();
        }, 200); // 200ms 지연

        return () => clearTimeout(handler);
    }, [query]); // 👈 query가 바뀔 때마다 실행

    // 텍스트 쿼리를 카카오 API를 통해 좌표로 변환하는 함수
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
        // 검색 시 경로 결과 초기화
        setDirectionsDestination(null);
        setDirectionsResult([]);
        setSelectedRouteIndex(0);

        try {
            // 1. 현재 텍스트 쿼리로 좌표를 먼저 가져옵니다.
            const location = await geocodeQuery(query);
            setSearchedLocation(location); // 지도 좌표 상태 업데이트

            // 2. 가져온 좌표와 설정된 시간으로 추천 API를 호출합니다.
            const finalDateTime = new Date();
            if (selectedTime) {
                const [hours, minutes] = selectedTime.split(':');
                finalDateTime.setHours(Number(hours), Number(minutes), 0, 0);
            }

            const lat = location.lat();
            const lon = location.lng();
            const time = format(finalDateTime, "HH:mm:ss");
            const categoryQuery = selectedCategory || '';

            const apiUrl = `http://pp-domain.duckdns.org:8082/api/recommend/?lat=${lat}&lon=${lon}&time=${time}&type=${categoryQuery}&radius=8000`;

            console.log("Requesting API URL:", apiUrl);

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiResponse = await response.json();
            console.log("서버로부터 받은 실제 데이터:", apiResponse);

            const results = apiResponse[0]?.results;
            if (!results) {
                alert("추천 장소를 가져오지 못했습니다.");
                setRecommendedSpots([]);
                return;
            }

            const categoryIdToKeyMap: { [key: string]: string } = {
                '12': 'tourist_attraction',
                '14': 'cultural_facilities',
                '15': 'festivals_performances_events',
                '25': 'travel_course',
                '28': 'leisure_sports',
                '32': 'accommodation',
                '38': 'shopping',
                '39': 'food',
            };

            let allSpots: any[] = [];
            if (categoryQuery && categoryIdToKeyMap[categoryQuery]) {
                const categoryKey = categoryIdToKeyMap[categoryQuery];
                allSpots = results[categoryKey] || [];
            } else {
                // 카테고리 선택이 없으면 모든 결과를 합침
                allSpots = Object.values(results).flat();
            }

            if (allSpots.length === 0) {
                alert("해당 조건에 맞는 추천 장소가 없습니다.");
            }

            // 3. 프론트에서 거리 재계산 및 정렬, 데이터 형식 맞추기
            const spotsWithRecalculatedDistance = allSpots.map(item => ({
                id: item.id,
                name: item.name,
                address: item.address,
                longitude: Number(item.longitude),
                latitude: Number(item.latitude),
                category: item.category, // API가 카테고리 필드를 반환한다고 가정
                distanceMeters: getDistance(lat, lon, Number(item.latitude), Number(item.longitude)),
                details: item, // 원본 데이터 저장
            }));

            spotsWithRecalculatedDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
            setRecommendedSpots(spotsWithRecalculatedDistance as Spot[]);

        } catch (error) {
            console.error("검색 처리 중 오류 발생:", error);
            alert(typeof error === 'string' ? error : '검색 중 오류가 발생했습니다.');
            setIsRecsPanelOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionSelect = (item: AutoCompleteItem) => {
        setQuery(item.place_name); // 텍스트 변경
        setSuggestions([]); // 목록 닫기
        setIsSearchFocused(false); // 👈 패널 닫기

        if (window.naver) {
            const location = new window.naver.maps.LatLng(
                parseFloat(item.y),
                parseFloat(item.x)
            );
            setSearchedLocation(location); // 👈 지도 위치 이동
        }
        // (선택) 자동 완성 클릭 시 바로 '추천 검색' 실행
        // handleSearch();
    };

    // [추가] 📍 Enter 키 입력 시 실행 (Sidebar에서 가져옴)
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (suggestions.length > 0) {
                handleSuggestionSelect(suggestions[0]); // 첫 번째 제안 선택
            } else {
                handleSearch(); // 제안이 없으면 현재 텍스트로 '추천 검색'
            }
            setIsSearchFocused(false); // 패널 닫기
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

        const distance = getDistance(
            searchedLocation.lat(),
            searchedLocation.lng(),
            spot.latitude,
            spot.longitude
        );

        // 700m 이내인 경우, 프론트에서 직접 도보 경로 생성
        if (distance < 700) {
            const walkingTime = Math.round(distance / 80); // 분당 80m 기준

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
                            trafficType: 3, // 도보
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
            return; // API 호출 없이 종료
        }

        // 700m 이상인 경우, 기존 API 호출 로직 실행
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
                alert('경로를 가져오는 중 알 수 없는 오류가 발생했습니다.');
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
        // 1. AppShell: PC에서 최대 가로폭을 잡아주고 중앙 정렬 (lg:max-w-xl)
        <AppShell mode="desktop" width={1280}>
            <div className="relative mx-auto max-w-[1280px] h-[100dvh]">


            {/* 좌측 고정 레일 */}
                <aside className="hidden md:block absolute top-0 bottom-0 left-0 z-[1200] w-16">
                    <div className="h-full bg-white/95 border border-gray-200 shadow-xl
                      flex flex-col items-center gap-2 py-2">
                        <button
                            aria-label="menu"
                            onClick={() => setMenuOpen(true)}
                            className="w-10 h-10 grid place-items-center rounded-xl bg-blue-600 text-white shadow"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24">
                                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>

                        {/* 필요시 추가 아이콘들 */}
                        <button className="w-10 h-10 grid place-items-center rounded-xl bg-white text-gray-700 border">
                            {/* 저장됨 */}
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z" fill="currentColor"/></svg>
                        </button>
                        <button className="w-10 h-10 grid place-items-center rounded-xl bg-white text-gray-700 border">
                            {/* 최근 */}
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 8v5l4 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                        </button>
                        <div className="mt-auto" />
                        <button className="w-10 h-10 grid place-items-center rounded-xl bg-white text-gray-700 border">
                            {/* 레이어 */}
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5zm0 9l9 5-9 5-9-5 9-5z" fill="currentColor"/></svg>
                        </button>
                    </div>
                </aside>

                {/* 모바일 하단 도크 */}
                <nav className="md:hidden absolute left-0 right-0 bottom-0 z-[1300]">
                    <div className="
    h-16 w-full backdrop-blur-md bg-white/80
    border-t border-gray-200 rounded-t-2xl
    shadow-[0_-8px_24px_rgba(0,0,0,0.15)]
    flex items-center px-2
    divide-x divide-gray-200/60
    pb-[env(safe-area-inset-bottom)]
  ">
                        {["메뉴","저장","최근","레이어"].map((label) => (
                            <button
                                key={label}
                                onClick={label==="메뉴"?()=>setMenuOpen(true):undefined}
                                className="flex-1 h-10 mx-2 rounded-xl
                               hover:bg-gray-50/70 active:scale-95 transition
                                 focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-blue-500/50"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </nav>


                {/* 3. map-hero: 지도가 들어갈 '배경' 영역입니다. */}
                <div className="absolute top-0 right-0 bottom-0 left-0 md:left-16">
                    <MapContainer
                        searchedLocation={searchedLocation}
                        recommendedSpots={recommendedSpots}
                        selectedRoute={directionsResult?.[selectedRouteIndex]}
                        directionsDestination={directionsDestination}
                    />
                </div>


                {/* --- 상단 UI 그룹 --- */}
                <div className="absolute top-4 right-4 left-4 md:left-18 z-[1100] flex gap-4 flex-col md:flex-row">
                    <div className="
                        flex-shrink-0 md:w-[350px]" >
                        <TopSearchBar
                            query={query}
                            onQueryChange={setQuery}
                            onSearch={handleSearch}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onKeyDown={handleKeyDown}
                            isFocused={isSearchFocused}>

                            <AutoComplete
                                suggestions={suggestions}
                                onSelect={handleSuggestionSelect}
                            />
                        </TopSearchBar>
                    </div>

                    {/* 2. 카테고리 버튼 (남은 공간 차지 + 스크롤) */}
                    <Categories />


                    {/* 3. AI 어시스턴트 버튼 (너비 고정) */}
                    <div className="w-full
                        md:w-auto md:flex-shrink-0">
                        <AiButton onClick={() => setAiChatOpen(true)} />
                    </div>

                </div>

                {/* --- [추가] 검색 제안 UI --- */}

                {/* 6. 그 외 떠 있는 컴포넌트들 (이것들도 내부적으로 absolute/fixed) */}
                <MenuDrawer
                    open={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    // ... (카테고리, 시간 props) ...
                />

                <AiAssistantPanel
                    open={aiChatOpen}
                    onClose={() => setAiChatOpen(false)}
                    onSearch={handleSearch}
                    query={""}
                    onQueryChange={function (value: string): void {
                    throw new Error("Function not implemented.");
                }} />

                <CurrentLocationButton onClick={handleGetCurrentLocation} />

            </div>
        </AppShell>
    );

}