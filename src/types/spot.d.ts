
export interface Spot {
    contentId?: string;
    name: string;
    address: string;
    firstImage: string | null;
    distanceMeters: number;
    mapX: number;
    mapY: number;
}
