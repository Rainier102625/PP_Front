"use client";

"use client";

import { FunctionComponent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coffee, Utensils, ShoppingCart, ParkingSquare, Hospital, TreePalm, MapPin, Star, Search, X } from 'lucide-react';

const SearchPage: FunctionComponent = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleBackClick = () => {
    router.back();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/?query=${searchQuery}`);
    } else {
      alert("검색어를 입력해주세요.");
    }
  };

  const categories = [
    { name: "카페", icon: <Coffee className="w-8 h-8 text-gray-600" /> },
    { name: "음식점", icon: <Utensils className="w-8 h-8 text-gray-600" /> },
    { name: "쇼핑", icon: <ShoppingCart className="w-8 h-8 text-gray-600" /> },
    { name: "주차장", icon: <ParkingSquare className="w-8 h-8 text-gray-600" /> },
    { name: "병원", icon: <Hospital className="w-8 h-8 text-gray-600" /> },
    { name: "공원", icon: <TreePalm className="w-8 h-8 text-gray-600" /> },
  ];

  const recentSearches = [
    { name: "스타벅스 강남점", address: "서울 강남구 테헤란로 123", category: "카페" },
    { name: "홈플러스 강남점", address: "서울 강남구 논현로 125", category: "마트" },
  ];

  const popularSearches = [
    { name: "롯데월드타워", address: "서울 송파구 올림픽로 300", category: "관광지", rating: "4.5" },
    { name: "명동성당", address: "서울 중구 명동길 74", category: "종교시설", rating: "4.3" },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:max-w-md md:mx-auto md:border md:shadow-lg md:rounded-lg md:top-4 md:bottom-4 md:h-[calc(100vh-2rem)]">
      {/* Top Bar */} 
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleBackClick} className="flex-shrink-0">
          <img src="/back.svg" alt="Back" className="w-6 h-6" />
        </Button>
        <div className="relative flex-grow mx-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="장소, 주소 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-4 py-2 rounded-full bg-gray-100 border-none focus:ring-0 w-full"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full">
              <X className="w-5 h-5 text-gray-400" />
            </Button>
          )}
        </div>
        <Button onClick={handleSearch} className="flex-shrink-0 px-4 py-2 rounded-full">
          검색
        </Button>
      </div>

      {/* Content Area */} 
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {/* Categories */} 
        <section>
          <h3 className="text-lg font-semibold mb-4">카테고리</h3>
          <div className="grid grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Button key={cat.name} variant="outline" className="flex flex-col items-center justify-center h-24 rounded-lg space-y-2">
                {cat.icon}
                <span className="text-sm font-medium">{cat.name}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Recent Searches */} 
        <section>
          <h3 className="text-lg font-semibold mb-4">최근 검색</h3>
          <div className="space-y-3">
            {recentSearches.map((item, index) => (
              <Card key={index} className="flex items-center p-3 space-x-3 w-full">
                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <p className="font-medium text-base">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.address}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 flex-shrink-0">{item.category}</span>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Searches */} 
        <section>
          <h3 className="text-lg font-semibold mb-4">인기 검색</h3>
          <div className="space-y-3">
            {popularSearches.map((item, index) => (
              <Card key={index} className="flex items-center p-3 space-x-3 w-full">
                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <p className="font-medium text-base">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.address}</p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">{item.category}</span>
                  {item.rating && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
                      <span>{item.rating}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SearchPage;
