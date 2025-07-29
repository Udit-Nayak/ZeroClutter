import React from "react";
import { FolderOpen } from "lucide-react";

function DriveLoader({ loading, isAuthenticated, files }) {
  if (loading) return <p>Loading...</p>;

  if (!loading && isAuthenticated && files.length === 0) {
    return (
      <div style={{
        backgroundColor: "#eef2ff",
        border: "1px solid #c7d2fe",
        color: "#3730a3",
        padding: "1rem 1.25rem",
        borderRadius: "8px",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        <FolderOpen size={20} />
        <span>Please click <strong>“List Files”</strong> to view your Drive contents.</span>
      </div>
    );
  }

  return null;
}

export default DriveLoader;
