"use client";

import { useEffect, useRef } from "react";

/** GeoJSON properties 타입(구 이름) */
type GuFeatureProps = { nm: string };

/** 더미 혼잡도 0(여유)~100(붐빔) */
const DUMMY_CONGESTION: Record<string, number> = {
    종로구: 30, 중구: 55, 용산구: 70, 성동구: 45, 광진구: 20,
    동대문구: 65, 중랑구: 50, 성북구: 35, 강북구: 40, 도봉구: 25,
    노원구: 60, 은평구: 30, 서대문구: 45, 마포구: 55, 양천구: 20,
    구로구: 65, 금천구: 75, 영등포구: 40, 동작구: 55, 관악구: 70,
    서초구: 35, 강남구: 50, 송파구: 60, 강동구: 25,
};

/** 값→색상 */
function colorFor(v: number) {
    if (v >= 66) return "#ff5a5a"; // 붐빔(빨강)
    if (v >= 33) return "#4e89ff"; // 보통(파랑)
    return "#35b26f";              // 여유(초록)
}

/** 기본(비활성) 스타일: 회색 */
const BASE_STYLE: L.PathOptions = {
    color: "#ffffff",        // 경계선
    weight: 1.2,
    opacity: 1,
    fillColor: "#cbd5e1",    // 회색
    fillOpacity: 0.35,
};

export default function SeoulCongestionMap() {
    const mapRef = useRef<any>(null);

    useEffect(() => {
        if (mapRef.current) return;

        let L: any;
        let map: any;

        (async () => {
            const leaflet = await import("leaflet");
            L = leaflet;

            map = L.map("seoul-map", {
                center: [37.5665, 126.9780],
                zoom: 11,
                zoomControl: true,
                scrollWheelZoom: true,
                attributionControl: false,
            });
            mapRef.current = map;

            // 타일
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // GeoJSON
            const res = await fetch("/data/seoul-gu.json");
            const geojson = await res.json();

            // 기본 스타일(회색)만 적용
            const styleFn = () => ({ ...BASE_STYLE });

            const onEachFeature = (feature: any, layer: any) => {
                const gu: string = feature?.properties?.nm ?? "UNKNOWN";
                const v = DUMMY_CONGESTION[gu] ?? 0;

                // 기본 툴팁
                layer.bindTooltip(
                    `<div style="font-weight:600">${gu}</div><div>혼잡도: ${v}</div>`,
                    { sticky: true, direction: "top", offset: L.point(0, -4) }
                );

                // hover 시에만 혼잡도 색/강조 적용
                layer.on({
                    mouseover: () => {
                        layer.setStyle({
                            color: "#ffffff",
                            weight: 2,
                            fillOpacity: 0.70,
                            fillColor: colorFor(v),
                        });
                    },
                    mouseout: () => {
                        layer.setStyle({ ...BASE_STYLE });
                    },
                    click: () => {
                        const b = layer.getBounds?.();
                        if (b) map.fitBounds(b, { maxZoom: 13 });
                    },
                });

                // 중앙 라벨
                try {
                    const c =
                        (layer as any).getBounds?.().getCenter?.() ??
                        (layer as any).getCenter?.();

                    if (c) {
                        const divIcon = L.divIcon({
                            className: "gu-label",
                            html: `
                <div style="
                  font-size: 13px;
                  color: #1f2937;
                  font-weight: 700;
                  text-shadow: 0 0 3px rgba(255,255,255,0.9);
                  white-space: nowrap;
                ">${gu}</div>`,
                        });

                        L.marker(c as any, {
                            icon: divIcon as any,
                            interactive: false,
                            zIndexOffset: 1000,
                        }).addTo(map);
                    }
                } catch {}
            };

            const layer = L.geoJSON(geojson, {
                style: styleFn as any,
                onEachFeature,
            }).addTo(map);

            try {
                map.fitBounds(layer.getBounds(), { padding: [10, 10] });
            } catch {}

            // 범례
            const legend = L.control({ position: "bottomright" });
            legend.onAdd = () => {
                const div = L.DomUtil.create("div", "map-legend") as HTMLElement;
                div.innerHTML = `
          <div style="background:rgba(255,255,255,0.95);padding:8px 10px;
                      border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.12);
                      font-size:12px;line-height:1.6;">
            <div style="font-weight:600;margin-bottom:4px;">혼잡도(더미)</div>
            <div><span style="display:inline-block;width:12px;height:12px;background:#35b26f;border-radius:3px;margin-right:6px;"></span>여유 (0~32)</div>
            <div><span style="display:inline-block;width:12px;height:12px;background:#4e89ff;border-radius:3px;margin-right:6px;"></span>보통 (33~65)</div>
            <div><span style="display:inline-block;width:12px;height:12px;background:#ff5a5a;border-radius:3px;margin-right:6px;"></span>붐빔 (66~100)</div>
          </div>`;
                return div;
            };
            legend.addTo(map);
        })();

        return () => {
            try { map?.remove(); } catch {}
            mapRef.current = null;
        };
    }, []);

    return <div id="seoul-map" style={{ width: "100%", height: "100vh" }} />;
}
