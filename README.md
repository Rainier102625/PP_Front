# Seoul Smart Tour Map

React \+ TypeScript 기반의 서울 관광\·상권 지도 서비스입니다.  
카카오 지도 SDK와 외부 추천/혼잡도/길찾기 API를 활용해 위치 검색, 장소 추천, 혼잡도 기반 길찾기 기능을 제공합니다.

## 주요 기능
- `src/components/MapContainer.tsx`

1. **지도 및 현재 위치 표시**
    - 카카오 지도 SDK(`react-kakao-maps-sdk`)를 사용해 서울 중심 지도를 렌더링
    - 브라우저 Geolocation API로 현재 위치를 가져와 지도에 마커로 표시
    - 현재 위치 버튼으로 다시 내 위치로 이동

2. **장소 검색 및 자동완성**
    - 상단 검색바에서 키워드 입력
    - 카카오 장소 검색 API 기반 자동완성 (`keywordSearch`)
    - 검색 결과는:
        - 서울시 경계(GeoJSON) 안에 있는 결과만 필터링 (`@turf/turf` 활용)
        - 결과 리스트 패널과 지도 마커로 동시 표시
        - 결과 클릭 시 지도 중심 이동 및 정보 인포윈도우 표시

3. **추천 장소 검색**
    - 검색어(예: `강남역`) 주변 기반 추천 API 호출  
      `GET http://pp-domain.duckdns.org:8082/api/recommend/`
    - 상단 카테고리(관광지, 문화시설, 음식점 등)를 선택하면 해당 카테고리 중심으로 추천
    - 추천 장소 리스트를 패널과 지도 마커로 표시

4. **혼잡도 정보 조회**
    - 검색 결과 장소들에 대해 혼잡도 API 호출  
      `POST http://127.0.0.1:5001/get-congestion`
    - 응답으로 받은 혼잡도 레벨(예: `붐빔`, `약간붐빔`, `보통`)을 리스트와 인포윈도우에 표시
    - 혼잡도에 따라 색상을 다르게 적용

5. **길찾기 (도보 / 대중교통)**
    - 장소 인포윈도우에서:
        - \`여기서 출발\`: 출발지 설정
        - \`여기로 도착\`: 도착지 설정
    - 출발지와 도착지 설정 후 길찾기 API 호출  
      `POST http://pp-domain.duckdns.org:8082/api/route`
    - 모드
        - \`walk\`: 도보 경로
            - 시간, 거리, 혼잡도 점수, 안내 문구를 패널에 표시
            - 경로 상 각 구간의 혼잡도에 따라 색깔이 다른 Polyline으로 지도에 표시
        - \`transit\`: 대중교통 경로
            - 여러 경로 후보를 받아 세부 구간(버스, 지하철, 도보)로 분리
            - 경로마다 세그먼트를 모드별 색상(버스/지하철/도보)으로 지도에 Polyline 표시
            - 선택한 경로에 맞게 지도의 bounds 자동 조정
    - 정렬 옵션
        - \`duration\`, \`congestion\` 두 가지 정렬 방식 지원(도보 모드)

6. **AI 어시스턴트 패널**
    - 우측 상단 AI 버튼 클릭 시 패널 오픈
    - `/api/chat` 엔드포인트를 통해 대화형 질문/응답
    - 기본 인삿말과 추천 질문 제공

7. **UI 구성 요소**
    - `TopSearchBar`: 상단 검색 바 + 자동완성
    - `Categories`: 카테고리 필터 (관광, 문화시설, 음식점 등)
    - `ResultPanel`: 검색/추천 결과 리스트 패널
    - `RoutePanel`: 도보/대중교통 길찾기 요약 및 경로 선택 패널
    - `AiAssistantPanel`: AI 채팅 패널
    - `CurrentLocationButton`: 내 위치로 이동 버튼
    - 지도 위 마커 및 Polyline 커스텀 SVG 아이콘 사용

**SeoulCongestionMap 주요 기능**

- `src/components/SeoulCongestionMap.tsx`
  - 서울 자치구 GeoJSON 데이터를 불러와 지도에 경계 폴리곤으로 표시
  - 각 구별 더미 혼잡도 데이터 \(`여유`, `보통`, `약간붐빔`, `붐빔`\)를 색상으로 시각화
  - 마우스 오버 시:
    - 구 이름과 현재 혼잡도를 툴팁으로 표시
    - 해당 구 영역을 혼잡도에 따라 강조 색상으로 하이라이트
  - 구 영역 클릭 시:
    - 혼잡도와 함께, 구별 상세 설명 문장을 팝업으로 표시
  - Turf \`pointOnFeature\`를 사용해 각 구의 내부 대표 지점을 계산하고, 그 위치에 구 이름 라벨 표시
  - 지도 우측 하단에 혼잡도별 색상 범례 표시 \(`여유`, `보통`, `약간 붐빔`, `붐빔`\)
  - 줌, 드래그 등 대부분 인터랙션을 비활성화하여 정적인 인포 그래픽 형태의 지도 제공

## 서버사이드 렌더링(SSR) 구조

- `src/app/layout.tsx`
    - Next.js 13\+ 기본 레이아웃 서버 컴포넌트
    - `\ <html\>`, `\ <body\>` 골격과 전역 레이아웃을 서버에서 먼저 렌더링
    - 폰트, `lang\="ko"`, 전역 스타일 등이 SSR 결과에 포함됨

- `src/app/page.tsx`
    - 페이지 루트는 서버 컴포넌트로 렌더링
    - 지도 영역은 Leaflet 등 브라우저 API를 사용하는 클라이언트 컴포넌트로 분리
    - 즉, 문서 구조와 전역 UI는 SSR, 실제 지도 인터랙션은 클라이언트 렌더링(CSR)으로 동작하는 하이브리드 구조

## 기술 스택

- **프론트엔드**
    - `React` (Next.js 환경, `use client` 컴포넌트)
    - `TypeScript`
    - `react-kakao-maps-sdk` (카카오 지도)
    - Tailwind CSS 스타일 클래스

- **지도 및 공간 분석**
    - Kakao Maps JavaScript SDK
    - `@turf/turf`, `@turf/helpers`를 사용한 GeoJSON 처리 및 서울시 경계 union, 포인트 포함 여부 판단

- **백엔드 연동 (외부 서비스)**
    - 추천 API: `http://pp-domain.duckdns.org:8082/api/recommend/`
    - 길찾기 API: `http://pp-domain.duckdns.org:8082/api/route`
    - 혼잡도 API: `http://127.0.0.1:5001/get-congestion`
    - AI 챗 API: `/api/chat` (Next.js API Route 또는 BFF 가정)

## 실행 전 요구사항

- Node.js / npm
- `.env` 설정
    - `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`에 카카오 지도 JavaScript 키를 설정해야 함
- 백엔드/ML 서버
    - 추천 및 길찾기 서버(`pp-domain.duckdns.org`) 접속 가능해야 함
    - 혼잡도 API 서버(`http://127.0.0.1:5001`)가 로컬에서 동작 중이어야 혼잡도 정보 표시 가능
    - `/api/chat` 엔드포인트 구현 필요

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Next.js 예시)
npm run dev

# 브라우저에서 접속
http://localhost:3000

