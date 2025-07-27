// src/components/Drive/useDrive.js
import { useState } from "react";
import axios from "axios";

const useDrive = (token) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ name: "", sortBy: "", sortOrder: "" });
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  const fetchDriveFiles = async (duplicateOnly = false) => {
    try {
      setLoading(true);
      setIsDuplicateMode(duplicateOnly);
      setError("");

      if (!duplicateOnly) {
        await axios.post("http://localhost:5000/api/driveFiles/scan", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const query = duplicateOnly ? "" : new URLSearchParams(filters).toString();
      const endpoint = duplicateOnly
        ? `http://localhost:5000/api/duplicates/`
        : `http://localhost:5000/api/driveFiles/list?${query}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const flatFiles = res.data;
      setFiles(buildTree(flatFiles));
    } catch (err) {
      setError("Failed to fetch files.");
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

  return {
    files,
    loading,
    error,
    filters,
    setFilters,
    fetchDriveFiles,
    isDuplicateMode,
    setError,
    setLoading,
  };
};

export default useDrive;
