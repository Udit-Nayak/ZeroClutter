import React from "react";

function FilterPanel({ filters, onChange, onApply }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        name="name"
        placeholder="Filter by name"
        value={filters.name}
        onChange={onChange}
        style={{ marginRight: "0.5rem" }}
      />
      <select name="sortBy" value={filters.sortBy} onChange={onChange}>
        <option value="">Sort By</option>
        <option value="name">Name</option>
        <option value="size">Size</option>
        <option value="mime_type">Type</option>
        <option value="modified">Modified</option>
      </select>
      <select
        name="sortOrder"
        value={filters.sortOrder}
        onChange={onChange}
        style={{ marginLeft: "0.5rem" }}
      >
        <option value="">Order</option>
        <option value="asc">Asc</option>
        <option value="desc">Desc</option>
      </select>
      <button onClick={onApply} style={{ marginLeft: "0.5rem" }}>
        Apply Filters
      </button>
    </div>
  );
}

export default FilterPanel;
