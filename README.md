# PP-Front — 서울 스마트 여행 지도

> **서울 지역 장소 검색 · AI 기반 장소 추천 · 실시간 혼잡도 시각화 · 대중교통 길찾기**를
> 통합 제공하는 Next.js 15 웹 애플리케이션

---

## 주요 기능

| 기능             | 설명                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| **장소 검색**    | 카카오 키워드 검색 + 자동완성, 서울 행정 경계 내 결과만 필터링                   |
| **AI 장소 추천** | 입력한 위치 주변 관광지·맛집·숙박 등을 AI 기반으로 추천                          |
| **혼잡도 표시**  | 검색된 장소의 실시간 혼잡도(여유 / 보통 / 붐빔)를 마커 및 리스트에 색상으로 표시 |
| **길찾기**       | 도보 / 대중교통(버스·지하철) 경로 검색, 혼잡도 기반 색상 폴리라인                |
| **혼잡도 지도**  | 서울 25개 구별 혼잡 수준을 Leaflet 폴리곤 히트맵으로 시각화 (`/CongestionMap`)   |
| **AI 채팅**      | Google Gemini 기반 여행 도우미 채팅 패널 (마크다운 렌더링 지원)                  |
| **현재 위치**    | Geolocation API로 내 위치 탐지 및 지도 이동                                      |

---

## 기술 스택

### Frontend

| 분류          | 기술                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| 프레임워크    | [Next.js 15](https://nextjs.org/) App Router + Turbopack                       |
| UI 라이브러리 | React 19                                                                       |
| 언어          | TypeScript 5                                                                   |
| 스타일링      | Tailwind CSS v4, Shadcn/ui 프리미티브 (Radix UI)                               |
| 지도 (메인)   | [Kakao Maps SDK](https://apis.map.kakao.com/) via `react-kakao-maps-sdk`       |
| 지도 (혼잡도) | [Leaflet](https://leafletjs.com/) — SSR 비활성화(`next/dynamic`)               |
| 공간 연산     | [Turf.js](https://turfjs.org/) — 서울 경계 union, 장소 포함 여부 판별          |
| AI            | [Google Gemini](https://ai.google.dev/) `gemini-2.5-flash` via `@google/genai` |

### API 프록시 라우트

모든 외부 서비스 호출은 서버 사이드 라우트(`/app/api/`)를 통해 프록시되어
클라이언트에 API 키나 백엔드 URL이 노출되지 않습니다.

| 라우트                  | 메서드 | 역할                                                               |
| ----------------------- | ------ | ------------------------------------------------------------------ |
| `/api/congestion`       | POST   | 좌표 배열 → 혼잡도 레벨 (백엔드 불가 시 결정론적 더미 데이터 폴백) |
| `/api/recommend`        | GET    | 위치·시간·카테고리 기반 장소 추천 (Spring 백엔드 프록시)           |
| `/api/route-directions` | POST   | 도보 / 대중교통 경로 계산 (Spring 백엔드 프록시)                   |
| `/api/odsay-directions` | GET    | ODSay 대중교통 경로 API 프록시                                     |
| `/api/search`           | GET    | 카카오 키워드 장소 검색                                            |
| `/api/chat`             | POST   | Gemini AI 채팅                                                     |

---

## 프로젝트 구조

```text
src/
├── app/
│   ├── page.tsx                  ← async 서버 컴포넌트 (GeoJSON 서버 처리 + Suspense)
│   ├── CongestionMap/            ← 서울 구별 혼잡도 지도 페이지
│   └── api/                      ← 외부 API 서버 프록시 라우트 6개
│
├── components/
│   ├── MapContainerClient.tsx    ← 메인 지도 클라이언트 컴포넌트 (모든 지도 상태)
│   ├── ResultPanel.tsx           ← 검색 결과 슬라이드 패널
│   ├── RoutePanel.tsx            ← 길찾기 경로 패널
│   ├── AiAssistantPanel.tsx      ← AI 채팅 오버레이
│   ├── SeoulCongestionMap.tsx    ← Leaflet 기반 구별 혼잡도 지도
│   ├── TopSearchBar.tsx          ← 검색바 + 자동완성 래퍼
│   ├── Categories.tsx            ← 카테고리 필터 탭
│   └── ...
│
├── lib/
│   ├── map-constants.ts          ← 초기 중심 좌표, CAT_ITEMS, 마커 이미지 상수
│   ├── map-utils.ts              ← 순수 유틸 함수 (colorFor, 좌표 변환, 경로 구성)
│   └── seoul-boundary.ts        ← 서버 전용: GeoJSON → Turf union (모듈 레벨 캐싱)
│
└── types/
    ├── map.ts                    ← SeoulPoly, LatLng, Rec, PolylineSegment
    ├── route.ts                  ← AppPlace, TransitRoute, WalkRouteSummary 등
    └── ...
```

### SSR 설계 포인트

- `page.tsx`가 **async 서버 컴포넌트**로 서버에서 `public/data/seoul-gu.geojson`을 읽고
  Turf union 계산 결과를 `MapContainerClient`에 prop으로 전달 → 클라이언트 GeoJSON fetch 제거
- `seoul-boundary.ts`는 모듈 레벨 캐싱(`let cached`)으로 서버 프로세스 내 한 번만 계산
- 외부 백엔드 URL이 클라이언트 번들에 포함되지 않도록
  모든 외부 호출을 `/api/*` 프록시 라우트로 격리

---

## 시작하기

### 요구 사항

- Node.js 20+

### 1. 저장소 클론

```bash
git clone https://github.com/<your-org>/pp-front.git
cd pp-front
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
# 카카오 지도 (필수)
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=   # 카카오 개발자 콘솔 → JavaScript 키
KAKAO_REST_API_KEY=                 # 카카오 REST API 키

# 네이버 지도
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# ODSay 대중교통 API
ODSAY_API_KEY=
NEXT_PUBLIC_ODSAY_API_KEY=

# 한국관광공사 API
TOUR_API_KEY=

# Google Gemini (AI 채팅, 필수)
GOOGLE_API_KEY=

# Spring 백엔드 URL (기본값: http://localhost:8082)
BACKEND_BASE=http://localhost:8082

# 백엔드 없이 개발할 때 — 혼잡도 더미 데이터 사용
MOCK_CONGESTION=1
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

---

## 명령어

```bash
npm run dev      # Turbopack 개발 서버
npm run build    # 프로덕션 빌드
npm run start    # 빌드 후 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

---

## 혼잡도 레벨 색상표

| 레벨     | 색상           |
| -------- | -------------- |
| 여유     | 초록 `#35b26f` |
| 보통     | 파랑 `#4e89ff` |
| 약간붐빔 | 노랑 `#febd1a` |
| 붐빔     | 빨강 `#ff5a5a` |

---

## 카테고리 코드표

| 코드 | 카테고리       |
| ---- | -------------- |
| 12   | 관광지         |
| 14   | 문화시설       |
| 15   | 행사/공연/축제 |
| 25   | 여행코스       |
| 28   | 레포츠         |
| 32   | 숙박           |
| 38   | 쇼핑           |
| 39   | 음식점         |

---
