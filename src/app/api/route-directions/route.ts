// src/app/api/route-directions/route.ts
// 길찾기 API 프록시 — 클라이언트에 외부 URL 노출 방지

import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://localhost:8082";

export async function POST(req: Request) {
    const body = await req.json();

    try {
        const r = await fetch(`${BACKEND_BASE}/api/route`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!r.ok) {
            const text = await r.text().catch(() => "");
            return new NextResponse(text || "Upstream error", { status: r.status });
        }

        const data = await r.json();
        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error("길찾기 API 프록시 오류:", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
