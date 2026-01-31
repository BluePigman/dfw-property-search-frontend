import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            center: [-96.7970, 32.7767], // Dallas
            zoom: 9,
        });

        return () => {
            map.remove();
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100vh" }}
        />
    );
}
