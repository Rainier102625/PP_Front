"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegisterPage() {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleRegister = () => {
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        // TODO: Implement actual registration logic
        console.log("Registration attempt with:", { id, password });
        alert("회원가입 기능은 아직 구현되지 않았습니다.");
    };

    return (
        <main className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">회원가입</h1>
                    <p className="text-gray-500">새 계정을 만드세요.</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="id" className="text-sm font-medium text-gray-700">
                            아이디
                        </label>
                        <Input
                            id="id"
                            type="text"
                            placeholder="사용할 아이디를 입력하세요"
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
                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="text-sm font-medium text-gray-700"
                        >
                            비밀번호 확인
                        </label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                </div>
                <Button onClick={handleRegister} className="w-full">
                    회원가입
                </Button>
                <div className="mt-4 text-center text-sm">
                    이미 계정이 있으신가요?{" "}
                    <Link href="/login" className="text-blue-500 hover:underline">
                        로그인
                    </Link>
                </div>
            </div>
        </main>
    );
}
