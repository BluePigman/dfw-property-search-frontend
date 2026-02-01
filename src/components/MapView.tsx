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
    const [parcels, setParcels] = useState<ParcelType[]>([]);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        setIsAuth(isAuthenticated());
    }, []);
    const [filters, setFilters] = useState<ParcelFilters>({});
    const filtersRef = useRef<ParcelFilters>(filters);

    // Sync ref with state
    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    useEffect(() => {
        if (isAuth) {
            const loadFilters = async () => {
                try {
                    const saved = await fetchSavedFilters();
                    setFilters(saved);
                } catch (err) {
                    console.error("Error loading filters:", err);
                }
            };
            loadFilters();
        }
    }, [isAuth]);

    const loadData = async () => {
        const map = mapRef.current;
        if (!map) return;

        try {
            const bounds = map.getBounds();
            if (!bounds) return;
            const newData = await fetchParcels(bounds, filtersRef.current);

            setParcels(prev => {
                const center = map.getCenter();
                const existingMap = new Map(prev.map(p => [p.sl_uuid, p]));
                const filteredNew = newData.filter(p => !existingMap.has(p.sl_uuid));
                const combined = [...prev, ...filteredNew];

                // Helper to get a representative point for distance calculation
                const getCoord = (p: ParcelType): [number, number] | null => {
                    const firstGeom = p.geometry.geometries[0];
                    if (!firstGeom) return null;
                    if (firstGeom.type === "Point") return firstGeom.coordinates as [number, number];

                    // For polygons, coordinates is often [ [ [lng, lat], ... ] ]
                    const coords = firstGeom.coordinates as any;
                    if (Array.isArray(coords) && Array.isArray(coords[0])) {
                        if (Array.isArray(coords[0][0])) {
                            return [coords[0][0][0], coords[0][0][1]];
                        }
                        return [coords[0][0], coords[0][1]];
                    }
                    return null;
                };

                return combined
                    .map(p => {
                        const coord = getCoord(p);
                        if (!coord) return { p, d: Infinity };
                        const d = Math.pow(coord[0] - center.lng, 2) + Math.pow(coord[1] - center.lat, 2);
                        return { p, d };
                    })
                    .sort((a, b) => a.d - b.d)
                    .slice(0, 1000)
                    .map(item => item.p);
            });
        } catch (err) {
            console.error("Error fetching parcels:", err);
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [-96.7970, 32.7767], // Dallas
            zoom: 12,
        });

        mapRef.current = map;

        map.on("load", () => {
            loadData();
        });

        map.on("moveend", () => {
            loadData();
        });

        return () => {
            map.remove();
        };
    }, []);

    // Re-trigger load when filters change
    useEffect(() => {
        if (mapRef.current && mapRef.current.isStyleLoaded()) {
            loadData();
        }
    }, [filters]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const features = parcels.flatMap((parcel) =>
            parcel.geometry.geometries.map((geom) => ({
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

        const source = map.getSource("parcels") as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData({
                type: "FeatureCollection",
                features: features,
            });
        } else {
            map.addSource("parcels", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: features,
                },
            });

            // Layer for Polygons
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

            // Layer for Points (Circles)
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

            map.on("click", "parcels-fill", (e) => {
                if (!e.features || e.features.length === 0) return;
                const feature = e.features[0];
                const props = feature.properties;

                new mapboxgl.Popup({
                    offset: 15,
                    className: 'custom-parcel-popup'
                })
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="color: #333; padding: 5px;">
                            <h3 style="margin: 0 0 2px 0;">${props?.address}</h3>
                            <p style="margin: 0 0 8px 0; color: #666; text-transform: capitalize;">${props?.county} County</p>
                            <p style="margin: 0;"><strong>Value:</strong> $${props?.value}</p>
                            ${props?.sqft ? `<p style="margin: 0;"><strong>Sqft:</strong> ${props.sqft}</p>` : ''}
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
        }
    }, [parcels]);

    const handleExport = async () => {
        try {
            await exportParcels(filters);
        } catch (err) {
            console.error("Error exporting parcels:", err);
            alert("Failed to export parcels. Please try again.");
        }
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <div
                ref={mapContainerRef}
                style={{ width: "100%", height: "100%" }}
            />

            <FilterSidebar
                onFilterChange={(newFilters) => {
                    setParcels([]); // Clear map when filters change
                    setFilters(newFilters);
                }}
                initialFilters={filters}
            />

            <div className="top-buttons-container">
                <button
                    onClick={handleExport}
                    style={{
                        background: "#10b981",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#059669"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#10b981"}
                >
                    Export CSV
                </button>
                {isAuth ? (
                    <button
                        onClick={() => logout()}
                        style={{
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                        }}
                    >
                        Logout
                    </button>
                ) : (
                    <button
                        onClick={() => login()}
                        style={{
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                        }}
                    >
                        Login
                    </button>
                )}
            </div>
        </div>
    );
}
