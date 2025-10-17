
export interface Accommodation {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    size: string;
    capacity: string;
    room_count: number;
    room_type: string;
    parking_availability: string;
    cooking_availability: string;
    check_in_time: string;
    check_out_time: string;
    reservation_info: string;
    reservation_page: string;
    pickup_service: string;
    fnb_area: string;
    amenities: string;
    seminar_room: string;
    sports_facility: string;
    sauna_room: string;
    beauty_facility: string;
    karaoke_room: string;
    barbecue_area: string;
    campfire_area: string;
    bicycle_rack: string;
    fitness_center: string;
    public_pc_room: string;
    public_shower_room: string;
    detailed_info: string;
    refund_policy: string;
}

export interface CulturalFacilities {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    inquiry_and_info: string;
    size: string;
    capacity: string;
    operating_hours: string;
    closing_day: string;
    usage_fee: string;
    discount_info: string;
    tour_duration: string;
    parking_availability: string;
    parking_fee: string;
    stroller_rental: string;
    pets_allowed: string;
    credit_card_accepted: string;
    detailed_info: string;
}

export interface FestivalsPerformancesEvents {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    inquiry_and_info: string;
    organizer: string;
    supervisor_info: string;
    supervisor_contact: string;
    event_start_date: string;
    event_end_date: string;
    performance_time: string;
    event_venue: string;
    event_homepage: string;
    usage_fee: string;
    discount_info: string;
    tour_duration: string;
    viewing_age_limit: string;
    ticket_office: string;
    venue_location_guide: string;
    side_events: string;
    program: string;
    detailed_info: string;
}

export interface Food {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    inquiry_and_info: string;
    size: string;
    table_count: number;
    parking_availability: string;
    business_hours: string;
    closing_day: string;
    signature_menu: string;
    menu_items: string;
    smoking_policy: string;
    credit_card_accepted: string;
    takeout_available: string;
    reservation_info: string;
    restroom: string;
    license_number: string;
}

export interface LeisureSports {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    inquiry_and_info: string;
    size: string;
    capacity: string;
    closing_day: string;
    operating_period: string;
    operating_hours: string;
    usage_fee: string;
    target_age: string;
    parking_availability: string;
    stroller_rental: string;
    pets_allowed: string;
    credit_card_accepted: string;
    detailed_info: string;
}

export interface Shopping {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    inquiry_and_info: string;
    size: string;
    sales_items: string;
    opening_date: string;
    business_hours: string;
    closing_day: string;
    store_info: string;
    parking_availability: string;
    stroller_rental: string;
    pets_allowed: string;
    credit_card_accepted: string;
    restroom: string;
    detailed_info: string;
}

export interface TouristAttraction {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    inquiry_and_info: string;
    closing_day: string;
    program_info: string;
    target_age: string;
    capacity: string;
    operating_hours: string;
    parking_availability: string;
    stroller_rental: string;
    pets_allowed: string;
    credit_card_accepted: string;
    detailed_info: string;
    size: string;
}

export interface TravelCourse {
    id: number;
    name: string;
    category: string;
    postal_code: string;
    manager: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    other_info: string;
    inquiry_and_info: string;
    total_distance: string;
    duration: string;
    detailed_info: string;
}

export interface TrainData {
    id: number;
    line: string;
    station_code: string;
    station_name: string;
    weekday_weekend: string;
    direction: string;
    is_express: string;
    train_code: string;
    arrival_time: string;
    departure_time: string;
    departure_station: string;
    arrival_station: string;
}

export interface StationInfo {
    station_id: string;
    station_name: string;
    line_number: string;
    latitude: number;
    longitude: number;
}
