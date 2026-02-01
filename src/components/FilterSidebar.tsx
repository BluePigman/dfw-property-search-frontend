import { useState, useEffect } from "react";
import type { ParcelFilters } from "../services/api";

interface FilterSidebarProps {
    onFilterChange: (filters: ParcelFilters) => void;
    initialFilters?: ParcelFilters;
}

export default function FilterSidebar({ onFilterChange, initialFilters }: FilterSidebarProps) {
    const [filters, setFilters] = useState<ParcelFilters>(initialFilters || {});

    useEffect(() => {
        if (initialFilters) {
            setFilters(initialFilters);
        }
    }, [initialFilters]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value ? Number(value) : undefined };
        setFilters(newFilters);
    };

    const handleApply = () => {
        const isSame = JSON.stringify(filters) === JSON.stringify(initialFilters || {});
        if (isSame) return;

        onFilterChange(filters);
    };

    const handleReset = () => {
        const isEmpty = Object.values(filters).every(v => v === undefined);
        const isAppliedEmpty = Object.values(initialFilters || {}).every(v => v === undefined);

        if (isEmpty && isAppliedEmpty) return;

        const emptyFilters = {};
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    return (
        <div style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "300px",
            backgroundColor: "rgba(31, 41, 55, 0.95)",
            backdropFilter: "blur(10px)",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            color: "white",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>Property Filters</h2>
                <button
                    onClick={handleReset}
                    style={{
                        background: "transparent",
                        color: "#9ca3af",
                        border: "none",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "white"}
                    onMouseOut={(e) => e.currentTarget.style.color = "#9ca3af"}
                >
                    Reset
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "0.875rem", color: "#9ca3af", marginBottom: "8px" }}>Price Range</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="number"
                            name="minPrice"
                            placeholder="Min $"
                            value={filters.minPrice || ""}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #374151", background: "#111827", color: "white" }}
                        />
                        <input
                            type="number"
                            name="maxPrice"
                            placeholder="Max $"
                            value={filters.maxPrice || ""}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #374151", background: "#111827", color: "white" }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "0.875rem", color: "#9ca3af", marginBottom: "8px" }}>Square Footage</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="number"
                            name="minSqft"
                            placeholder="Min Sqft"
                            value={filters.minSqft || ""}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #374151", background: "#111827", color: "white" }}
                        />
                        <input
                            type="number"
                            name="maxSqft"
                            placeholder="Max Sqft"
                            value={filters.maxSqft || ""}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #374151", background: "#111827", color: "white" }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleApply}
                style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
            >
                Apply Filters
            </button>
        </div>
    );
}
