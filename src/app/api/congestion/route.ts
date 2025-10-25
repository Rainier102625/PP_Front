// 혼잡도 프록시 + 더미
import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://localhost:8082";
const MOCK = process.env.MOCK_CONGESTION === "1" || process.env.MOCK_CONGESTION === "true";

type ReqItem = { latitude: number; longitude: number; datetime: string };
type Level = "여유" | "보통" | "붐빔";
type ResItem = ReqItem & { congestionLevel: Level };

// 더미 생성
function seededRandom(seed: number) {
    let t = Math.imul(seed ^ 0x6d2b79f5, 1);
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}
function baseDensity(lat: number, lng: number) {
    const centers = [
        { lat: 37.5663, lng: 126.9779, w: 1.0 }, // 시청
        { lat: 37.4979, lng: 127.0276, w: 1.0 }, // 강남역
        { lat: 37.5600, lng: 126.9855, w: 0.9 }, // 명동
    ];
    let score = 0.3;
    for (const c of centers) {
        const d = Math.hypot(lat - c.lat, (lng - c.lng) * Math.cos((lat * Math.PI) / 180));
        const influence = Math.max(0, 1 - d / 0.05);
        score += influence * c.w * 0.6;
    }
    return Math.min(1, Math.max(0, score));
}
function timeWeight(dt: Date) {
    const h = dt.getHours();
    const day = dt.getDay();
    const weekend = day === 0 || day === 6;
    let w = 0.6;
    if (h >= 7 && h <= 9) w = 0.9;
    if (h >= 11 && h <= 13) w = 1.0;
    if (h >= 17 && h <= 21) w = 1.1;
    if (weekend && h >= 14 && h <= 20) w = 1.2;
    return w;
}
function mockLevel(lat: number, lng: number, dt: Date): Level {
    const base = baseDensity(lat, lng) * timeWeight(dt);
    const seed = Math.round(lat * 1e4) ^ Math.round(lng * 1e4) ^ (dt.getHours() + 31 * dt.getDay());
    const rnd = seededRandom(seed);
    // 3x3 평균
    let acc = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) acc += Math.min(1, Math.max(0, base + (rnd() - 0.5) * 0.2));
    const avg = acc / 9;
    if (avg < 0.35) return "여유";
    if (avg < 0.7) return "보통";
    return "붐빔";
}
async function mockRespond(body: ReqItem[]): Promise<ResItem[]> {
    return (Array.isArray(body) ? body : []).map(b => {
        const dt = new Date(b.datetime ?? Date.now());
        return { ...b, congestionLevel: mockLevel(b.latitude, b.longitude, dt) };
    });
}


// ----------------------------------

export async function POST(req: Request) {
    const body = (await req.json()) as ReqItem[];

    if (MOCK) {
        const data = await mockRespond(body);
        return NextResponse.json(data, { status: 200 });
    }

    try {
        console.log("📤 [Front→Spring] /api/congestion body:", body);
        const r = await fetch(`${BACKEND_BASE}/api/congestion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        console.log("📥 [Spring 응답 상태]:", r.status);

        if (!r.ok) {
            const text = await r.text().catch(() => "");
            console.error("❌ [Spring 에러 응답]:", text);
            return new NextResponse(text || "Upstream error", { status: r.status });
        }

        const data = await r.json();
        console.log("✅ [Spring→Front] 응답:", data);
        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.warn("⚠️ Spring 연결 실패 → 더미로 폴백", err);
        const data = await mockRespond(body);
        return NextResponse.json(data, { status: 200 });
    }
}