// src/components/Drive/DriveDashboard.js
import React, { useEffect, useState } from "react";
import FileTree from "../FileTree";
import useDrive from "./useDrive";
import DriveToolbar from "./DriveToolbar";
import FilterPanel from "./FilterPanel";
import DriveLoader from "./DriveLoader";
import axios from "axios";

function DriveDashboard() {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    files,
    loading,
    error,
    filters,
    setFilters,
    fetchDriveFiles,
    isDuplicateMode,
    setError,
    setLoading,
  } = useDrive(token);

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

  const handleDeleteDuplicate = async (name, size, content_hash) => {
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:5000/api/duplicates/delete",
        { name, size, content_hash },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDriveFiles(true);
    } catch (err) {
      setError("Failed to delete duplicates");
    } finally {
      setLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:5000/api/driveFiles/emptyTrash",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Trash emptied successfully!");
    } catch (err) {
      setError("Failed to empty trash");
    } finally {
      setLoading(false);
    }
  };

  const handleRescanDriveFiles = async () => {
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:5000/api/driveFiles/rescan",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Rescan completed and files updated!");
      fetchDriveFiles();
    } catch (err) {
      setError("Failed to rescan drive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Your Drive Files</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isAuthenticated && (
        <>
          <DriveToolbar
            onList={() => fetchDriveFiles()}
            onDuplicate={() => fetchDriveFiles(true)}
            onRescan={handleRescanDriveFiles}
            onTrash={handleEmptyTrash}
            onReports={() => (window.location.href = `/reports?token=${token}`)}
          />
          {files.length > 0 && !isDuplicateMode && (
            <FilterPanel
              filters={filters}
              onChange={(e) => setFilters({ ...filters, [e.target.name]: e.target.value })}
              onApply={() => fetchDriveFiles()}
            />
          )}
        </>
      )}

      <DriveLoader loading={loading} isAuthenticated={isAuthenticated} files={files} />

      {!loading && files.length > 0 && (
        <FileTree
          nodes={files}
          showDuplicates={isDuplicateMode}
          onDeleteDuplicate={handleDeleteDuplicate}
        />
      )}
    </div>
  );
}

export default DriveDashboard;
