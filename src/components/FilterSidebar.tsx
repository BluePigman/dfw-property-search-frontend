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

    const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setIsOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {/* Mobile FAB */}
            <button
                className="mobile-fab"
                onClick={() => setIsOpen(true)}
                style={{ display: isOpen ? "none" : "flex" }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                <span>Filters</span>
            </button>

            <div className="sidebar-container" style={{
                display: isOpen ? "block" : "none",
                pointerEvents: isOpen ? "auto" : "none"
            }}>
                <div style={{
                    backgroundColor: "rgba(31, 41, 55, 0.98)",
                    backdropFilter: "blur(12px)",
                    padding: window.innerWidth < 768 ? "20px" : "24px",
                    borderRadius: "16px",
                    boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.5)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    position: "relative"
                }}>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: "absolute",
                            top: "15px",
                            right: "15px",
                            display: window.innerWidth < 768 ? "flex" : "none",
                            background: "rgba(255,255,255,0.1)",
                            color: "white",
                            width: "30px",
                            height: "30px",
                            borderRadius: "15px",
                            border: "none",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0
                        }}
                    >
                        ✕
                    </button>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: window.innerWidth < 768 ? "35px" : "0" }}>
                        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.01em" }}>Filters</h2>
                        <button
                            onClick={handleReset}
                            style={{
                                background: "transparent",
                                color: "#3b82f6",
                                border: "none",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                padding: 0
                            }}
                        >
                            Reset
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#9ca3af", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Price Range</label>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <input
                                    type="number"
                                    name="minPrice"
                                    placeholder="Min $"
                                    value={filters.minPrice || ""}
                                    onChange={handleChange}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #374151", background: "#0f172a", color: "white", fontSize: "0.9rem" }}
                                />
                                <input
                                    type="number"
                                    name="maxPrice"
                                    placeholder="Max $"
                                    value={filters.maxPrice || ""}
                                    onChange={handleChange}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #374151", background: "#0f172a", color: "white", fontSize: "0.9rem" }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#9ca3af", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sq Footage</label>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <input
                                    type="number"
                                    name="minSqft"
                                    placeholder="Min"
                                    value={filters.minSqft || ""}
                                    onChange={handleChange}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #374151", background: "#0f172a", color: "white", fontSize: "0.9rem" }}
                                />
                                <input
                                    type="number"
                                    name="maxSqft"
                                    placeholder="Max"
                                    value={filters.maxSqft || ""}
                                    onChange={handleChange}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #374151", background: "#0f172a", color: "white", fontSize: "0.9rem" }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            handleApply();
                            if (window.innerWidth < 768) setIsOpen(false);
                        }}
                        style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            padding: "14px",
                            borderRadius: "12px",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                            marginTop: "5px"
                        }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
}
