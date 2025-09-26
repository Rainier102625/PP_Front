"use client";

import { Button } from "@/components/ui/button";
import { X, Loader2, Phone, Clock, Info, ParkingCircle, Utensils, PartyPopper, Bike, BedDouble, ShoppingCart, Star, Wallet, Baby, Dog, Users, Map } from "lucide-react";
import { Spot } from "@/types/spot";

// 상세 정보 API 응답 타입
interface DetailInfo {
    contenttypeid?: string;
    [key: string]: any;
}

interface DetailPanelProps {
    spot: Spot | null;
    details: DetailInfo | null;
    isLoading: boolean;
    onClose: () => void;
    onGetDirections: (spot: Spot) => void; // 길찾기 함수 prop 추가
}

// 각 라벨에 맞는 아이콘을 반환하는 헬퍼 함수
const getIconForLabel = (label: string) => {
    if (label.includes("문의") || label.includes("안내") || label.includes("연락처")) return <Phone size={20} />;
    if (label.includes("쉬는 날")) return <Clock size={20} />;
    if (label.includes("시간") || label.includes("기간")) return <Clock size={20} />;
    if (label.includes("주차")) return <ParkingCircle size={20} />;
    if (label.includes("메뉴")) return <Utensils size={20} />;
    if (label.includes("행사") || label.includes("축제")) return <PartyPopper size={20} />;
    if (label.includes("레포츠")) return <Bike size={20} />;
    if (label.includes("숙박") || label.includes("객실")) return <BedDouble size={20} />;
    if (label.includes("쇼핑")) return <ShoppingCart size={20} />;
    if (label.includes("요금")) return <Wallet size={20} />;
    if (label.includes("유모차")) return <Baby size={20} />;
    if (label.includes("반려동물")) return <Dog size={20} />;
    if (label.includes("연령")) return <Users size={20} />;
    return <Info size={20} />;
};

// contenttypeid에 따라 표시할 상세 정보를 객체로 가공하는 함수
const getDisplayableDetails = (details: DetailInfo | null) => {
    if (!details || !details.contenttypeid) return {};

    const { contenttypeid } = details;
    let fields = {};

    switch (contenttypeid) {
        case '12': // 관광지
            fields = {
                '문의 및 안내': details.infocenter,
                '쉬는 날': details.restdate,
                '이용 시간': details.usetime,
                '주차시설': details.parking,
                '체험 안내': details.expguide,
                '입장 가능 연령': details.expagerange,
                '유모차 대여': details.chkbabycarriage,
                '반려동물 동반': details.chkpet,
            };
            break;
        case '14': // 문화시설
            fields = {
                '문의 및 안내': details.infocenterculture,
                '쉬는 날': details.restdateculture,
                '이용 시간': details.usetimeculture,
                '이용 요금': details.usefee,
                '주차시설': details.parkingculture,
                '유모차 대여': details.chkbabycarriageculture,
                '반려동물 동반': details.chkpetculture,
            };
            break;
        case '15': // 행사/공연/축제
            fields = {
                '행사 장소': details.eventplace,
                '행사 기간': (details.eventstartdate && details.eventenddate) ? `${details.eventstartdate} ~ ${details.eventenddate}` : undefined,
                '공연 시간': details.playtime,
                '이용 요금': details.usetimefestival,
                '소요 시간': details.spendtimefestival,
                '연령 제한': details.agelimit,
                '주최': details.sponsor1,
                '연락처': details.sponsor1tel,
            };
            break;
        case '25': // 여행코스
            fields = {
                '코스 총 거리': details.distance,
                '소요 시간': details.taketime,
                '코스 테마': details.theme,
                '코스 개요': details.schedule,
                '문의 및 안내': details.infocentertourcourse,
            };
            break;
        case '28': // 레포츠
            fields = {
                '문의 및 안내': details.infocenterleports,
                '운영 기간': details.openperiod,
                '이용 시간': details.usetimeleports,
                '쉬는 날': details.restdateleports,
                '입장료/이용요금': details.usefeeleports,
                '수용 인원': details.accomcountleports,
                '주차시설': details.parkingleports,
                '주차 요금': details.parkingfeeleports,
                '신용카드': details.chkcreditcardleports,
                '유모차 대여': details.chkbabycarriageleports,
                '반려동물 동반': details.chkpetleports,
            };
            break;
        case '32': // 숙박
            fields = {
                '문의 및 안내': details.infocenterlodging,
                '예약 안내': details.reservationlodging || details.reservationurl,
                '체크인': details.checkintime,
                '체크아웃': details.checkouttime,
                '총 객실 수': details.roomcount,
        '수용 가능인원': details.accomcountlodging,
                '객실 형태': details.roomtype,
                '취사 가능': details.chkcooking,
                '주차시설': details.parkinglodging,
                '픽업 서비스': details.pickup,
                '부대시설': details.subfacility,
                '환불 규정': details.refundregulation,
            };
            break;
        case '38': // 쇼핑
            fields = {
                '문의 및 안내': details.infocentershopping,
                '영업 시간': details.opentime,
                '쉬는 날': details.restdateshopping,
                '개장일': details.fairday,
                '판매 품목': details.saleitem,
                '주차시설': details.parkingshopping,
                '신용카드': details.chkcreditcardshopping,
                '유모차 대여': details.chkbabycarriageshopping,
                '반려동물 동반': details.chkpetshopping,
                '안내': details.shopguide,
            };
            break;
        case '39': // 음식점
            fields = {
                '문의 및 안내': details.infocenterfood,
                '영업 시간': details.opentimefood,
                '쉬는 날': details.restdatefood,
                '대표 메뉴': details.firstmenu,
                '취급 메뉴': details.treatmenu,
                '예약 안내': details.reservationfood,
                '포장 가능': details.packing,
                '금연/흡연': details.smoking,
                '주차시설': details.parkingfood,
                '신용카드': details.chkcreditcardfood,
                '어린이 놀이방': details.kidsfacility,
            };
            break;
        default:
            fields = {
                '문의 및 안내': details.infocenter,
                '쉬는 날': details.restdate,
                '이용 시간': details.usetime,
            };
    }

    // 비어있지 않은 값만 필터링하여 반환
    return Object.entries(fields).reduce((acc, [key, value]) => {
        if (value && String(value).trim() && String(value).trim() !== "0" && String(value).trim() !== "없음") {
            if(key === '주차시설' && value === '1') acc[key] = '가능';
            else acc[key] = String(value);
        }
        return acc;
    }, {} as Record<string, string>);
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => {
    // 값의 URL 여부를 간단히 확인
    const isUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));

    return (
        <div className="flex items-start space-x-3 py-3 border-b last:border-b-0">
            <div className="flex-shrink-0 w-6 h-6 text-gray-500 mt-1">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-600">{label}</p>
                {isUrl ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                        {value}
                    </a>
                ) : (
                    <p className="text-gray-800 text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: value.replace(/<br\s*\/?\?>/gi, "\n") }} />
                )}
            </div>
        </div>
    );
};

export function DetailPanel({ spot, details, isLoading, onClose, onGetDirections }: DetailPanelProps) {
    const displayableDetails = getDisplayableDetails(details);

    return (
        <aside className="w-[380px] h-full bg-white border-r border-gray-200 flex flex-col p-4 shadow-lg">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-800">상세 정보</h1>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex-grow overflow-y-auto min-h-0">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p>상세 정보를 불러오는 중...</p>
                        </div>
                    </div>
                ) : spot && details ? (
                    <div className="divide-y divide-gray-100">
                        <div className="pb-2">
                            <h2 className="text-xl font-bold text-gray-900 pt-2">{spot.title}</h2>
                            <p className="text-sm text-gray-500 ">{spot.addr1}</p>
                        </div>
                        {Object.keys(displayableDetails).length > 0 ? (
                             Object.entries(displayableDetails).map(([label, value]) => (
                                <DetailItem key={label} icon={getIconForLabel(label)} label={label} value={value} />
                            ))
                        ) : (
                            <div className="pt-10 text-center text-sm text-gray-500">표시할 상세 정보가 없습니다.</div>
                        )}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-gray-500">상세 정보가 없습니다.</p>
                    </div>
                )}
            </div>
            
            {/* 길찾기 버튼 추가 */}
            {spot && (
                <div className="p-4 border-t flex-shrink-0">
                    <Button className="w-full h-12 text-lg" onClick={() => onGetDirections(spot)}>
                        <Map size={20} className="mr-2" />
                        대중교통 길찾기
                    </Button>
                </div>
            )}
        </aside>
    );
}
