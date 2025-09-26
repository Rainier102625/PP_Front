"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Bus, TrainFront, PersonStanding, Loader2 } from "lucide-react";
import { OdsayRoute, SubPath } from "@/types/odsay";
import { Spot } from "@/types/spot";

interface DirectionsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    directionsResult: OdsayRoute[];
    isDirectionsLoading: boolean;
    directionsDestination: Spot | null;
    originName: string;
    onSelectRoute: (index: number) => void;
    selectedRouteIndex: number;
}

const renderSubPath = (subPath: SubPath, index: number) => {
    const Icon = subPath.trafficType === 1 ? TrainFront : subPath.trafficType === 2 ? Bus : PersonStanding;
    const color = subPath.trafficType === 1 ? "text-blue-600" : subPath.trafficType === 2 ? "text-green-600" : "text-gray-600";

    return (
        <div key={index} className="flex space-x-3 p-2 rounded-lg">
            <Icon className={`w-5 h-5 mt-1 ${color}`} />
            <div className="flex-grow border-l-2 pl-3 border-dotted">
                <p className="font-semibold text-sm">
                    {subPath.lane?.[0]?.name || (subPath.trafficType === 3 ? "도보" : "경로")}
                </p>
                <p className="text-xs text-gray-500">
                    {subPath.startName} → {subPath.endName} ({subPath.sectionTime}분)
                </p>
            </div>
        </div>
    );
};

export function RightSidebar({ isOpen, onClose, directionsResult, isDirectionsLoading, directionsDestination, originName, onSelectRoute, selectedRouteIndex }: DirectionsPanelProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <aside className="w-[380px] h-full bg-white border-r border-gray-200 flex flex-col p-4 shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-gray-800">경로 결과</h1>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {directionsDestination && (
                <h2 className="text-lg font-semibold text-gray-700 truncate pb-2 border-b mb-4">
                    {originName} → {directionsDestination?.title}
                </h2>
            )}

            <div className="flex flex-col space-y-2 flex-grow overflow-y-auto pt-2">
                {isDirectionsLoading ? (
                     <div className="flex-grow flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p>경로를 검색 중입니다...</p>
                        </div>
                    </div>
                ) : directionsResult.length > 0 ? (
                    <div className="space-y-3">
                        {directionsResult.map((route, index) => (
                            <Card key={index} className="cursor-pointer transition-all" onClick={() => onSelectRoute(index)}>
                                <div className="p-3 font-semibold flex justify-between items-center">
                                    <span>경로 {index + 1}</span>
                                    <span className="text-blue-600">{route.pathInfo.info.totalTime}분 소요</span>
                                </div>
                                {selectedRouteIndex === index && (
                                    <div className="border-t p-3 bg-gray-50/50">
                                        <div className="space-y-1">
                                            {route.pathInfo.subPath.map(renderSubPath)}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p>검색된 경로가 없습니다.</p>
                )}
            </div>
        </aside>
    );
}
