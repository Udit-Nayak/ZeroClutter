import React, { useState } from "react";

function GmailToolbar({ onFetch, onFetchLarge }) {
  const [filter, setFilter] = useState("all");

  const handleLargeAttachmentFilter = (e) => {
    const selected = e.target.value;
    setFilter(selected);
    onFetchLarge(selected);
  };

  return (
    <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
      <button onClick={onFetch}>Fetch Emails</button>
      
      <select value={filter} onChange={handleLargeAttachmentFilter}>
        <option value="all">All large attachments</option>
        <option value=">20">Larger than 20 MB</option>
        <option value="10-20">10 MB to 20 MB</option>
        <option value="<10">Smaller than 10 MB</option>
      </select>
    </div>
  );
}

export default GmailToolbar;
