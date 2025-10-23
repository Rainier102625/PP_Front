"use client";

import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

type Props = {
    open: boolean;
    onClose: () => void;
    onSearch: () => void;
    query: string;
    onQueryChange: (value: string) => void;
};

const AiAssistantPanel = ({ open, onClose, onSearch, query, onQueryChange }: Props) => {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    const handlePillClick = (text: string) => {
        onQueryChange(text);
        onSearch();
    };

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[1400]" onClose={onClose}>

                {/* 1. Backdrop (배경) - 변경 없음 */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40" />
                </Transition.Child>

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
                                max-h-[100vh]

                                /* --- PC (md: 768px 이상) --- */
                                md:top-0 md:right-0 md:bottom-0
                                md:h-full md:max-h-none md:w-[400px]
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
                                    <button className="border-none text-white rounded-lg p-1.5 cursor-pointer" onClick={onClose}>✕</button>
                                </div>

                                {/* --- [수정] 대화 내용 (스크롤 영역) --- */}
                                <div className="
                                    flex-1 overflow-y-auto /* 👈 [추가] 남은 공간 채우기 + 스크롤 */
                                    flex flex-col-reverse /* 👈 [추가] 채팅처럼 아래부터 쌓기 */
                                    p-3.5 gap-2.5
                                ">
                                    {/* HTML 순서를 거꾸로 배치 (flex-col-reverse 때문) */}

                                    {/* 2. 추천 질문 */}
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            className="px-2 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-500 text-white min-w-[100px] font-black border border-blue-200 cursor-pointer self-start"
                                            onClick={() => handlePillClick("강남역 주변에 카페 찾아줘")}
                                        >
                                            강남역 주변에 카페 찾아줘
                                        </button>
                                    </div>

                                    {/* 1. (가짜) 환영 메시지 */}
                                    <div className="flex gap-2 flex-wrap px-2 py-2 rounded-xl min-w-[100px] max-w-[90%] bg-blue-100 text-blue-900 font-bold self-start">
                                        추천 질문을 눌러 시작해보세요!
                                    </div>
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