"use client";

import React, { Fragment, useState, useRef, useEffect} from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ChatMessage } from "@/types/chatMessage";
import ReactMarkdown from 'react-markdown';

type Props = {
    open: boolean;
    onClose: () => void;
    onButtonClose: () => void;
    onSubmit: (textOverride?: string) => Promise<void>;
    query: string;
    onQueryChange: (value: string) => void;
    messages: ChatMessage[];
};

const AiAssistantPanel = ({ open, onClose, onButtonClose,onSubmit, query, onQueryChange,messages }: Props) => {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    const handlePillClick = (text: string) => {
        onSubmit(text);
    };

    // 새로운 대화를 받을 때마다 스크롤을 맨 아래로 이동시키기 위한 ref와 useEffect
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]); // 'messages'가 변경될 때마다 이 함수가 실행됩니다.

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[1400]" onClose= {onClose}>
                {/* DW: 현재 지도를 보면서 대화를 하고싶기 때문에 주석처리함*/}
                {/* 1. Backdrop (배경) - 변경 없음 */}
                {/*<Transition.Child*/}
                {/*    as={Fragment}*/}
                {/*    enter="ease-out duration-300"*/}
                {/*    enterFrom="opacity-0"*/}
                {/*    enterTo="opacity-100"*/}
                {/*    leave="ease-in duration-200"*/}
                {/*    leaveFrom="opacity-100"*/}
                {/*    leaveTo="opacity-0"*/}
                {/*>*/}
                {/*    <div className="fixed inset-0 bg-black/40" />*/}
                {/*</Transition.Child>*/}

                {/* 2. Panel을 감싸는 컨테이너 - 변경 없음 */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="
                        pointer-events-none fixed inset-0
                        flex items-end justify-center
                        md:items-start md:justify-center
                    ">
                        <div className="
                            pointer-events-none relative w-full h-full
                            max-w-[1280px]
                        ">

                            {/* [핵심] Dialog.Panel에 flex flex-col 추가, overflow-y-auto 제거 */}
                            <Dialog.Panel className="
                                pointer-events-auto bg-white shadow-2xl
                                absolute flex flex-col /* 👈 [수정] */

                                /* --- 모바일 (기본) --- */
                                bottom-0 left-0 right-0 mx-auto
                                w-[min(720px,96vw)] rounded-t-2xl
                                h-[60vh]
                                max-h-[100vh]

                                /* --- PC (md: 768px 이상) --- */
                                md:top-0 md:right-0 md:bottom-0
                                md:h-full md:max-h-none md:w-[430px]
                                md:rounded-l-2xl md:rounded-t-none
                                md:left-auto md:mx-0
                            ">

                                {/* --- 헤더: [수정] flex-shrink-0 추가 --- */}
                                <div className="
                                    flex-shrink-0 /* 👈 [추가] */
                                    flex items-center justify-between px-3.5 py-3
                                    bg-gradient-to-r from-blue-600 to-purple-500 text-white
                                ">
                                    <Dialog.Title className="flex items-center gap-2.5 font-black">
                                        <div className="w-[26px] h-[26px] grid place-items-center bg-white/20 rounded-lg">👜</div>
                                        AI 어시스턴트
                                    </Dialog.Title>
                                    <button className="border-none text-white rounded-lg
                                            p-1.5 cursor-pointer"
                                            onClick={onButtonClose}>
                                        ✕
                                    </button>
                                </div>

                                {/* --- [수정] 대화 내용 (스크롤 영역) --- */}
                                <div
                                    ref={scrollContainerRef}
                                    className="
                                    flex-1 overflow-y-auto
                                    flex flex-col /*
                                    p-3.5 gap-2.5
                                ">
                                    {messages.map((message) => {
                                        // 1. 만약 'recommendation' 타입이면 -> 버튼 렌더링
                                        if (message.recommendation) {
                                            return (
                                                <div key={message.id} className="flex gap-2 flex-wrap">
                                                    <button
                                                        className="px-2 py-2 rounded-xl bg-gradient-to-r from-blue-600
                                                        to-purple-500 text-white min-w-[100px] font-black border
                                                        border-blue-200 cursor-pointer self-start"
                                                        onClick={() => handlePillClick(message.recommendation!)}
                                                    >
                                                        {message.recommendation}
                                                    </button>
                                                </div>
                                            );
                                        }

                                        // 2. 'text' 타입이면 -> 일반 메시지 박스 렌더링
                                        if (message.text) {
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={
                                                    `flex gap-2 flex-wrap px-2 py-2 rounded-xl 
                                                    min-w-[100px] max-w-[90%] font-bold
                                                    ${message.sender === 'user'
                                                        ? 'self-end bg-blue-500 text-white' // 👈 유저 메시지 (오른쪽)
                                                        : 'self-start bg-blue-100 text-blue-900' // 👈 AI 메시지 (왼쪽)
                                                    }`}
                                                >
                                                    <ReactMarkdown>
                                                        {message.text}
                                                    </ReactMarkdown>
                                                </div>
                                            );}
                                        return null; // 혹시 모를 예외 처리
                                    })}
                                </div>

                                {/* --- [수정] 입력창 (하단 고정) --- */}
                                <form
                                    className="
                                        flex-shrink-0 /* 👈 [추가] */
                                        flex gap-2 items-center
                                        p-3.5 border-t border-gray-200 /* 👈 [추가] 위쪽 테두리, 패딩 */
                                    "
                                    onSubmit={handleSubmit}
                                >
                                    <input
                                        placeholder="메시지를 입력하세요"
                                        className="flex-1 h-[42px] rounded-xl border border-gray-200 px-3"
                                        value={query}
                                        onChange={(e) => onQueryChange(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="h-[42px] w-12 rounded-xl border-none bg-gradient-to-r from-blue-600 to-purple-500 text-white font-black cursor-pointer"
                                        aria-label="전송"
                                    >
                                        ➤
                                    </button>
                                </form>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Transition.Child>
            </Dialog>
        </Transition.Root>
    );
};

export default AiAssistantPanel;