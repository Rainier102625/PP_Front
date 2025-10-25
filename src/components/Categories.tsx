"use client";

type CatItem = { code: string; name: string; icon?: string };

type Props = {
    items: CatItem[];
    value: string | null;
    onChange: (code: string | null) => void;
    className?: string;
};

export default function Categories({ items, value, onChange, className }: Props) {
    return (
        <div className={["relative", className].filter(Boolean).join(" ")}>
            {/* 얇은 가로 스크롤 (스크롤바 보이게) */}
            <div
                role="tablist"
                aria-label="카테고리"
                className="overflow-x-auto whitespace-nowrap px-1"
            >
                <div className="inline-flex gap-1.5 align-top">
                    {items.map((it) => {
                        const active = value === it.code;
                        return (
                            <button
                                key={it.code}
                                type="button"
                                onClick={() => onChange(active ? null : it.code)}
                                className={[
                                    "relative shrink-0 h-9 px-2.5 rounded-lg border text-[13px] leading-none transition select-none",
                                    active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50",
                                ].join(" ")}
                            >
                <span className="inline-flex items-center gap-1">
                  {it.icon && <span aria-hidden>{it.icon}</span>}
                    <span>{it.name}</span>
                </span>

                                {active && (
                                    <span
                                        role="button"
                                        aria-label="카테고리 초기화"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onChange(null);
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center
                               w-5 h-5 rounded-md bg-white/90 text-gray-700 border border-white/60
                               hover:bg-white"
                                        title="초기화"
                                    >
                    <svg width="12" height="12" viewBox="0 0 24 24">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
