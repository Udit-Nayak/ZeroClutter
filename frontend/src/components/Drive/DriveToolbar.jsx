// src/components/Drive/DriveToolbar.jsx
import React from "react";

function DriveToolbar({ onList, onDuplicate, onRescan, onTrash, onReports }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <button onClick={onList} style={{ marginRight: "1rem" }}>List Files</button>
      <button onClick={onDuplicate} style={{ marginRight: "1rem" }}>Show Duplicates</button>
      <button onClick={onTrash} style={{ marginRight: "1rem" }}>Empty Trash</button>
      <button onClick={onReports} style={{ marginRight: "1rem" }}>Reports</button>
      <button onClick={onRescan} style={{ marginRight: "1rem" }}>Rescan</button>
    </div>
  );
}

export default DriveToolbar;
