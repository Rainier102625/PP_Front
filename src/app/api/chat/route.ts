// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
// 1. [수정] OpenAI 임포트 제거, GoogleGenAI와 Content만 남김
import { GoogleGenAI, Content } from '@google/genai';
import { ChatMessage } from "@/types/chatMessage"; // (경로는 그대로)

// 2. [수정] Google GenAI 클라이언트 초기화
//    - 클래스 이름은 'GoogleGenerativeAI' 입니다.
//    - apiKey에서 따옴표(" ")를 제거해야 환경 변수 값이 들어갑니다.

const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});

// 3. POST 요청 핸들러
export async function POST(req: NextRequest) {
    try {
        // 4. 클라이언트로부터 'messages' 배열 받기

        const body = await req.json();
        const messagesFromClient: ChatMessage[] = body.messages;

        // 6. [수정] 모델을 가져오는 것이 아니라, 마지막 메시지를 분리 (채팅 준비)
        const currentMessage = messagesFromClient.pop();

        if (!currentMessage || currentMessage.sender !== 'user' || !currentMessage.text) {
            return NextResponse.json(
                { error: "마지막 메시지가 사용자 프롬프트가 아닙니다." },
                { status: 400 }
            );
        }

        // Gemini 'history' 형식으로 변환
        const history: Content[] = messagesFromClient
            .filter(msg => msg.text)
            .map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text! }],
        }));

        // 8. [수정] genAI.chats.create()를 사용해 채팅 세션 시작
        const chat = genAI.chats.create({
            model: "gemini-2.5-flash", // 모델 이름을 여기에 지정
            history: history,
        });

        // 9. [수정] .sendMessage()에 객체 { message: ... } 형태로 전송
        const result = await chat.sendMessage({
            message: currentMessage.text,
        });

        // 10. [수정] 응답 텍스트를 result.text에서 바로 추출
        const aiResponseText = result.text;

        if (!aiResponseText) {
            throw new Error("No response from AI");
        }

        // 11. 클라이언트에 AI 응답 전송 (동일)
        return NextResponse.json({ text: aiResponseText });

    } catch (error) {
        // [수정] 에러 메시지를 Gemini에 맞게 변경
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "AI 응답 생성에 실패했습니다." },
            { status: 500 }
        );
    }
}