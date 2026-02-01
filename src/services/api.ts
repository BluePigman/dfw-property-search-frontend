const VITE_API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

import type { Parcel } from "../types/parcel";
import { getToken } from "./auth";

export async function fetchParcels(bounds?: mapboxgl.LngLatBounds): Promise<Parcel[]> {
    const token = getToken();
    const headers: HeadersInit = {};

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = new URL(`${VITE_API_BASE_URL}/parcels`);
    if (bounds) {
        url.searchParams.set("west", bounds.getWest().toString());
        url.searchParams.set("east", bounds.getEast().toString());
        url.searchParams.set("south", bounds.getSouth().toString());
        url.searchParams.set("north", bounds.getNorth().toString());
    }

    const response = await fetch(url.toString(), {
        headers
    });

    if (!response.ok) {
        throw new Error("Failed to fetch parcels");
    }
    return response.json();
}