"use client";

import { memo } from "react";
import { UserCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 부모 컴포넌트(page.tsx)로부터 받아야 할 props들의 타입
interface SidebarProps {
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    time: string;
    onTimeChange: (time: string) => void;
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

const SidebarComponent = ({
    selectedCategory,
    onCategoryChange,
    time,
    onTimeChange,
}: SidebarProps) => {

    return (
        <aside className="h-full bg-white p-4 space-y-4 flex flex-col z-20">
            <div className="flex justify-between items-center pt-12"> {/* 상단 여백 추가 */}
                <h1 className="text-2xl font-bold">필터 및 설정</h1>
                <Link href="/login">
                    <Button variant="outline" size="icon">
                        <UserCircle className="h-5 w-5" />
                    </Button>
                </Link>
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
                <Select onValueChange={(value) => onCategoryChange(value === "all" ? null : value)} value={selectedCategory || "all"}>
                    <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="카테고리 선택"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 추천 패널이 사이드바와 함께 렌더링되므로, 검색 버튼은 더 이상 필요 없습니다. */}
            {/* 검색은 상단바에서 실행됩니다. */}
        </aside>
    );
};

export const Sidebar = memo(SidebarComponent);