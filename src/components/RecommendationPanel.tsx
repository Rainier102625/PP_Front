
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footprints, Loader2, Info } from "lucide-react";
import { Spot } from "@/types/spot";
import Image from "next/image";

interface RecommendationPanelProps {
    spots: Spot[];
    isLoading: boolean;
    onGetDirections: (spot: Spot) => void;
    onShowDetails: (spot: Spot) => void; // 상세보기를 위한 prop 추가
}

export function RecommendationPanel({ spots, isLoading, onGetDirections, onShowDetails }: RecommendationPanelProps) {
    if (isLoading) {
        return (
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>추천 장소를 찾고 있습니다...</p>
                </div>
            </div>
        );
    }

    if (spots.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center p-4">
                <p className="text-gray-500">추천 장소가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-white">
            <h2 className="text-xl font-bold">추천 장소</h2>
            {spots.map((spot) => (
                <Card key={spot.contentId} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                        {spot.firstImage ? (
                            <Image src={spot.firstImage} alt={spot.title} width={64} height={64} className="w-16 h-16 rounded-md object-cover bg-gray-100" />
                        ) : (
                            <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center text-gray-400">
                                <p>No Img</p>
                            </div>
                        )}
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-800">{spot.title}</p>
                            <p className="text-xs text-gray-500">{spot.addr1}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Footprints className="w-3 h-3 mr-1"/>
                                <span>{(spot.distanceMeters / 1000).toFixed(1)}km</span>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="link" size="sm" className="p-0 h-auto text-blue-500" onClick={() => onShowDetails(spot)}>상세보기</Button>
                                <Button variant="link" size="sm" className="p-0 h-auto text-blue-500" onClick={() => onGetDirections(spot)}>대중교통 길찾기</Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
