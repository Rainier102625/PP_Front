
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");
    const contentTypeId = searchParams.get("contentTypeId");

    if (!contentId || !contentTypeId) {
        return NextResponse.json({ error: "contentId and contentTypeId are required" }, { status: 400 });
    }

    const TOUR_API_KEY = process.env.TOUR_API_KEY;

    if (!TOUR_API_KEY) {
        console.error("Tour API key is not set");
        return NextResponse.json(
            { error: "Server configuration error: Tour API key is missing" },
            { status: 500 }
        );
    }

    const API_URL = `https://apis.data.go.kr/B551011/KorService2/detailIntro2`;
    const queryParams = new URLSearchParams({
        serviceKey: TOUR_API_KEY, // 파라미터 이름 수정
        contentId,
        contentTypeId,
        MobileOS: "web", // 값 수정
        MobileApp: "test", // 값 수정
        _type: "json",
    });

    try {
        const response = await fetch(`${API_URL}?${queryParams.toString()}`);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Tour API error: ${response.status}`, errorBody);
            return NextResponse.json(
                { error: "Failed to fetch from Tour API", details: errorBody },
                { status: response.status }
            );
        }

        const data = await response.json();
        const item = data?.response?.body?.items?.item;

        if (!item) {
             return NextResponse.json({ error: "No details found for the given contentId" }, { status: 404 });
        }

        return NextResponse.json(item);

    } catch (error) {
        console.error("Internal Server Error fetching from Tour API:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
