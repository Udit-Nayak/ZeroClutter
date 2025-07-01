// src/components/Drive/DriveLoader.jsx
import React from "react";

function DriveLoader({ loading, isAuthenticated, files }) {
  if (loading) return <p>Loading...</p>;
  if (!loading && isAuthenticated && files.length === 0) return <p>No files found.</p>;
  return null;
}

export default DriveLoader;
