// src/components/RoutePanel.tsx (파일 전체 교체)
"use client";

import React from "react";
// MapContainer에서 정의한 타입을 import (경로 확인!)
import type { WalkRouteSummary, TransitRoute, TransitSegment } from "./MapContainer";

// --- Props 타입 정의 ---
type Props = {
    open: boolean;
    originName?: string | null;
    destinationName?: string | null;
    onBack: () => void;

    // 이동 모드
    travelMode: 'walk' | 'transit';
    onTravelModeChange: (mode: 'walk' | 'transit') => void;

    // 도보 경로용
    sortOption: 'duration' | 'congestion';
    onSortChange: (sort: 'duration' | 'congestion') => void;
    walkSummary: WalkRouteSummary | null;

    // 대중교통 경로용
    transitRoutes: TransitRoute[] | null;
};

// --- 헬퍼 함수 ---
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
// [추가] 대중교통 아이콘
function getModeIcon(mode: string) {
    if (mode === 'WALK') return '🚶'; // 걷기
    if (mode === 'BUS') return '🚌'; // 버스
    if (mode === 'SUBWAY') return '🚇'; // 지하철
    return '➡️';
}
// [추가] 대중교통 노선 색상 (예시)
function getRouteColor(routeNumber: string) {
    if (routeNumber.includes('470')) return 'bg-blue-500';
    if (routeNumber.includes('8100')) return 'bg-red-500';
    if (routeNumber.includes('501')) return 'bg-blue-600';
    if (routeNumber.includes('도보')) return 'bg-gray-400';
    return 'bg-green-500';
}


// --- 메인 컴포넌트 ---
export default function RoutePanel({
                                       open, originName, destinationName, onBack,
                                       travelMode, onTravelModeChange,
                                       sortOption, onSortChange,
                                       walkSummary, transitRoutes
                                   }: Props) {
    if (!open) return null;

    // 대중교통 경로가 여러 개일 경우, 첫 번째 경로를 기본으로 사용
    const displayTransitRoute = (transitRoutes && transitRoutes.length > 0) ? transitRoutes[0] : null;

    return (
        <aside
            className="absolute left-4 top-[5rem] bottom-4 z-[1200] w-[360px] max-w-[calc(100vw-2rem)]
                       bg-white rounded-2xl shadow-xl border border-gray-200
                       flex flex-col overflow-hidden"
        >
            {/* 1. 헤더 (뒤로가기 버튼) */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
                <button
                    aria-label="뒤로가기"
                    onClick={onBack}
                    className="h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50 grid place-items-center flex-shrink-0"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </svg>
                </button>
                <h2 className="text-lg font-semibold truncate">경로 안내</h2>
            </div>

            {/* 2. 출발지/도착지 */}
            <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full grid place-items-center">출</span>
                    <span className="text-sm font-semibold truncate">{originName || "출발지"}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 text-xs font-bold rounded-full grid place-items-center">도</span>
                    <span className="text-sm font-semibold truncate">{destinationName || "도착지"}</span>
                </div>
            </div>

            {/* 3. [추가] 이동 모드 탭 */}
            <div className="flex justify-around p-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                <button
                    onClick={() => onTravelModeChange('walk')}
                    className={`w-full py-2 text-sm font-semibold rounded-md ${
                        travelMode === 'walk' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    🚶 도보
                </button>
                <button
                    onClick={() => onTravelModeChange('transit')}
                    className={`w-full py-2 text-sm font-semibold rounded-md ${
                        travelMode === 'transit' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    🚌 대중교통
                </button>
            </div>

            {/* 4. [분기] 경로 내용 */}
            <div className="flex-1 overflow-y-auto">
                {travelMode === 'walk' ? (
                    // --- 4-1. 도보 경로 ---
                    <RenderWalkRoute
                        summary={walkSummary}
                        sortOption={sortOption}
                        onSortChange={onSortChange}
                    />
                ) : (
                    // --- 4-2. 대중교통 경로 ---
                    <RenderTransitRoute route={displayTransitRoute} />
                )}
            </div>
        </aside>
    );
}


// --- 4-1. 도보 경로 UI 컴포넌트 ---
function RenderWalkRoute({ summary, sortOption, onSortChange }: {
    summary: WalkRouteSummary | null,
    sortOption: 'duration' | 'congestion',
    onSortChange: (sort: 'duration' | 'congestion') => void
}) {
    return (
        <div>
            {/* 도보 - 요약 */}
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
                <div className="p-4 text-sm text-gray-500 flex-shrink-0">경로를 계산 중입니다...</div>
            )}

            {/* 도보 - 정렬 옵션 */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <label htmlFor="sort-select" className="text-xs font-semibold text-gray-500 mb-2 block">
                    경로 옵션
                </label>
                <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) => onSortChange(e.target.value as 'duration' | 'congestion')}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="duration">최적시간순</option>
                    <option value="congestion">혼잡도순</option>
                </select>
            </div>

            {/* 도보 - 세부 경로 */}
            <div className="p-2">
                <div className="p-2 text-xs font-semibold text-gray-500">세부 경로</div>
                <ol className="list-decimal list-inside space-y-2 p-2">
                    {summary?.instructions?.map((instruction, index) => (
                        <li key={index} className="text-sm text-gray-800 leading-relaxed border-b border-gray-100 pb-2">
                            {instruction}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

// --- 4-2. 대중교통 경로 UI 컴포넌트 ---
function RenderTransitRoute({ route }: { route: TransitRoute | null }) {
    if (!route) {
        return <div className="p-4 text-sm text-gray-500 flex-shrink-0">경로를 계산 중입니다...</div>;
    }

    return (
        <div>
            {/* 대중교통 - 요약 */}
            <div className="p-4 border-b border-gray-200 space-y-2 flex-shrink-0">
                <div className="text-xl font-bold text-blue-600">
                    {formatDuration(route.totalTime)}
                </div>
                <div className="text-sm text-gray-700">
                    거리: {formatDistance(route.totalDistance)} (도보 {formatDistance(route.walkingDistance)})
                </div>
                <div className="text-sm text-gray-500">
                    요금: {route.fare.toLocaleString()}원
                </div>
            </div>

            {/* 대중교통 - 세부 경로 (Segments) */}
            <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">세부 경로</div>
                <ol className="relative border-l border-gray-200 ml-2">
                    {route.segments.map((seg, index) => (
                        // 0미터/0초짜리 도보 환승은 건너뜀
                        (seg.mode === 'WALK' && seg.distance === 0) ? null : (
                            <li key={index} className="mb-6 ml-6">
                                <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${
                                    seg.mode === 'WALK' ? 'bg-gray-200' : getRouteColor(seg.routeNumber)
                                }`}>
                                    <span className="text-sm">{getModeIcon(seg.mode)}</span>
                                </span>
                                <div className="ml-2">
                                    <h3 className="flex items-center mb-1 text-base font-semibold text-gray-900">
                                        {seg.routeNumber}
                                        {seg.mode !== 'WALK' && (
                                            <span className="text-xs font-medium text-gray-500 ml-2">({seg.startName} → {seg.endName})</span>
                                        )}
                                    </h3>
                                    <time className="block mb-2 text-xs font-normal leading-none text-gray-500">
                                        {formatDuration(seg.duration)} ({formatDistance(seg.distance)})
                                    </time>
                                    {/* 도보 세부 단계 표시 */}
                                    {seg.mode === 'WALK' && seg.steps.length > 0 && (
                                        <ol className="list-disc list-inside mt-2 space-y-1 pl-2">
                                            {seg.steps.map((step, stepIndex) => (
                                                <li key={stepIndex} className="text-xs text-gray-700">{step}</li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </li>
                        )
                    ))}
                </ol>
            </div>
        </div>
    );
}