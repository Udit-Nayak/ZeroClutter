import React, { useEffect, useState } from "react";
import axios from "axios";
import FileTree from "./components/FileTree";

function DriveDashboard() {
  const [token, setToken] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    sortBy: "",
    sortOrder: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      setIsAuthenticated(true);
    } else {
      setError("No token found in URL.");
    }
  }, []);

  const fetchDriveFiles = async (authToken = token, duplicateOnly = false) => {
    try {
      setLoading(true);
      setError("");
      setIsDuplicateMode(duplicateOnly);

      const query = duplicateOnly
        ? ""
        : new URLSearchParams(filters).toString();

      const endpoint = duplicateOnly
        ? `http://localhost:5000/api/duplicates/`
        : `http://localhost:5000/api/driveFiles/list?${query}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const flatFiles = res.data;
      const fileTree = buildTree(flatFiles);
      setFiles(fileTree);
    } catch (err) {
      console.error("Failed to fetch files:", err);
      setError(
        "Failed to fetch files. Make sure you're logged in and Drive is connected."
      );
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (items) => {
    const map = {};
    const roots = [];
    items.forEach((item) => {
      map[item.file_id] = { ...item, children: [] };
    });

    items.forEach((item) => {
      const parentId = item.parent_id;
      if (parentId && map[parentId] && parentId !== item.file_id) {
        map[parentId].children.push(map[item.file_id]);
      } else {
        roots.push(map[item.file_id]);
      }
    });

    return roots;
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Your Drive Files</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isAuthenticated && (
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => fetchDriveFiles()}
            style={{ marginRight: "1rem" }}
          >
            List Files
          </button>
          <button onClick={() => fetchDriveFiles(token, true)}>
            Show Duplicates
          </button>
        </div>
      )}
      {isAuthenticated && files.length > 0 && !isDuplicateMode && (
        <div style={{ marginBottom: "1rem" }}>
          <input
            name="name"
            placeholder="Filter by name"
            value={filters.name}
            onChange={handleChange}
            style={{ marginRight: "0.5rem" }}
          />
          <select name="sortBy" value={filters.sortBy} onChange={handleChange}>
            <option value="">Sort By</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="mime_type">Type</option>
            <option value="modified">Modified</option>
          </select>
          <select
            name="sortOrder"
            value={filters.sortOrder}
            onChange={handleChange}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="">Order</option>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
          <button
            onClick={() => fetchDriveFiles()}
            style={{ marginLeft: "0.5rem" }}
          >
            Apply Filters
          </button>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : files.length === 0 && isAuthenticated ? (
        <p>No files found.</p>
      ) : (
        <FileTree nodes={files} showDuplicates={isDuplicateMode} />
      )}
    </div>
  );
}

export default DriveDashboard;
