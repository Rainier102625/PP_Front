"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar } from "@/components/RightSidebar";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { DetailPanel } from "@/components/DetailPanel";
import { OdsayRoute } from "@/types/odsay";
import { Spot } from "@/types/spot";
import { format } from "date-fns";
import { getDistance } from "@/lib/distance";
import { TourDetail } from "@/types/tour";
import { TopBar } from "@/components/TopBar";
import { useSearchParams } from 'next/navigation';

export default function Home() {
    const searchParams = useSearchParams();

    const [query, setQuery] = useState("");
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

    const [detailedSpot, setDetailedSpot] = useState<Spot | null>(null);
    const [detailInfo, setDetailInfo] = useState<TourDetail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const geocodeQuery = useCallback((queryToGeocode: string): Promise<naver.maps.LatLng> => {
        return new Promise(async (resolve, reject) => {
            if (!queryToGeocode.trim()) {
                reject("검색어가 없습니다.");
                return;
            }
            try {
                const response = await fetch(`/api/search?query=${queryToGeocode}`);
                const data = await response.json();
                if (data.documents && data.documents.length > 0) {
                    const firstResult = data.documents[0];
                    const location = new window.naver.maps.LatLng(Number(firstResult.y), Number(firstResult.x));
                    resolve(location);
                } else {
                    reject(`'${queryToGeocode}'에 대한 검색 결과가 없습니다.`);
                }
            } catch {
                reject("좌표 변환 중 오류가 발생했습니다.");
            }
        });
    }, []);

    const handleSearch = useCallback(async (searchQueryParam?: string) => {
        const currentQuery = searchQueryParam || query; // Use param if provided, else state
        if (!currentQuery) return; // Prevent searching with empty query

        setIsSidebarOpen(false);
        setIsLoading(true);
        setIsRecsPanelOpen(true);
        setRecommendedSpots([]);
        setDirectionsDestination(null);
        setDirectionsResult([]);
        setDetailedSpot(null);
        setDetailInfo(null);

        try {
            const location = await geocodeQuery(currentQuery);
            setSearchedLocation(location);

            const finalDateTime = new Date();
            if (selectedTime) {
                const [hours, minutes] = selectedTime.split(':');
                finalDateTime.setHours(Number(hours), Number(minutes), 0, 0);
            }

            const lat = location.lat();
            const lon = location.lng();
            const time = format(finalDateTime, "HH:mm:ss");
            const categoryQuery = selectedCategory || "";

            const apiUrl = `https://pp-production-d014.up.railway.app/api/recommend/?lat=${lat}&lon=${lon}&time=${time}&type=${categoryQuery}&radius=8000`;

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Spot[] = await response.json();

            const spotsWithRecalculatedDistance = data.map(spot => ({
                ...spot,
                distanceMeters: getDistance(lat, lon, spot.mapY, spot.mapX)
            }));

            spotsWithRecalculatedDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
            setRecommendedSpots(spotsWithRecalculatedDistance);

        } catch (error) {
            console.error("검색 처리 중 오류 발생:", error);
            alert(typeof error === 'string' ? error : '검색 중 오류가 발생했습니다.');
            setIsRecsPanelOpen(false);
        } finally {
            setIsLoading(false);
        }
    }, [query, selectedCategory, selectedTime, geocodeQuery]);

    useEffect(() => {
        if (window.naver) {
            const defaultLocation = new window.naver.maps.LatLng(37.5557, 126.9730);
            setSearchedLocation(defaultLocation);

            const urlQuery = searchParams.get('query');
            if (urlQuery) {
                setQuery(urlQuery);
                handleSearch(urlQuery);
            } else {
                handleSearch(query); // Initial search with default "서울역"
            }
        }
    }, [searchParams, handleSearch, query]);

    const handleGetDirections = useCallback(async (spot: Spot) => {
        if (!searchedLocation) {
            alert("출발지가 설정되지 않았습니다.");
            return;
        }
        setIsSidebarOpen(false);
        setDetailedSpot(null);
        setDirectionsDestination(spot);
        setIsDirectionsLoading(true);
        setDirectionsResult([]);
        setSelectedRouteIndex(0);

        const distance = getDistance(searchedLocation.lat(), searchedLocation.lng(), spot.mapY, spot.mapX);

        if (distance < 700) {
            const walkingTime = Math.round(distance / 80);
            const walkingRoute: OdsayRoute = {
                pathInfo: { info: { totalTime: walkingTime, payment: 0, busTransitCount: 0, subwayTransitCount: 0, totalDistance: distance }, subPath: [{ trafficType: 3, distance: distance, sectionTime: walkingTime, startX: searchedLocation.lng(), startY: searchedLocation.lat(), endX: spot.mapX, endY: spot.mapY }] },
                geometry: null,
            };
            setDirectionsResult([walkingRoute]);
            setIsDirectionsLoading(false);
            return;
        }

        try {
            const url = `/api/odsay-directions?sx=${searchedLocation.lng().toFixed(6)}&sy=${searchedLocation.lat().toFixed(6)}&ex=${spot.mapX.toFixed(6)}&ey=${spot.mapY.toFixed(6)}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "경로 데이터를 가져오는 데 실패했습니다.");
            }
            const data = await response.json();
            data.sort((a: OdsayRoute, b: OdsayRoute) => a.pathInfo.info.totalTime - b.pathInfo.info.totalTime);
            setDirectionsResult(data);
        } catch (e) {
            if (e instanceof Error) alert(e.message);
            else alert('경로를 가져오는 중 알 수 없는 오류가 발생했습니다.');
            setDirectionsDestination(null);
        } finally {
            setIsDirectionsLoading(false);
        }
    }, [searchedLocation]);

    const handleShowDetails = useCallback(async (spot: Spot) => {
        setIsSidebarOpen(false);
        setDirectionsDestination(null);
        setDetailedSpot(spot);
        setIsDetailLoading(true);
        setDetailInfo(null);

        try {
            const response = await fetch(`/api/tour-details?contentId=${spot.contentId}&contentTypeId=${spot.contentTypeId}`);
            if (!response.ok) {
                throw new Error("상세 정보를 불러오는 데 실패했습니다.");
            }
            const data = await response.json();
            setDetailInfo(data[0]);
        } catch (e) {
            if (e instanceof Error) alert(e.message);
            else alert("상세 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.");
            setDetailedSpot(null);
        } finally {
            setIsDetailLoading(false);
        }
    }, []);

    const handleSelectRoute = useCallback((index: number) => {
        setSelectedRouteIndex(index);
    }, []);

    return (
        <main className="relative h-screen w-screen overflow-hidden">
            <TopBar
                query={query}
                onQueryChange={setQuery}
                onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {isSidebarOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="fixed inset-y-0 left-0 w-[380px] flex flex-col h-full shadow-lg z-50 bg-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0">
                        <Sidebar
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            time={selectedTime}
                            onTimeChange={setSelectedTime}
                        />
                        {isRecsPanelOpen && (
                            <RecommendationPanel
                                isLoading={isLoading}
                                spots={recommendedSpots}
                                onGetDirections={handleGetDirections}
                                onShowDetails={handleShowDetails}
                            />
                        )}
                    </div>
                </>
            )}

            {directionsDestination ? (
                <RightSidebar
                    isOpen={!!directionsDestination}
                    onClose={() => setDirectionsDestination(null)}
                    directionsResult={directionsResult}
                    isDirectionsLoading={isDirectionsLoading}
                    originName={query}
                    directionsDestination={directionsDestination}
                    onSelectRoute={handleSelectRoute}
                />
            ) : detailedSpot && (
                <DetailPanel
                    spot={detailedSpot}
                    details={detailInfo}
                    isLoading={isDetailLoading}
                    onClose={() => setDetailedSpot(null)}
                    onGetDirections={handleGetDirections}
                />
            )}

            <MapContainer
                searchedLocation={searchedLocation}
                recommendedSpots={recommendedSpots}
                selectedRoute={directionsResult?.[selectedRouteIndex]}
                directionsDestination={directionsDestination}
            />
        </main>
    );
}