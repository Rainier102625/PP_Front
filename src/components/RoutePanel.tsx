"use client";

import React from "react";
import {
    WalkRouteSummary,
    TransitRoute,
    TransitSegment
} from "@/types/route"; // 경로 확인해서 맞춰줘


type Props = {
    open: boolean;
    originName?: string | null;
    destinationName?: string | null;
    onBack: () => void;

    travelMode: 'walk' | 'transit';
    onTravelModeChange: (mode: 'walk' | 'transit') => void;

    sortOption: 'duration' | 'congestion';
    onSortChange: (sort: 'duration' | 'congestion') => void;

    // 도보
    walkSummary: WalkRouteSummary | null;

    // 대중교통
    transitRoutes: TransitRoute[] | null;
    activeTransitIndex: number | null;        // <- 추가
    onSelectTransitRoute: (idx: number) => void; // <- 추가
};
// --- Utils ---
function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}초`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분`;
}
function formatDistance(meters: number): string {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

function getModeIcon(mode: string) {
    if (mode === 'WALK') return '🚶';
    if (mode === 'BUS' || mode === 'EXPRESSBUS') return '🚌';
    if (mode === 'SUBWAY') return '🚇';
    return '➡️';
}

// segment 하나 표시 (상세)
function SegmentDetail({ seg }: { seg: TransitSegment }) {
    const hasSteps = seg.mode === "WALK" && seg.steps && seg.steps.length > 0;

    // 0m짜리 환승 WALK은 안보여주고 싶으면 여기서 필터 가능
    if (seg.mode === "WALK" && seg.distance === 0) {
        return null;
    }

    return (
        <li className="mb-6 ml-6 relative">
            <span
                className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white bg-gray-200"
            >
                <span className="text-sm">{getModeIcon(seg.mode)}</span>
            </span>

            <div className="ml-2">
                <h3 className="flex flex-wrap items-center gap-2 mb-1 text-[13px] font-semibold text-gray-900 leading-snug">
                    <span>{seg.routeNumber || seg.mode}</span>
                    {seg.mode !== "WALK" && (
                        <span className="text-[11px] font-medium text-gray-500">
                          ({seg.startName} → {seg.endName})
                        </span>
                    )}
                </h3>

                <div className="text-[11px] text-gray-600 leading-snug mb-2">
                    {formatDuration(seg.duration)} · {formatDistance(seg.distance)}
                    {seg.congestion && (
                        <span className="ml-2 text-[10px] text-gray-500">
                            혼잡도 {seg.congestion}
                        </span>
                    )}
                </div>

                {hasSteps && (
                    <ol className="list-disc list-inside mt-2 space-y-1 pl-2">
                        {seg.steps.map((s, i) => (
                            <li key={i} className="text-[11px] text-gray-700 leading-snug">
                                {s}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </li>
    );
}

// transit 경로 1개 카드 (요약 + 펼침)
function TransitRouteCard({
                              route,
                              index,
                              isActive,
                              onSelect,
                          }: {
    route: TransitRoute;
    index: number;
    isActive: boolean;
    onSelect: (idx: number) => void;
}) {

    // 대표 라벨: 주요 교통수단/노선 몇 개만 뽑아서 표시
    const modesSummary = route.segments
        .map(seg => {
            if (seg.mode === "WALK") return "도보";
            return seg.routeNumber || seg.mode;
        })
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 3)
        .join(" · ");

    return (
        <div
            className={`rounded-xl border ${
                isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
            } shadow-sm transition-colors`}
        >
            {/* 헤더(요약부) */}
            <button
                className="w-full text-left p-4 flex flex-col gap-2"
                onClick={() => onSelect(index)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <div className="text-sm font-bold text-gray-900 leading-tight">
                            {formatDuration(route.totalTime)} 예상
                        </div>
                        <div className="text-[11px] text-gray-500 leading-snug">
                            {modesSummary || "경로"}
                        </div>
                    </div>

                    <div className="text-right text-[11px] text-gray-600 leading-snug">
                        <div>총 {formatDistance(route.totalDistance)}</div>
                        <div>도보 {formatDistance(route.walkingDistance)}</div>
                        <div className="text-[10px] text-gray-400">
                            요금 {route.fare.toLocaleString()}원
                        </div>
                    </div>
                </div>

                <div className="text-[10px] font-medium text-blue-600">
                    {isActive ? "세부 경로 숨기기 ▲" : "세부 경로 보기 ▼"}
                </div>
            </button>

            {/* 펼쳐진 상세부 */}
            {isActive && (
                <div className="px-4 pb-4 border-t border-gray-200">
                    <ol className="relative border-l border-gray-200 ml-2 pt-4">
                        {route.segments.map((seg, segIdx) => (
                            <SegmentDetail key={segIdx} seg={seg} />
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

// 도보 전용 화면
function RenderWalkRoute({
                             summary,
                             sortOption,
                             onSortChange,
                         }: {
    summary: WalkRouteSummary | null;
    sortOption: 'duration' | 'congestion';
    onSortChange: (sort: 'duration' | 'congestion') => void;
}) {
    return (
        <div className="flex flex-col">
            {/* 요약 */}
            {summary ? (
                <div className="p-4 border-b border-gray-200 space-y-2 flex-shrink-0">
                    <div className="text-xl font-bold text-blue-600">
                        {formatDuration(summary.duration)}
                    </div>
                    <div className="text-sm text-gray-700">
                        거리: {formatDistance(summary.distance)}
                    </div>
                    <div className="text-sm text-gray-500">
                        혼잡도 점수: {summary.score.toFixed(2)}
                    </div>
                </div>
            ) : (
                <div className="p-4 text-sm text-gray-500 flex-shrink-0">
                    경로를 계산 중입니다...
                </div>
            )}

            {/* 정렬 옵션 */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <label
                    htmlFor="sort-select"
                    className="text-xs font-semibold text-gray-500 mb-2 block"
                >
                    경로 옵션
                </label>
                <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) =>
                        onSortChange(e.target.value as 'duration' | 'congestion')
                    }
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="duration">최적시간순</option>
                    <option value="congestion">혼잡도순</option>
                </select>
            </div>

            {/* 상세 경로 (turn-by-turn) */}
            <div className="p-2">
                <div className="p-2 text-xs font-semibold text-gray-500">
                    세부 경로
                </div>
                <ol className="list-decimal list-inside space-y-2 p-2">
                    {summary?.instructions?.map((instruction, idx) => (
                        <li
                            key={idx}
                            className="text-sm text-gray-800 leading-relaxed border-b border-gray-100 pb-2"
                        >
                            {instruction}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

// 대중교통 전체 화면 (여러 후보 경로 카드)
function RenderTransitRoutes({
                                 routes,
                                 activeIndex,
                                 onSelect,
                             }: {
    routes: TransitRoute[] | null;
    activeIndex: number | null;
    onSelect: (idx: number) => void;
}) {
    if (!routes || routes.length === 0) {
        return (
            <div className="p-4 text-sm text-gray-500 flex-shrink-0">
                경로를 계산 중입니다...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-4">
            {routes.map((r, idx) => (
                <TransitRouteCard
                    key={idx}
                    route={r}
                    index={idx}
                    isActive={activeIndex === idx}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

// 메인 패널
export default function RoutePanel({
                                       open,
                                       originName,
                                       destinationName,
                                       onBack,

                                       travelMode,
                                       onTravelModeChange,

                                       sortOption,
                                       onSortChange,

                                       walkSummary,
                                       transitRoutes,
                                       activeTransitIndex,
                                       onSelectTransitRoute,
                                   }: Props) {
    if (!open) return null;

    return (
        <aside
            className="absolute left-4 top-[5rem] bottom-4 z-[1200] w-[360px] max-w-[calc(100vw-2rem)]
                       bg-white rounded-2xl shadow-xl border border-gray-200
                       flex flex-col overflow-hidden"
        >
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
                <button
                    aria-label="뒤로가기"
                    onClick={onBack}
                    className="h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50 grid place-items-center flex-shrink-0"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                            d="M15 18l-6-6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
                <h2 className="text-lg font-semibold truncate">경로 안내</h2>
            </div>

            {/* 출발/도착 */}
            <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span
                        className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full grid place-items-center"
                    >
                        출
                    </span>
                    <span className="text-sm font-semibold truncate">
                        {originName || "출발지"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span
                        className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 text-xs font-bold rounded-full grid place-items-center"
                    >
                        도
                    </span>
                    <span className="text-sm font-semibold truncate">
                        {destinationName || "도착지"}
                    </span>
                </div>
            </div>

            {/* 모드 토글 */}
            <div className="flex justify-around p-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                <button
                    onClick={() => onTravelModeChange('walk')}
                    className={`w-full py-2 text-sm font-semibold rounded-md ${
                        travelMode === 'walk'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    🚶 도보
                </button>
                <button
                    onClick={() => onTravelModeChange('transit')}
                    className={`w-full py-2 text-sm font-semibold rounded-md ${
                        travelMode === 'transit'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    🚌 대중교통
                </button>
            </div>

            {/* 본문 영역 스크롤 */}
            <div className="flex-1 overflow-y-auto bg-white">
                {travelMode === 'walk' ? (
                    <RenderWalkRoute
                        summary={walkSummary}
                        sortOption={sortOption}
                        onSortChange={onSortChange}
                    />
                ) : (
                    <RenderTransitRoutes
                        routes={transitRoutes}
                        activeIndex={activeTransitIndex}
                        onSelect={onSelectTransitRoute}
                    />
                )}
            </div>
        </aside>
    );
}
