"use client";

import React, { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";

type Props = {
    open: boolean;
    onClose: () => void;
};

// React.FC 타입을 제거하고 props를 직접 타이핑하는 것을 권장합니다.
const MenuDrawer = ({ open, onClose }: Props) => {

    // [유지] body에 메뉴 열림 상태 표시 (모바일에서 AI 배지 숨김용)
    // 이 기능은 컴포넌트 외부(body)에 영향을 주므로 useEffect가 필요합니다.
    useEffect(() => {
        document.body.classList.toggle("menu-open", open);
        return () => {
            document.body.classList.remove("menu-open");
        };
    }, [open]);

    // [제거] <style> 태그를 주입하던 useEffect는 "완전히 삭제"합니다.
    // 모든 스타일은 Tailwind 클래스로 대체됩니다.

    return (
        // Headless UI의 Transition과 Dialog를 사용해 애니메이션과 접근성 처리
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[1500]" onClose={onClose}>

                {/* 1. Backdrop (배경) */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    {/* 기존: .menu-backdrop -> Tailwind: bg-black/40 */}
                    <div className="fixed inset-0 bg-black/40" />
                </Transition.Child>

                {/* 2. Panel (메뉴 본체) */}
                <div className="fixed inset-0 overflow-hidden">
                    {/* AppShell의 중앙 정렬(lg:max-w-screen-xl lg:mx-auto)과
                        왼쪽 정렬을 맞추기 위한 컨테이너입니다. */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full
                                        w-full lg:max-w-screen-xl lg:mx-auto">

                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="-translate-x-full" // 왼쪽 밖에서
                                enterTo="translate-x-0"     // 안으로
                                leave="transform transition ease-in-out duration-200"
                                leaveFrom="translate-x-0"     // 안에서
                                leaveTo="-translate-x-full" // 왼쪽 밖으로
                            >
                                <Dialog.Panel className="pointer-events-auto bg-white shadow-2xl overflow-y-auto border-r border-gray-200

                                    // [반응형 크기]
                                    // 모바일 (기본): w-[min(82vw,360px)] rounded-r-xl
                                    w-[min(82vw,360px)] rounded-r-xl

                                    // 태블릿 (sm): sm:w-[min(86vw,420px)]
                                    sm:w-[min(86vw,420px)]

                                    // PC (md): md:w-[420px] md:rounded-r-2xl
                                    md:w-[420px] md:rounded-r-2xl
                                ">
                                    {/* --- 헤더 --- */}
                                    <div className="
                                        // 모바일 (기본): scale-90 origin-top-left
                                        p-4 border-b border-gray-100 scale-90 origin-top-left
                                        // PC (md): scale-100
                                        md:scale-100
                                    ">
                                        <Dialog.Title className="
                                            // 모바일 (기본): text-lg
                                            text-lg font-black
                                            // PC (md): text-xl
                                            md:text-xl
                                        ">
                                            안녕하세요!
                                        </Dialog.Title>
                                        <Dialog.Description className="
                                            // 모바일 (기본): text-[13px]
                                            text-gray-500 text-[13px] mt-1
                                            // PC (md): text-sm
                                            md:text-sm
                                        ">
                                            로그인하여 더 많은 기능을 이용하세요
                                        </Dialog.Description>
                                        <div className="flex gap-2.5 mt-3">
                                            <button className="
                                                // 모바일 (기본): text-sm px-3 py-2.5
                                                text-sm px-3 py-2.5 rounded-2xl border border-gray-200 bg-blue-50 font-bold
                                                // PC (md): text-base md:px-4 md:py-3
                                                md:text-base md:px-4 md:py-3
                                            ">
                                                로그인
                                            </button>
                                            <button className="
                                                // 모바일 (기본): text-sm px-3 py-2.5
                                                text-sm px-3 py-2.5 rounded-2xl border border-gray-200 bg-blue-50 font-bold
                                                // PC (md): text-base md:px-4 md:py-3
                                            ">
                                                AI 어시스턴트
                                            </button>
                                        </div>
                                    </div>

                                    {/* --- 섹션 1 --- */}
                                    <div className="px-4 py-3.5 border-b border-gray-100">
                                        <div className="flex items-center gap-2.5 px-1.5 py-2.5 text-[15px] rounded-xl cursor-pointer hover:bg-gray-100 md:text-base md:px-2 md:py-3">즐겨찾기</div>
                                        <div className="flex items-center gap-2.5 px-1.5 py-2.5 text-[15px] rounded-xl cursor-pointer hover:bg-gray-100 md:text-base md:px-2 md:py-3">최근 검색</div>
                                        <div className="flex items-center gap-2.5 px-1.5 py-2.5 text-[15px] rounded-xl cursor-pointer hover:bg-gray-100 md:text-base md:px-2 md:py-3">내 리뷰</div>
                                        <div className="flex items-center gap-2.5 px-1.5 py-2.5 text-[15px] rounded-xl cursor-pointer hover:bg-gray-100 md:text-base md:px-2 md:py-3">오프라인 지도</div>
                                    </div>

                                    {/* --- 섹션 2 --- */}
                                    <div className="px-4 py-3.5 border-b border-gray-100">
                                        <div className="flex items-center gap-2.5 px-1.5 py-2.5 text-[15px] rounded-xl cursor-pointer hover:bg-gray-100 md:text-base md:px-2 md:py-3">앱 공유하기</div>
                                        <div className="flex items-center gap-2.5 px-1.5 py-2.5 text-[15px] rounded-xl cursor-pointer hover:bg-gray-100 md:text-base md:px-2 md:py-3">설정</div>
                                        <div className="flex items-center gap-2.5 px-1.5 py-2.5 text-[15px] rounded-xl cursor-pointer hover:bg-gray-100 md:text-base md:px-2 md:py-3">도움말 및 의견</div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>

            </Dialog>
        </Transition.Root>
    );
};

export default MenuDrawer;