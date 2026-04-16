import { Suspense } from "react";
import { getSeoulBoundary } from "@/lib/seoul-boundary";
import { CAT_ITEMS } from "@/lib/map-constants";
import MapContainerClient from "@/components/MapContainerClient";

export default async function Home() {
    const seoulBoundary = await getSeoulBoundary();
    return (
        <Suspense fallback={<MapSkeleton />}>
            <MapContainerClient
                seoulBoundary={seoulBoundary}
                categoryItems={CAT_ITEMS}
            />
        </Suspense>
    );
}

function MapSkeleton() {
    return (
        <div className="w-full h-full grid place-items-center bg-gray-100">
            <span className="text-lg font-semibold text-gray-700">지도 로딩 중...</span>
        </div>
    );
}
