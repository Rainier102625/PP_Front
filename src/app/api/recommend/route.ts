// src/app/api/recommend/route.ts
// 추천 API 프록시 — 클라이언트에 외부 URL 노출 방지

import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://localhost:8082";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    try {
        const r = await fetch(`${BACKEND_BASE}/api/recommend/?${query}`, {
            headers: { "Content-Type": "application/json" },
        });

        if (!r.ok) {
            const text = await r.text().catch(() => "");
            return new NextResponse(text || "Upstream error", { status: r.status });
        }

        const data = await r.json();
        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error("추천 API 프록시 오류:", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
