import React from "react";

type Props = {
    width?: number,
    background?: string,
    children: React.ReactNode,
    mode?: string
};

// 레이어 담당 컴포넌트
const AppShell = ({
                      width = 1280,
                      background = "#0e1117",
                      children,
                      mode
                  }: Props) => {

    // 1. <style> 태그를 주입하던 useEffect "완전히 삭제"
    // 2. CSS 변수를 설정하던 useEffect "완전히 삭제"

    return (
        <div
            className="
                w-full            // (모바일 기본) 가로폭 100%
                lg:mx-auto      // (PC) 1024px 이상일 때 중앙 정렬
                h-full
                overflow-hidden
                relative
            "
            style={{
                // 3. Props로 받은 동적 값은 style 속성에 직접 적용
                backgroundColor: background,
                maxWidth: `${width}px`, // (PC) 최대 가로폭을 prop으로 설정
            }}
        >
            {children}
        </div>
    );
};

export default AppShell;