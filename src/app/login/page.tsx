"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        // TODO: Implement actual login logic
        console.log("Login attempt with:", { id, password });
        alert("로그인 기능은 아직 구현되지 않았습니다.");
    };

    return (
        <main className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">로그인</h1>
                    <p className="text-gray-500">계속하려면 로그인하세요.</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="id" className="text-sm font-medium text-gray-700">
                            아이디
                        </label>
                        <Input
                            id="id"
                            type="text"
                            placeholder="아이디를 입력하세요"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-gray-700"
                        >
                            비밀번호
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                </div>
                <Button onClick={handleLogin} className="w-full">
                    로그인
                </Button>
                <div className="mt-4 text-center text-sm">
                    계정이 없으신가요?{" "}
                    <Link href="/register" className="text-blue-500 hover:underline">
                        회원가입
                    </Link>
                </div>
                <div className="text-center mt-2">
                    <Link href="/" className="text-sm text-gray-500 hover:underline">
                        메인 페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </main>
    );
}
