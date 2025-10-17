
import { Accommodation, CulturalFacilities, FestivalsPerformancesEvents, Food, LeisureSports, Shopping, TouristAttraction, TravelCourse } from './db';

export type SpotDetails = Accommodation | CulturalFacilities | FestivalsPerformancesEvents | Food | LeisureSports | Shopping | TouristAttraction | TravelCourse;

export interface Spot {
    id: number;
    name: string;
    address: string;
    longitude: number;
    latitude: number;
    category: string;
    distanceMeters: number;
    details?: SpotDetails;
}
