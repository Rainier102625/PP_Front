import { useKakaoLoader as useKakaoLoaderOrigin } from "react-kakao-maps-sdk"
import {ErrorEvent} from "undici-types";

export default function useKakaoLoader(loading: boolean, error: ErrorEvent) {
    useKakaoLoaderOrigin({
        appkey: process.env.KAKAO_JAVASCRIPT_KEY || "",
        libraries: ["clusterer", "drawing", "services"]
        // services = 장소 검색 라이브러리(Places)
    })
}