// src/components/DynamicCongestionMap.tsx
"use client"; // 👈 Mark this as a Client Component

import dynamic from 'next/dynamic';

// Move the dynamic import *inside* this Client Component
const SeoulCongestionMapWithNoSSR = dynamic(
    () => import('@/components/SeoulCongestionMap'),
    { ssr: false } // 👈 ssr: false is allowed here
);

// This simple component just renders the dynamically imported map
export default function DynamicCongestionMap() {
    return <SeoulCongestionMapWithNoSSR />;
}