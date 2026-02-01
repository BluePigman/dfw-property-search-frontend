import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchParcels, fetchSavedFilters, exportParcels } from "../services/api";
import type { ParcelFilters } from "../services/api";
import type { Parcel as ParcelType } from "../types/parcel";
import { login, logout, isAuthenticated } from "../services/auth";
import FilterSidebar from "./FilterSidebar";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const requestIdRef = useRef(0);

    const [parcels, setParcels] = useState<ParcelType[]>([]);
    const [isAuth, setIsAuth] = useState(false);
    const [filters, setFilters] = useState<ParcelFilters>({});
    const filtersRef = useRef<ParcelFilters>(filters);

    useEffect(() => {
        setIsAuth(isAuthenticated());
    }, []);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    useEffect(() => {
        if (!isAuth) return;

        const loadFilters = async () => {
            try {
                const saved = await fetchSavedFilters();
                setFilters(saved);
            } catch (err) {
                console.error("Error loading filters:", err);
            }
        };

        loadFilters();
    }, [isAuth]);

    const loadData = async () => {
        const map = mapRef.current;
        if (!map) return;

        const requestId = ++requestIdRef.current;

        try {
            const bounds = map.getBounds();
            if (!bounds) return;

            const newData = await fetchParcels(bounds, filtersRef.current);

            // Ignore stale responses
            if (requestId !== requestIdRef.current) return;

            setParcels(newData);
        } catch (err) {
            console.error("Error fetching parcels:", err);
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [-96.7970, 32.7767],
            zoom: 12,
        });

        mapRef.current = map;

        map.on("load", loadData);

        map.on("movestart", () => {
            setParcels([]);
        });

        map.on("moveend", loadData);

        return () => {
            map.remove();
        };
    }, []);

    useEffect(() => {
        if (mapRef.current?.isStyleLoaded()) {
            loadData();
        }
    }, [filters]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const features = parcels.flatMap(parcel =>
            parcel.geometry.geometries.map(geom => ({
                type: "Feature" as const,
                geometry: geom as any,
                properties: {
                    id: parcel.sl_uuid,
                    address: parcel.address,
                    county: parcel.county,
                    value: parcel.total_value,
                    sqft: parcel.sqft,
                },
            }))
        );

        const source = map.getSource("parcels") as mapboxgl.GeoJSONSource | undefined;

        if (source) {
            source.setData({
                type: "FeatureCollection",
                features,
            });
            return;
        }

        map.addSource("parcels", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features,
            },
        });

        map.addLayer({
            id: "parcels-fill",
            type: "fill",
            source: "parcels",
            paint: {
                "fill-color": "#4a90e2",
                "fill-opacity": 0.3,
            },
            filter: ["==", "$type", "Polygon"],
        });

        map.addLayer({
            id: "parcels-outline",
            type: "line",
            source: "parcels",
            paint: {
                "line-color": "#4a90e2",
                "line-width": 2,
            },
            filter: ["==", "$type", "Polygon"],
        });

        map.addLayer({
            id: "parcels-point",
            type: "circle",
            source: "parcels",
            paint: {
                "circle-radius": 5,
                "circle-color": "#f5a623",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#fff",
            },
            filter: ["==", "$type", "Point"],
        });

        map.on("click", "parcels-fill", e => {
            if (!e.features?.length) return;
            const props = e.features[0].properties;

            new mapboxgl.Popup({ offset: 15, className: "custom-parcel-popup" })
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="color:#333;padding:5px">
                        <h3 style="margin:0 0 2px">${props?.address}</h3>
                        <p style="margin:0 0 8px;color:#666">${props?.county} County</p>
                        <p style="margin:0"><strong>Value:</strong> $${props?.value}</p>
                        ${props?.sqft ? `<p style="margin:0"><strong>Sqft:</strong> ${props.sqft}</p>` : ""}
                    </div>
                `)
                .addTo(map);
        });

        map.on("mouseenter", "parcels-fill", () => {
            map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "parcels-fill", () => {
            map.getCanvas().style.cursor = "";
        });
    }, [parcels]);

    const handleExport = async () => {
        try {
            await exportParcels(filters);
        } catch {
            alert("Failed to export parcels.");
        }
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

            <FilterSidebar
                initialFilters={filters}
                onFilterChange={newFilters => {
                    setParcels([]);
                    setFilters(newFilters);
                }}
            />

            <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 10 }}>
                <button onClick={handleExport}>Export CSV</button>
                {isAuth ? (
                    <button onClick={logout}>Logout</button>
                ) : (
                    <button onClick={login}>Login</button>
                )}
            </div>
        </div>
    );
}
