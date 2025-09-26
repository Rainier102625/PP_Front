"use client";

import {useState, useEffect, useRef} from "react";
import {Search, Loader2, MapPin} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

// 검색 결과 자동 완성 항목의 타입
interface AutoCompleteItem {
    id: string;
    place_name: string;
    road_address_name: string;
    x: string; // 경도 (longitude)
    y: string; // 위도 (latitude)
}

// 부모 컴포넌트(page.tsx)로부터 받아야 할 props들의 타입
interface SidebarProps {
    onSearch: () => void;
    setSearchedLocation: (location: naver.maps.LatLng) => void;
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    time: string;
    onTimeChange: (time: string) => void;
    onQueryChange: (query: string) => void;
    query: string;
}

export const categories = [
    { id: "12", name: "관광지" },
    { id: "14", name: "문화시설" },
    { id: "15", name: "행사/공연/축제" },
    { id: "25", name: "여행코스" },
    { id: "28", name: "레포츠" },
    { id: "32", name: "숙박" },
    { id: "38", name: "쇼핑" },
    { id: "39", name: "음식점" },
];

export function Sidebar({
    onSearch,
    setSearchedLocation,
    selectedCategory,
    onCategoryChange,
    time,
    onTimeChange,
    onQueryChange,
    query
}: SidebarProps) {

    const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // 자동 완성 검색 로직 (디바운싱 적용)
    useEffect(() => {
        if (!query) {
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
        }, 200); // 200ms 지연

        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchContainerRef]);

    const handleSuggestionClick = (item: AutoCompleteItem) => {
        onQueryChange(item.place_name);
        setSuggestions([]);

        if (window.naver) {
            const location = new window.naver.maps.LatLng(
                parseFloat(item.y),
                parseFloat(item.x)
            );
            setSearchedLocation(location);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (suggestions.length > 0) {
                handleSuggestionClick(suggestions[0]);
            }
            setSuggestions([]);
        }
    };

    const handleGetCurrentLocation = () => {
        setIsGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation = new window.naver.maps.LatLng(latitude, longitude);

                    window.naver.maps.Service.reverseGeocode({ coords: newLocation, orders: 'roadaddr,addr' }, (status, response) => {
                        if (status === window.naver.maps.Service.Status.OK) {
                            const addresses = response.v2.results;
                            const roadAddress = addresses.find(res => res.name === 'roadaddr')?.land.name || '';
                            onQueryChange(roadAddress || '주소를 찾을 수 없음');
                            setSearchedLocation(newLocation);
                        }
                        setIsGettingLocation(false);
                    });
                },
                () => {
                    alert("위치 정보를 가져오는 데 실패했습니다.");
                    setIsGettingLocation(false);
                }
            );
        } else {
            alert("이 브라우저에서는 위치 정보가 지원되지 않습니다.");
            setIsGettingLocation(false);
        }
    };

    return (
        <aside className="h-full bg-white border-r p-4 space-y-4 flex flex-col z-20 shadow-lg">
            <h1 className="text-2xl font-bold">여행지 추천 검색</h1>

            <div className="flex items-center gap-2">
                <div className="relative w-full" ref={searchContainerRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <Input
                        placeholder="장소, 주소 검색"
                        className="pl-10 h-11"
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {suggestions.length > 0 && (
                        <Card className="absolute top-full mt-1 w-full p-2 z-20 max-h-80 overflow-y-auto">
                            <ul>
                                {suggestions.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                                        onClick={() => handleSuggestionClick(item)}
                                    >
                                        <Search className="w-4 h-4 mr-3 text-gray-400"/>
                                        <div>
                                            <p className="font-medium text-sm truncate">{item.place_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.road_address_name}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="w-11 h-11 rounded-full flex-shrink-0"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                >
                    {isGettingLocation ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <MapPin className="w-5 h-5" />
                    )}
                </Button>
            </div>

            <div className="flex gap-2">
                <Input
                    type="time"
                    className="flex-1 h-11"
                    value={time}
                    onChange={(e) => onTimeChange(e.target.value)}
                />
            </div>

            <div>
                <Select onValueChange={(value) => onCategoryChange(value)} value={selectedCategory || ""}>
                    <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="카테고리 선택 (선택 사항)"/>
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-grow flex flex-col justify-end">
                 <Button onClick={onSearch} className="w-full h-12 text-lg">
                    <Search className="w-5 h-5 mr-2"/> 추천 장소 검색
                </Button>
            </div>
        </aside>
    );
}