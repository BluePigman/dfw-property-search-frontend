const VITE_API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

import type { Parcel } from "../types/parcel";
import { getToken } from "./auth";

export interface ParcelFilters {
    minPrice?: number;
    maxPrice?: number;
    minSqft?: number;
    maxSqft?: number;
}

export async function fetchParcels(bounds?: mapboxgl.LngLatBounds, filters?: ParcelFilters): Promise<Parcel[]> {
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

    if (filters) {
        if (filters.minPrice) url.searchParams.set("minPrice", filters.minPrice.toString());
        if (filters.maxPrice) url.searchParams.set("maxPrice", filters.maxPrice.toString());
        if (filters.minSqft) url.searchParams.set("minSqft", filters.minSqft.toString());
        if (filters.maxSqft) url.searchParams.set("maxSqft", filters.maxSqft.toString());
    }

    const response = await fetch(url.toString(), {
        headers
    });

    if (!response.ok) {
        throw new Error("Failed to fetch parcels");
    }
    return response.json();
}

export async function exportParcels(filters?: ParcelFilters): Promise<void> {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = new URL(`${VITE_API_BASE_URL}/parcels/export`);
    if (filters) {
        if (filters.minPrice) url.searchParams.set("minPrice", filters.minPrice.toString());
        if (filters.maxPrice) url.searchParams.set("maxPrice", filters.maxPrice.toString());
        if (filters.minSqft) url.searchParams.set("minSqft", filters.minSqft.toString());
        if (filters.maxSqft) url.searchParams.set("maxSqft", filters.maxSqft.toString());
    }

    const response = await fetch(url.toString(), {
        headers
    });

    if (!response.ok) {
        throw new Error("Failed to export parcels");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "parcels.csv");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
}

export async function fetchSavedFilters(): Promise<ParcelFilters> {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${VITE_API_BASE_URL}/parcels/filters`, {
        headers
    });

    if (!response.ok) {
        throw new Error("Failed to fetch saved filters");
    }
    return response.json();
}