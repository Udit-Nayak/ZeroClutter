import { useState, useCallback } from "react";
import axios from "axios";

const useDrive = (token) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ name: "", sortBy: "", sortOrder: "" });
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [duplicateStats, setDuplicateStats] = useState(null);

  const formatBytes = useCallback((bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const fetchDuplicateStats = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get("http://localhost:5000/api/driveFiles/duplicates/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDuplicateStats({
          totalDuplicates: response.data.duplicateCount || 0,
          totalGroups: response.data.duplicateGroups || 0,
          totalWastedSpace: response.data.wastedSpace || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch duplicate stats:", err);
    }
  }, [token]);

  const buildTree = useCallback((items) => {
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
  }, []);

  const fetchDriveFiles = useCallback(async (duplicateOnly = false) => {
    try {
      setLoading(true);
      setIsDuplicateMode(duplicateOnly);
      setError("");

      if (duplicateOnly) {
        const res = await axios.get("http://localhost:5000/api/duplicates/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Duplicate API Response:", res.data);

        if (res.data.success) {
          const duplicateFiles = res.data.data || [];
          setFiles(duplicateFiles);
          setDuplicateStats({
            totalDuplicates: res.data.total_duplicates || 0,
            totalGroups: res.data.total_groups || 0,
            totalWastedSpace: res.data.total_wasted_space || 0
          });
        } else {
          throw new Error(res.data.error || "Failed to fetch duplicates");
        }
      } else {
        await axios.post("http://localhost:5000/api/driveFiles/scan", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const query = new URLSearchParams(filters).toString();
        const res = await axios.get(`http://localhost:5000/api/driveFiles/list?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const flatFiles = res.data;
        setFiles(buildTree(flatFiles));
        await fetchDuplicateStats();
      }
    } catch (err) {
      console.error("Fetch files error:", err);
      let errorMessage = "Failed to fetch files.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters, buildTree, fetchDuplicateStats]);

  const refreshDuplicates = useCallback(async () => {
    if (isDuplicateMode) {
      await fetchDriveFiles(true);
    } else {
      await fetchDuplicateStats();
    }
  }, [isDuplicateMode, fetchDriveFiles, fetchDuplicateStats]);

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
    duplicateStats,
    refreshDuplicates,
    formatBytes,
  };
};

export default useDrive;