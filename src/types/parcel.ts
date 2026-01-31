export interface Parcel {
    sl_uuid: string;
    address: string;
    county: string;
    sqft: number | null;
    total_value: string;
    geometry: {
        type: "GeometryCollection";
        geometries: Array<{
            type: "Point" | "Polygon";
            coordinates: any;
        }>;
    };
}