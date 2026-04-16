// src/lib/seoul-boundary.ts
// 서버 전용: GeoJSON 로드 + turf union 계산 (모듈 레벨 캐싱)

import { promises as fs } from "fs";
import path from "path";
import { featureCollection } from "@turf/helpers";
import { union } from "@turf/turf";
import type { SeoulPoly } from "@/types/map";

let cached: SeoulPoly | null = null;

export async function getSeoulBoundary(): Promise<SeoulPoly | null> {
    if (cached) return cached;

    try {
        const filePath = path.join(process.cwd(), "public", "data", "seoul-gu.geojson");
        const raw = await fs.readFile(filePath, "utf-8");
        const geojson = JSON.parse(raw);

        if (!geojson?.features || geojson.features.length === 0) return null;

        const polys = geojson.features.filter(
            (f: any) =>
                f?.geometry &&
                (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
        );

        if (polys.length === 0) return null;

        let combined: SeoulPoly = polys[0] as SeoulPoly;
        for (let i = 1; i < polys.length; i++) {
            try {
                const fc = featureCollection([combined, polys[i] as SeoulPoly]);
                const merged = union(fc) as SeoulPoly | null;
                if (merged) combined = merged;
            } catch (err) {
                console.error(`Turf union error at index ${i}:`, err);
            }
        }

        cached = combined;
        return cached;
    } catch (error) {
        console.error("Failed to load or process GeoJSON:", error);
        return null;
    }
}
