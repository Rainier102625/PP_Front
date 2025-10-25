export type District = {
    id: string;
    nameKo: string;
    center: { lat: number; lng: number }; // 백엔드 요청용 대표 좌표
    pos: { top: number; left: number };   // 화면 배치(%)
};

export type CongestionLevel = "여유" | "보통" | "붐빔";

export const DISTRICTS: District[] = [
    { id: "eunpyeong",  nameKo: "은평구",   center:{lat:37.6176,lng:126.9227}, pos:{top:15,left:21} },
    { id: "seodaemun",  nameKo: "서대문구", center:{lat:37.5791,lng:126.9368}, pos:{top:22,left:27} },
    { id: "mapo",       nameKo: "마포구",   center:{lat:37.5663,lng:126.9018}, pos:{top:29,left:22} },
    { id: "jongno",     nameKo: "종로구",   center:{lat:37.5729,lng:126.9793}, pos:{top:22,left:39} },
    { id: "jung",       nameKo: "중구",     center:{lat:37.5636,lng:126.9976}, pos:{top:27,left:41} },
    { id: "yongsan",    nameKo: "용산구",   center:{lat:37.5326,lng:126.9905}, pos:{top:35,left:39} },
    { id: "seongbuk",   nameKo: "성북구",   center:{lat:37.5894,lng:127.0167}, pos:{top:20,left:45} },
    { id: "dongdaemun", nameKo: "동대문구", center:{lat:37.5744,lng:127.0396}, pos:{top:24,left:49} },
    { id: "jungrang",   nameKo: "중랑구",   center:{lat:37.5991,lng:127.0945}, pos:{top:20,left:58} },
    { id: "nowon",      nameKo: "노원구",   center:{lat:37.6543,lng:127.0565}, pos:{top:12,left:55} },
    { id: "dobong",     nameKo: "도봉구",   center:{lat:37.6688,lng:127.0471}, pos:{top:10,left:52} },
    { id: "gangbuk",    nameKo: "강북구",   center:{lat:37.6396,lng:127.0257}, pos:{top:15,left:49} },
    { id: "seongdong",  nameKo: "성동구",   center:{lat:37.5635,lng:127.0364}, pos:{top:30,left:49} },
    { id: "gwangjin",   nameKo: "광진구",   center:{lat:37.5384,lng:127.0823}, pos:{top:33,left:56} },
    { id: "yangcheon",  nameKo: "양천구",   center:{lat:37.5169,lng:126.8664}, pos:{top:47,left:20} },
    { id: "guro",       nameKo: "구로구",   center:{lat:37.4955,lng:126.8878}, pos:{top:52,left:24} },
    { id: "geumcheon",  nameKo: "금천구",   center:{lat:37.4569,lng:126.8957}, pos:{top:58,left:25} },
    { id: "yeongdeungpo",nameKo:"영등포구", center:{lat:37.5264,lng:126.8963}, pos:{top:42,left:26} },
    { id: "dongjak",    nameKo: "동작구",   center:{lat:37.5124,lng:126.9393}, pos:{top:45,left:32} },
    { id: "gwanak",     nameKo: "관악구",   center:{lat:37.4784,lng:126.9516}, pos:{top:53,left:32} },
    { id: "seocho",     nameKo: "서초구",   center:{lat:37.4836,lng:127.0327}, pos:{top:53,left:41} },
    { id: "gangnam",    nameKo: "강남구",   center:{lat:37.5172,lng:127.0473}, pos:{top:48,left:46} },
    { id: "songpa",     nameKo: "송파구",   center:{lat:37.5145,lng:127.1069}, pos:{top:49,left:56} },
    { id: "gangdong",   nameKo: "강동구",   center:{lat:37.5301,lng:127.1238}, pos:{top:45,left:60} },
    { id: "gangseo",    nameKo: "강서구",   center:{lat:37.5510,lng:126.8495}, pos:{top:39,left:15} },
];

// 혼잡도 → 이미지 접두어
export function prefixByLevel(level: CongestionLevel): "g" | "b" | "r" {
    if (level === "여유") return "g";
    if (level === "붐빔") return "r";
    return "b";
}

// 파일 경로 자동 생성 (한글 안전 인코딩 + 기본 회색 대응)
export function imgPathFor(guNameKo: string, level?: CongestionLevel) {
    const prefix = level ? prefixByLevel(level) : "gr"; // 기본 회색(gr_) 처리
    const encodedName = encodeURIComponent(guNameKo);   // 한글을 안전하게 인코딩
    return `/map-icons/${prefix}_${encodedName}.png`;
}

// 백엔드 요청 본문(각 구 대표좌표)
export function makeBackendRequestBody(datetimeISO?: string) {
    const dt = datetimeISO ?? new Date().toISOString();
    return DISTRICTS.map(d => ({
        latitude: d.center.lat,
        longitude: d.center.lng,
        datetime: dt,
    }));
}