// src/components/Gmail/GmailToolbar.jsx
import React from "react";

function GmailToolbar({ onFetch }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <button onClick={onFetch} style={{ marginRight: "1rem" }}>
        Fetch Emails
      </button>
    </div>
  );
}

export default GmailToolbar;
