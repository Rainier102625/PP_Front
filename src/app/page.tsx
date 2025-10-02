import { Suspense } from 'react';
import MapContent from '@/components/MapContent';

export default function Home() {
    return (
        <Suspense fallback={<div>Loading map...</div>}>
            <MapContent />
        </Suspense>
    );
}