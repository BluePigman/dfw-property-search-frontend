import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchParcels } from "../services/api";
import type { Parcel } from "../types/parcel";
import { login, logout, isAuthenticated } from "../services/auth";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [isAuth] = useState(isAuthenticated());

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [-96.7970, 32.7767], // Dallas
            zoom: 12,
        });

        mapRef.current = map;

        const loadData = async () => {
            try {
                const bounds = map.getBounds();
                if (!bounds) return;
                const newData = await fetchParcels(bounds);

                setParcels(prev => {
                    const existingMap = new Map(prev.map(p => [p.sl_uuid, p]));
                    const filteredNew = newData.filter(p => !existingMap.has(p.sl_uuid));
                    const combined = [...prev, ...filteredNew];
                    return combined.slice(-100);
                });
            } catch (err) {
                console.error("Error fetching parcels:", err);
            }
        };

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
                        <style>
                            .custom-parcel-popup .mapboxgl-popup-close-button {
                                background-color: #3b82f6;
                                color: white;
                                border-radius: 0;
                                width: 22px;
                                height: 22px;
                                padding: 0;
                                line-height: 1;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                right: 0;
                                top: 0;
                                font-size: 22px;
                                border: none;
                                outline: none;
                                box-shadow: none;
                            }
                            .custom-parcel-popup .mapboxgl-popup-close-button:focus {
                                outline: none;
                                box-shadow: none;
                            }
                            .custom-parcel-popup .mapboxgl-popup-close-button:hover {
                                background-color: #ef4444;
                                color: white;
                            }
                            .custom-parcel-popup .mapboxgl-popup-content {
                                padding: 15px 10px 10px 10px;
                            }
                        </style>
                        <div style="color: #333; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0;">${props?.address}</h3>
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

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <div
                ref={mapContainerRef}
                style={{ width: "100%", height: "100%" }}
            />
            <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                zIndex: 1,
                display: "flex",
                gap: "10px"
            }}>
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
