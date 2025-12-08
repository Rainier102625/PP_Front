import MapContainer from "@/components/MapContainer";

export default function Home() {
    // 3. 'page.tsx'는 AppShell과 자식 컴포넌트만 렌더링합니다.
    //    (모든 state와 로직은 삭제)
    return (
        <MapContainer/>
    );
}