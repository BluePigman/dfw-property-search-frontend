const VITE_API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

import type { Parcel } from "../types/parcel";

export async function fetchParcels(): Promise<Parcel[]> {
    const response = await fetch(`${VITE_API_BASE_URL}/parcels`);
    if (!response.ok) {
        throw new Error("Failed to fetch parcels");
    }
    return response.json();
}