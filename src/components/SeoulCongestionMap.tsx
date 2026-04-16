"use client";

import L, { LeafletMouseEvent } from "leaflet"; // [수정] LeafletMouseEvent 타입을 import
import { useEffect, useRef } from "react";
import "leaflet-boundary-canvas";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";

/** GeoJSON properties 타입(구 이름) */
type GuFeatureProps = { nm: string };

/** 더미 혼잡도 0(여유)~100(붐빔) */
const DUMMY_CONGESTION: Record<string, string> = {
  종로구: "여유",
  중구: "보통",
  용산구: "보통",
  성동구: "보통",
  광진구: "붐빔",
  동대문구: "약간붐빔",
  중랑구: "보통",
  성북구: "보통",
  강북구: "보통",
  도봉구: "여유",
  노원구: "보통",
  은평구: "보통",
  서대문구: "보통",
  마포구: "약간붐빔",
  양천구: "여유",
  구로구: "약간 붐빔",
  금천구: "약간붐빔",
  영등포구: "보통",
  동작구: "약간붐빔",
  관악구: "붐빔",
  서초구: "붐빔",
  강남구: "붐빔",
  송파구: "약간붐빔",
  강동구: "여유",
  강서구: "보통",
};

/** 구별 상세 설명 데이터 */
const GU_DESCRIPTIONS: Record<string, string[]> = {
  // --- 여유 (Green) ---
  종로구: [
    "역사 지구 및 고궁 방문객이 적은 시간대입니다.",
    "도심 내 주요 도로의 차량 통행이 원활합니다.",
    "현재 유동 인구가 적어 매우 쾌적합니다.",
  ],
  도봉구: [
    "도봉산, 창포원 등 공원/산지 위주 지역입니다.",
    "관내 주요 도로 교통 흐름이 매우 원활합니다.",
    "주거 단지 중심으로, 통행량이 매우 적습니다.",
  ],
  양천구: [
    "목동 주거 단지 위주로, 차량 통행이 한산합니다.",
    "서부간선도로 및 경인고속도로 진입이 원활합니다.",
    "오목교역 상권 외에는 유동 인구가 적습니다.",
  ],
  강동구: [
    "고덕, 명일 등 대규모 주거 단지 중심입니다.",
    "천호역 상권 외 지역은 매우 한산한 상태입니다.",
    "올림픽대로 및 강변북로 진입이 원활합니다.",
  ],
  // --- 보통 (Blue) ---
  중구: [
    "명동 및 남대문시장으로 꾸준한 유동 인구가 유입됩니다.",
    "시청 인근 주요 도로의 교통 흐름은 보통 수준입니다.",
    "평균적인 도심 혼잡도를 유지하고 있습니다.",
  ],
  용산구: [
    "이태원, 삼각지 방면으로 꾸준한 차량 이동이 있습니다.",
    "국립중앙박물관 방문객이 있으나 혼잡하지는 않습니다.",
    "용산역 KTX 이용객으로 인한 평균 혼잡도입니다.",
  ],
  성동구: [
    "성수동 카페거리 및 서울숲 방면으로 차량이 꾸준히 유입됩니다.",
    "주요 도로의 교통 흐름은 대체로 원활한 편입니다.",
    "왕십리역 인근 상권이 보통 수준을 유지하고 있습니다.",
  ],
  중랑구: [
    "주거 지역 위주로, 상업 지구는 평균 수준의 혼잡도입니다.",
    "동일로 및 망우로 교통 흐름은 대체로 원활합니다.",
    "평균적인 혼잡도 수준을 유지하고 있습니다.",
  ],
  성북구: [
    "성신여대입구역 주변 상권에 꾸준한 유동 인구가 있습니다.",
    "내부순환로 정릉IC 부근 교통 흐름은 원활한 편입니다.",
    "평균적인 혼잡도 수준을 유지하고 있습니다.",
  ],
  강북구: [
    "수유역 및 미아사거리역 주변 상권이 보통 수준입니다.",
    "북한산 등산객 하산이 시작되어 교통량이 소폭 증가했습니다.",
    "평균적인 혼잡도 수준을 유지하고 있습니다.",
  ],
  노원구: [
    "노원역 문화의 거리를 중심으로 유동 인구가 꾸준합니다.",
    "대규모 주거 단지 차량 이동으로 평균 수준을 유지합니다.",
    "동부간선도로 녹천교 부근 흐름은 원활합니다.",
  ],
  은평구: [
    "연신내역, 불광역 상권을 중심으로 유동 인구가 있습니다.",
    "은평 한옥마을 방문객 차량이 꾸준히 유입되고 있습니다.",
    "평균적인 혼잡도 수준을 유지하고 있습니다.",
  ],
  서대문구: [
    "신촌, 이대 대학가 주변으로 꾸준한 유동 인구가 있습니다.",
    "내부순환로 홍제IC 부근 교통 흐름은 원활한 편입니다.",
    "평균적인 혼잡도 수준을 유지하고 있습니다.",
  ],
  영등포구: [
    "여의도 더현대 서울, IFC몰 방문 차량이 꾸준히 유입됩니다.",
    "타임스퀘어 주변 교통 흐름은 보통 수준입니다.",
    "올림픽대로 여의도 구간은 대체로 원활합니다.",
  ],
  강서구: [
    "김포공항 및 마곡지구 주변으로 꾸준한 차량 이동이 있습니다.",
    "주요 도로의 교통 흐름은 대체로 원활한 편입니다.",
    "평균적인 혼잡도 수준을 유지하고 있습니다.",
  ],

  // --- 약간 붐빔 (Yellow) ---
  동대문구: [
    "동대문시장 및 DDP 인근 쇼핑객으로 인해 다소 혼잡합니다.",
    "청량리역 환승 센터 주변으로 교통량이 많은 편입니다.",
    "평소보다 통행량이 많으니, 이동 시 참고하시기 바랍니다.",
  ],
  마포구: [
    "홍대입구역, 연남동 상권에 방문객이 집중되고 있습니다.",
    "합정역 및 상수역 인근 도로가 주말 차량으로 다소 정체됩니다.",
    "평소보다 통행량이 많으니, 대중교통 이용을 권장합니다.",
  ],
  구로구: [
    "구로디지털단지 방면 퇴근 차량으로 인해 일부 정체가 있습니다.",
    "신도림역 환승 인원 및 테크노마트 방문객이 많습니다.",
    "남부순환로 구로IC 부근이 다소 혼잡합니다.",
  ],
  금천구: [
    "가산디지털단지 패션 아울렛에 쇼핑객이 몰리고 있습니다.",
    "서부간선도로 진입로 주변 차량 통행량이 많습니다.",
    "평소보다 통행량이 많으니, 이동 시 참고하시기 바랍니다.",
  ],
  동작구: [
    "보라매공원 및 노량진 학원가 주변 유동 인구가 많습니다.",
    "사당역 주변 상권 이용객으로 인해 다소 혼잡합니다.",
    "동작대로 및 현충로 일부 구간이 정체됩니다.",
  ],
  송파구: [
    "롯데월드, 롯데타워 방문객 차량으로 잠실역 일대가 혼잡합니다.",
    "올림픽공원 행사로 인해 주변 도로가 다소 정체됩니다.",
    "평소 주말보다 통행량이 많으니 참고 바랍니다.",
  ],

  // --- 붐빔 (Red) ---
  광진구: [
    "어린이대공원 주말 방문객 차량으로 인해 매우 혼잡합니다.",
    "건대입구역 상권(맛의 거리)에 유동 인구가 집중되고 있습니다.",
    "동부간선도로 진입로 부근이 정체 중입니다.",
  ],
  관악구: [
    "서울대입구역(샤로수길) 상권에 인파가 집중되고 있습니다.",
    "관악산 등산객 하산 차량으로 인해 도로가 정체됩니다.",
    "남부순환로 일대가 매우 혼잡하니 우회 바랍니다.",
  ],
  서초구: [
    "강남대로, 신세계백화점 강남점 주변이 매우 혼잡합니다.",
    "고속터미널 이용객 및 차량으로 인해 정체가 심합니다.",
    "경부고속도로 잠원IC, 서초IC 진입이 어렵습니다.",
  ],
  강남구: [
    "테헤란로, 강남역, 압구정 일대에 인파가 집중되었습니다.",
    "주요 도로 대부분에서 차량 정체가 발생하고 있습니다.",
    "대중교통 이용을 강력히 권장합니다.",
  ],
};

/** 값→색상 */
function colorFor(v: string) {
  if (v === "붐빔") return "#ff5a5a"; // 붐빔(빨강)
  if (v === "약간붐빔") return "#febd1a"; // 약간 붐빔(노랑)
  if (v === "보통") return "#4e89ff"; // 보통(파랑)
  return "#35b26f"; // 여유(초록)
}

/** 기본(비활성) 스타일: 흰색 채우기 */
const BASE_STYLE: L.PathOptions = {
  color: "#0e0f37", // 경계선 (어두운 배경색과 동일하게)
  weight: 2,
  opacity: 1,
  fillOpacity: 1,
  fillColor: "white", // 서울 내부 색상
};

export default function SeoulCongestionMap() {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current) return;

    let map: L.Map | null = null;

    // 마운트 상태 추가
    let mounted = true;

    (async () => {
      if (!L || !mounted) return;

      if (!mapRef.current) {
        map = L.map("seoul-map", {
          center: [37.5665, 126.978],
          zoom: 12,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          dragging: false,
          attributionControl: false,
        });

        // 맵 컨테이너 배경색 (서울 외부 색상)
        map.getContainer().style.backgroundColor = "#0e0f37";

        mapRef.current = map;

        let geojson: any = null;
        try {
          // GeoJSON
          const res = await fetch("/data/seoul-gu.geojson");
          if (!mounted) return;
          geojson = await res.json();
          if (!mounted) return;
        } catch (e) {
          console.error("Error loading GeoJSON:", e);
          return;
        }

        // 타일 레이어 (삭제됨)
        // new L.TileLayer.BoundaryCanvas(...).addTo(map);

        // 기본 스타일(회색)만 적용
        const styleFn = () => ({ ...BASE_STYLE });

        const onEachFeature = (feature: any, layer: any) => {
          const gu: string = feature?.properties?.nm ?? "UNKNOWN";
          const v = DUMMY_CONGESTION[gu] ?? "여유";

          // [수정] 위에서 정의한 GU_DESCRIPTIONS 객체에서 설명을 가져옵니다.
          const description =
            GU_DESCRIPTIONS[gu] || "상세 정보가 준비중입니다.";

          // 기본 툴팁 (마우스 오버 시)
          layer.bindTooltip(
            `<div style="font-weight:600">${gu}</div><div>혼잡도: ${v}</div>`,
            { sticky: true, direction: "top", offset: L.point(0, -4) },
          );

          // hover 시에만 혼잡도 색/강조 적용
          layer.on({
            mouseover: () => {
              layer.setStyle({
                color: "#333333", // 더 진한 경계선
                weight: 3,
                fillOpacity: 0.7,
                fillColor: colorFor(v), // 혼잡도 색상
              });
            },
            mouseout: () => {
              layer.setStyle({ ...BASE_STYLE });
            },

            // click 이벤트 핸들러 활성화 ---
            click: (e: LeafletMouseEvent) => {
              // 1. 구별 설명 배열을 가져옴
              const descriptionLines = GU_DESCRIPTIONS[gu] || [
                "상세 정보가 준비중입니다.",
              ];

              // 2. 배열을 HTML 문자열로 변환 (각 항목을 <div>로 감쌈)
              const descriptionHtml = descriptionLines
                .map((line) => `<div style="margin-bottom: 2px;">${line}</div>`)
                .join(""); // <div>...</div><div>...</div> 형태가 됨

              // 3. 팝업 내용에 descriptionHtml 변수를 삽입
              const popupContent = `
                                <div style="font-size: 15px; font-weight: 600; margin-bottom: 5px; color: #111;">
                                    ${gu}
                                </div>
                                <div style="font-size: 12px; color: #333;">
                                    혼잡도: ${v}
                                </div>
                                <div style="font-size: 12px; color: #555; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px;">
                                    ${descriptionHtml}
                                </div>`;

              // 팝업 생성 및 열기
              if (map) {
                L.popup({
                  minWidth: 180, // 팝업 최소 너비
                  closeButton: true,
                })
                  .setLatLng(e.latlng) // 클릭한 좌표에
                  .setContent(popupContent)
                  .openOn(map); // 맵에 띄우기
              }
            },
          });

          // 중앙 라벨
          try {
            const pointFeature = turf.pointOnFeature(feature);
            const [lng, lat] = pointFeature.geometry.coordinates;
            const c = L.latLng(lat, lng);

            if (map && c) {
              const divIcon = L.divIcon({
                className: "", // 기본 스타일 제거
                html: `
                                    <div style="
                                      font-size: 13px;
                                      color: #1f2937;
                                      font-weight: 700;
                                      text-shadow: 0 0 3px rgba(255,255,255,0.9);
                                      white-space: nowrap;
                                      position: absolute; 
                                      transform: translate(-50%, -50%);
                                    ">${gu}</div>`,
              });

              L.marker(c as any, {
                icon: divIcon as any,
                interactive: false,
                zIndexOffset: 1000,
              }).addTo(map);
            }
          } catch (e) {
            console.error("Error creating label:", e, feature?.properties?.nm);
          }
        };

        const layer = L.geoJSON(geojson, {
          style: styleFn as any,
          onEachFeature,
        }).addTo(map);

        // map.fitBounds (삭제됨)

        // 범례
        const legend = new L.Control({ position: "bottomright" });
        legend.onAdd = () => {
          const div = L.DomUtil.create("div", "map-legend") as HTMLElement;
          div.innerHTML = `
              <div style="background:rgba(255,255,255,0.95);padding:8px 10px;
                          border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.12);
                          font-size:12px;line-height:1.6;">
                <div style="font-weight:600;margin-bottom:4px;">혼잡도</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#35b26f;border-radius:3px;margin-right:6px;"></span>여유</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#4e89ff;border-radius:3px;margin-right:6px;"></span>보통</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#febd1a;border-radius:3px;margin-right:6px;"></span>약간 붐빔</div>              
                <div><span style="display:inline-block;width:12px;height:12px;background:#ff5a5a;border-radius:3px;margin-right:6px;"></span>붐빔</div>
              </div>`;
          return div;
        };
        legend.addTo(map);
      }
    })();

    return () => {
      mounted = false;

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error("Error removing map:", e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  return <div id="seoul-map" style={{ width: "100%", height: "100vh" }} />;
}
