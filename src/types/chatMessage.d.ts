
export interface ChatMessage {
    id: string | number;
    sender: 'user' | 'ai'; // 메시지를 보낸 주체 (스타일링에 필수)
    text?: string;
    recommendation?: string;
}