# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev        # Start dev server with Turbopack

# Build & production
npm run build      # Build with Turbopack (standalone output)
npm start          # Start production server

# Linting
npm run lint       # Run ESLint (Next.js config)
```

No test framework is configured in this project.

## Environment Variables

Create `.env.local` with the following keys (all required for full functionality):

```
ODSAY_API_KEY=           # ODSay transit directions API
NAVER_CLIENT_ID=         # Naver Maps client ID
NAVER_CLIENT_SECRET=     # Naver Maps client secret
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=  # Kakao Maps JS key (exposed to client)
KAKAO_REST_API_KEY=      # Kakao REST API (server-side only)
NEXT_PUBLIC_ODSAY_API_KEY=         # ODSay key (exposed to client)
TOUR_API_KEY=            # Korea Tourism API
GOOGLE_API_KEY=          # Google Gemini API key

# Optional
BACKEND_BASE=            # Spring backend URL (default: http://localhost:8082)
MOCK_CONGESTION=1        # Use mock congestion data instead of backend
```

## Architecture

This is a **Next.js 15 App Router** project with Turbopack. The app is a Seoul map application with place search, transit routing, AI chat, and congestion visualization.

### Layout Structure

```
RootLayout (layout.tsx)
  └─ RootShell (client component)
       ├─ AppShell (max-width wrapper, dark bg)
       │    ├─ AsideBar (left nav: /, /CongestionMap, /settings links)
       │    ├─ main > {children} (page content)
       │    └─ MenuDrawer (slide-out menu, state lifted to RootShell)
```

### Pages

- **`/` (page.tsx)** — Simply renders `<MapContainer />`. All state and logic lives inside MapContainer.
- **`/CongestionMap`** — Renders `<DynamicCongestionMap />`, a dynamic import wrapper around `SeoulCongestionMap` (Leaflet-based, SSR-disabled).

### Core Component: MapContainer

`MapContainer.tsx` is the main "fat" client component that owns all state for the map view. It uses **Kakao Maps SDK** (`react-kakao-maps-sdk`) and integrates:

- `TopSearchBar` + `AutoComplete` — Kakao keyword search with autocomplete
- `Categories` — category filter buttons
- `ResultPanel` — list of search/recommendation results
- `RoutePanel` — transit/walk route results with step details
- `AiButton` + `AiAssistantPanel` — Gemini AI chat overlay
- `CurrentLocationButton` — geolocation

Key internal types in MapContainer: `AppPlace`, `WalkRouteSummary`, `TransitSegment`.

### API Routes

All API routes proxy external services to keep keys server-side:

| Route                   | Method | Purpose                                                                    |
| ----------------------- | ------ | -------------------------------------------------------------------------- |
| `/api/odsay-directions` | GET    | ODSay transit routing (`searchPubTransPathT` + `loadLane`)                 |
| `/api/search`           | GET    | Kakao keyword place search                                                 |
| `/api/chat`             | POST   | Gemini AI chat (`gemini-2.5-flash` model via `@google/genai`)              |
| `/api/congestion`       | POST   | Proxies to Spring backend (`BACKEND_BASE`); falls back to seeded mock data |

### Congestion Map (Leaflet)

`SeoulCongestionMap.tsx` uses **Leaflet** (not Kakao Maps) with a Seoul GeoJSON file at `public/data/seoul-gu.geojson`. It renders district polygons colored by congestion level. Because Leaflet requires a DOM, it is loaded via `DynamicCongestionMap.tsx` (a `next/dynamic` wrapper with `ssr: false`).

### Type Definitions

`src/types/` contains shared types:

- `odsay.d.ts` — ODSay API response shapes (`OdsayRoute`, `PathInfo`, `SubPath`, `Lane`)
- `chatMessage.d.ts` — AI chat message format
- `spot.d.ts`, `db.d.ts` — place/spot data shapes
- `naver.d.ts` — Naver Maps type extensions
- `route.ts` — route-related types

### UI Components

Shadcn/ui primitives are in `src/components/ui/` (`button`, `card`, `input`, `select`). Tailwind CSS v4 is used throughout. The `cn()` utility (clsx + tailwind-merge) is in `src/lib/utils.ts`.

### 설계상 주요 유의사항

- **MapContainer는 독립적**: `DIRECTIONS_GUIDE.md`에 컨테이너/프레젠테이셔널 분리 패턴이 설명되어 있지만, 현재 구현은 모든 상태를 `MapContainer`에 직접 통합했습니다. `app/page.tsx`는 단순한 래퍼일 뿐입니다.
- **카카오 지도 로딩**: `react-kakao-maps-sdk`의 `useKakaoLoader` 훅이 `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`로 카카오 지도 SDK를 로드합니다.
- **서울 폴리곤 데이터**: `MapContainer`에서 Turf.js(`@turf/turf`)를 사용해 서울 구 폴리곤들의 합집합(union)을 계산하여 경계를 렌더링합니다.
- **백엔드 연동**: Spring 백엔드(`BACKEND_BASE`)에 연결할 수 없으면 혼잡도 API가 자동으로 결정론적 더미 데이터로 폴백합니다.

---

## SSR 리팩토링 계획

현재 프로젝트는 Next.js 15 App Router를 사용하지만 실제 SSR 혜택을 받지 못하고 있음. 아래 계획을 Phase 순서대로 실행할 것.

### 현재 문제점

- `page.tsx`가 서버 컴포넌트이지만 `<MapContainer />`만 렌더링 (서버에서 할 일이 없음)
- `MapContainer.tsx`가 `"use client"` 모놀리식 컴포넌트 (23개 useState, 모든 데이터 패칭 포함)
- 외부 백엔드 URL(`pp-domain.duckdns.org:8082`, `127.0.0.1:5001`)이 클라이언트에 직접 노출됨 (**보안 문제**)
- 정적 데이터(서울 GeoJSON)를 매 로드마다 클라이언트에서 fetch + turf union 계산

### Phase 0: 공유 타입 추출

MapContainer 안에 선언된 타입/상수를 별도 파일로 분리.

- **새 파일 `src/types/map.ts`** — `SeoulPoly`, `LatLng`, `Rec`, `PolylineSegment` 타입 이동
- **새 파일 `src/lib/map-constants.ts`** — `INITIAL_CENTER`, `CAT_ITEMS`, 마커 이미지 상수들 이동. `CatItem` 타입은 `Categories.tsx`에 이미 있으므로 export하여 공유
- **`MapContainer.tsx` 수정** — 위 파일들에서 import, 중복 선언 제거

### Phase 1: API 프록시 라우트 생성 (보안 — 최우선)

클라이언트에서 직접 호출하는 3개 외부 URL을 서버 프록시로 전환:

| 현재 (MapContainer에서 직접 호출)                             | 변경 후                                    |
| ------------------------------------------------------------- | ------------------------------------------ |
| `http://127.0.0.1:5001/get-congestion` (line 754)             | `/api/congestion` (이미 존재하지만 미사용) |
| `http://pp-domain.duckdns.org:8082/api/recommend/` (line 823) | `/api/recommend` (새로 생성)               |
| `http://pp-domain.duckdns.org:8082/api/route` (line 1016)     | `/api/route-directions` (새로 생성)        |

**새 파일 `src/app/api/recommend/route.ts`** — GET 프록시, query params 그대로 전달, `BACKEND_BASE` 환경변수 사용 (기존 `src/app/api/congestion/route.ts` 패턴 참고)

**새 파일 `src/app/api/route-directions/route.ts`** — POST 프록시, body 그대로 전달, `BACKEND_BASE` 환경변수 사용

**MapContainer.tsx 수정** (3곳):

- line 754: `fetch("http://127.0.0.1:5001/get-congestion", ...)` → `/api/congestion` + 요청 형식을 기존 congestion 프록시가 기대하는 `[{latitude, longitude, datetime}]` 배열 형식으로 변환
- line 823: `http://pp-domain.duckdns.org:8082/api/recommend/...` → `/api/recommend?...`
- line 1016: `http://pp-domain.duckdns.org:8082/api/route` → `/api/route-directions`

### Phase 2: 서버 사이드 GeoJSON 처리

**새 파일 `src/lib/seoul-boundary.ts`**:

- `fs/promises`로 `public/data/seoul-gu.geojson` 읽기 (서버 전용)
- turf `union()`으로 서울 경계 폴리곤 계산
- 모듈 레벨 캐싱 (`let cached` 변수로 한 번 계산 후 재사용)
- `getSeoulBoundary(): Promise<SeoulPoly | null>` 함수 export

### Phase 3: page.tsx → 진짜 서버 컴포넌트로 전환

**`src/components/MapContainer.tsx` → `src/components/MapContainerClient.tsx`로 이름 변경**:

- props 추가: `seoulBoundary: SeoulPoly | null`, `categoryItems: CatItem[]`
- GeoJSON useEffect (line 521-552) 완전 제거 → `seoulBoundary` prop을 직접 사용 (useState 불필요, 변하지 않는 값이므로)
- `CAT_ITEMS` 상수 제거 → `categoryItems` prop 사용
- 타입 import를 `src/types/map.ts`에서 가져오도록 변경

**`src/app/page.tsx` 수정**:

```tsx
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
      <span className="text-lg font-semibold text-gray-700">
        지도 로딩 중...
      </span>
    </div>
  );
}
```

### Phase 4: 유틸리티 함수 추출

**새 파일 `src/lib/map-utils.ts`** — MapContainer에서 순수 함수들 이동: `colorFor()`, `colorForTransitMode()`, `kakaoPlaceToAppPlace()`, `recToAppPlace()`, `parseLineStringToPath()`, `buildPathFromSteps()`, `stepLinestringToPath()`, `buildTransitPolylineSegments()`. MapContainerClient에서 import하여 사용.

### 실행 순서

| 순서 | 작업                                      | 위험도                         |
| ---- | ----------------------------------------- | ------------------------------ |
| 1    | Phase 0: 타입/상수 추출                   | 없음                           |
| 2    | Phase 1: API 프록시 파일 생성             | 없음 (새 파일)                 |
| 3    | Phase 1: MapContainer fetch URL 변경      | 낮음                           |
| 4    | Phase 4: 유틸리티 추출                    | 낮음                           |
| 5    | Phase 2: seoul-boundary.ts 생성           | 없음 (새 파일)                 |
| 6    | Phase 3: page.tsx + MapContainer 리팩토링 | **중간** — 전체 앱 테스트 필요 |

### 수정 대상 파일 목록

| 파일                                    | 작업                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/components/MapContainer.tsx`       | `MapContainerClient.tsx`로 이름 변경, props 추가, GeoJSON useEffect 제거, fetch URL 변경, 타입/유틸 import 정리 |
| `src/app/page.tsx`                      | async 서버 컴포넌트로 전환, 데이터 패칭 추가, Suspense 래핑                                                     |
| `src/app/api/recommend/route.ts`        | 새로 생성                                                                                                       |
| `src/app/api/route-directions/route.ts` | 새로 생성                                                                                                       |
| `src/lib/seoul-boundary.ts`             | 새로 생성                                                                                                       |
| `src/lib/map-utils.ts`                  | 새로 생성                                                                                                       |
| `src/lib/map-constants.ts`              | 새로 생성                                                                                                       |
| `src/types/map.ts`                      | 새로 생성                                                                                                       |
| `src/components/Categories.tsx`         | `CatItem` 타입을 export하도록 수정                                                                              |

### 하지 말아야 할 것

- ResultPanel, RoutePanel 등을 서버 컴포넌트로 변환 시도 — `onClick` 콜백을 받으므로 불가
- useState 23개를 Zustand/Jotai로 옮기기 — SSR과 무관한 별도 작업
- `"use client"` 제거만으로는 효과 없음 — 부모가 클라이언트 컴포넌트이면 자식도 클라이언트로 번들됨 (AiButton, CurrentLocationButton 등)

### 검증 방법

1. `npm run dev`로 개발 서버 실행
2. 브라우저 DevTools Network 탭에서 확인: `seoul-gu.geojson` 클라이언트 fetch 사라졌는지, `/api/recommend`·`/api/route-directions` 프록시 경유하는지, `pp-domain.duckdns.org` 직접 호출 없는지
3. View Source (Ctrl+U)로 서버 렌더링 HTML에 `MapSkeleton` 마크업 포함 확인
4. 지도 검색 → 추천 → 길찾기 → AI 채팅 전체 기능 동작 확인
5. `npm run build` 성공 확인
