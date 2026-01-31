import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchParcels } from "../services/api";
import type { Parcel } from "../types/parcel";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [parcels, setParcels] = useState<Parcel[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchParcels();
                setParcels(data);
            } catch (err) {
                console.error("Error fetching parcels:", err);
            }
        };
        loadData();
    }, []);

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
            // Process parcels into GeoJSON features
            // Flatten GeometryCollection so we can style Point and Polygon separately
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

            // Add popups on click
            map.on("click", "parcels-fill", (e) => {
                if (!e.features || e.features.length === 0) return;
                const feature = e.features[0];
                const props = feature.properties;

                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="color: #333; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0;">${props?.address}</h3>
                            <p style="margin: 0;"><strong>Value:</strong> $${props?.value}</p>
                            ${props?.sqft ? `<p style="margin: 0;"><strong>Sqft:</strong> ${props.sqft}</p>` : ''}
                        </div>
                    `)
                    .addTo(map);
            });

            // Change cursor on hover
            map.on("mouseenter", "parcels-fill", () => {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "parcels-fill", () => {
                map.getCanvas().style.cursor = "";
            });
        });

        return () => {
            map.remove();
        };
    }, [parcels]);

    return (
        <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100vh" }}
        />
    );
}
