"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar } from "@/components/RightSidebar";
import { OdsayRoute } from "@/types/odsay";
import { Spot, SpotDetails } from "@/types/spot";
import { format } from "date-fns";

import { getDistance } from "@/lib/distance";

export default function Home() {
    // 애플리케이션의 핵심 상태들을 관리합니다.
    const [query, setQuery] = useState("서울역");
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

    // 페이지 로드 시 기본 위치(서울역) 설정
    useEffect(() => {
        if (window.naver) {
            const defaultLocation = new window.naver.maps.LatLng(37.5557, 126.9730);
            setSearchedLocation(defaultLocation);
        }
    }, []);

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
        <main className="relative flex h-screen w-screen">
            <Sidebar
                query={query}
                onQueryChange={setQuery}
                setSearchedLocation={setSearchedLocation}
                onSearch={handleSearch}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                time={selectedTime}
                onTimeChange={setSelectedTime}
            />

            <MapContainer
                searchedLocation={searchedLocation}
                recommendedSpots={recommendedSpots}
                selectedRoute={directionsResult?.[selectedRouteIndex]}
                directionsDestination={directionsDestination}
            />

            <RightSidebar
                isOpen={isRecsPanelOpen}
                onClose={() => {
                    setIsRecsPanelOpen(false);
                    setDirectionsDestination(null);
                    setDirectionsResult([]);
                }}
                spots={recommendedSpots}
                isLoading={isLoading}
                onGetDirections={handleGetDirections}
                directionsResult={directionsResult}
                isDirectionsLoading={isDirectionsLoading}
                originName={query}
                directionsDestination={directionsDestination}
                onSelectRoute={handleSelectRoute}
                selectedRouteIndex={selectedRouteIndex}
            />
        </main>
    );
}