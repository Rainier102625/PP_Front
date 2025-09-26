
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footprints, Loader2, Info, Map } from "lucide-react"; // Map 아이콘 추가
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
                            <div className="flex items-center space-x-2 pt-2">
                                <Button size="sm" className="h-8 px-3 bg-black text-white hover:bg-gray-800" onClick={() => onShowDetails(spot)}>
                                    <Info className="w-4 h-4 mr-1.5" />
                                    상세보기
                                </Button>
                                <Button size="sm" className="h-8 px-3 bg-black text-white hover:bg-gray-800" onClick={() => onGetDirections(spot)}>
                                    <Map className="w-4 h-4 mr-1.5" />
                                    길찾기
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
