import React, { useEffect, useState, useCallback } from "react";
import FileTree from "../FileTree";
import useDrive from "./useDrive";
import DriveLoader from "./DriveLoader";
import { 
  HardDrive, 
  Copy, 
  Trash2, 
  FileText, 
  Filter,
  Search,
  SortAsc,
  SortDesc,
  FolderOpen,
  AlertTriangle,
  Trash,
  CheckCircle
} from "lucide-react";

// Enhanced DriveToolbar component
function DriveToolbar({ onList, onDuplicate, onTrash, onReports, loading, duplicateStats }) {
  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#475569",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    minHeight: "42px",
    textDecoration: "none",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#3b82f6",
    color: "white",
    border: "1px solid #3b82f6",
  };

  const duplicateButtonStyle = {
    ...buttonStyle,
    backgroundColor: duplicateStats && duplicateStats.totalDuplicates > 0 ? "#f59e0b" : "#ffffff",
    color: duplicateStats && duplicateStats.totalDuplicates > 0 ? "white" : "#475569",
    border: duplicateStats && duplicateStats.totalDuplicates > 0 ? "1px solid #f59e0b" : "1px solid #e2e8f0",
    position: "relative"
  };

  return (
    <div style={{ 
      backgroundColor: "#f8fafc", 
      padding: "1.5rem", 
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      marginBottom: "1.5rem",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
    }}>
      <h3 style={{ 
        margin: "0 0 1rem 0", 
        color: "#1e293b", 
        fontSize: "1.125rem",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        <HardDrive size={20} />
        Google Drive Management Tools
      </h3>
      
      {duplicateStats && (
        <div style={{
          backgroundColor: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "8px",
          padding: "0.75rem",
          marginBottom: "1rem",
          fontSize: "0.875rem",
          color: "#92400e"
        }}>
          <strong>Duplicate Stats:</strong> {duplicateStats.totalDuplicates} duplicate files in {duplicateStats.totalGroups} groups, 
          wasting <strong>{(duplicateStats.totalWastedSpace / (1024 * 1024)).toFixed(1)} MB</strong> of space
        </div>
      )}
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem",
        alignItems: "center",
      }}>
        <button 
          onClick={onList}
          style={primaryButtonStyle}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#2563eb";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#3b82f6";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }
          }}
        >
          <FolderOpen size={16} />
          {loading ? "Loading..." : "List Files"}
        </button>
        
        <button 
          onClick={onDuplicate}
          style={duplicateButtonStyle}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }
          }}
        >
          <Copy size={16} />
          Show Duplicates
          {duplicateStats && duplicateStats.totalDuplicates > 0 && (
            <span style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              backgroundColor: "#dc2626",
              color: "white",
              borderRadius: "50%",
              padding: "0.2rem 0.4rem",
              fontSize: "0.75rem",
              minWidth: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {duplicateStats.totalDuplicates}
            </span>
          )}
        </button>
        
        <button 
          onClick={onTrash}
          style={buttonStyle}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#fef2f2";
              e.target.style.borderColor = "#fca5a5";
              e.target.style.color = "#dc2626";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.color = "#475569";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }
          }}
        >
          <Trash2 size={16} />
          Empty Trash
        </button>
        
        <button 
          onClick={onReports}
          style={buttonStyle}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#f0f9ff";
              e.target.style.borderColor = "#0ea5e9";
              e.target.style.color = "#0284c7";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.color = "#475569";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }
          }}
        >
          <FileText size={16} />
          Reports
        </button>
      </div>
    </div>
  );
}

// Enhanced FilterPanel component
function FilterPanel({ filters, onChange, onApply }) {
  const inputStyle = {
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontSize: "0.875rem",
    outline: "none",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    minHeight: "42px",
    width: "100%",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    border: "1px solid #3b82f6",
    borderRadius: "8px",
    backgroundColor: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    minHeight: "42px",
  };

  return (
    <div style={{ 
      backgroundColor: "#f8fafc", 
      padding: "1.5rem", 
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      marginBottom: "1.5rem",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
    }}>
      <h4 style={{ 
        margin: "0 0 1rem 0", 
        color: "#374151", 
        fontSize: "1rem",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        <Filter size={16} />
        Filter & Sort Options
      </h4>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr auto",
        gap: "1rem",
        alignItems: "end",
      }}>
        <div>
          <label style={{ 
            display: "flex", 
            alignItems: "center",
            marginBottom: "0.5rem", 
            fontSize: "0.875rem", 
            fontWeight: "500",
            color: "#374151",
            gap: "0.5rem"
          }}>
            <Search size={14} />Search by Name
          </label>
          <input
            name="name"
            placeholder="Enter file name..."
            value={filters.name}
            onChange={onChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "0.5rem", 
            fontSize: "0.875rem", 
            fontWeight: "500",
            color: "#374151"
          }}>
            Sort By
          </label>
          <select 
            name="sortBy" 
            value={filters.sortBy} 
            onChange={onChange}
            style={selectStyle}
          >
            <option value="">Choose field...</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="mime_type">File Type</option>
            <option value="modified">Last Modified</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: "flex", 
            marginBottom: "0.5rem", 
            fontSize: "0.875rem", 
            fontWeight: "500",
            color: "#374151",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            {filters.sortOrder === "desc" ? <SortDesc size={14} /> : <SortAsc size={14} />}
            Order
          </label>
          <select
            name="sortOrder"
            value={filters.sortOrder}
            onChange={onChange}
            style={selectStyle}
          >
            <option value="">Select order...</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <button 
          onClick={onApply}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#2563eb";
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#3b82f6";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
          }}
        >
          <Filter size={16} />
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// Duplicate Actions Panel
function DuplicateActionsPanel({ onDeleteAll, loading, duplicateStats }) {
  if (!duplicateStats || duplicateStats.totalDuplicates === 0) return null;

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    border: "1px solid #dc2626",
    borderRadius: "8px",
    backgroundColor: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    minHeight: "42px",
  };

  return (
    <div style={{ 
      backgroundColor: "#fef2f2", 
      padding: "1.5rem",
      borderRadius: "12px",
      border: "1px solid #fca5a5",
      marginBottom: "1.5rem",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
    }}>
      <h4 style={{ 
        margin: "0 0 1rem 0", 
        color: "#dc2626", 
        fontSize: "1rem",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        <AlertTriangle size={16} />
        Bulk Duplicate Actions
      </h4>
      
      <p style={{ 
        margin: "0 0 1rem 0", 
        color: "#7f1d1d", 
        fontSize: "0.875rem" 
      }}>
        Found {duplicateStats.totalDuplicates} duplicate files that can be safely removed to free up{" "}
        <strong>{(duplicateStats.totalWastedSpace / (1024 * 1024)).toFixed(1)} MB</strong> of space.
      </p>
      
      <button 
        onClick={onDeleteAll}
        style={buttonStyle}
        disabled={loading}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.backgroundColor = "#b91c1c";
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.backgroundColor = "#dc2626";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
          }
        }}
      >
        <Trash size={16} />
        {loading ? "Deleting..." : "Delete All Duplicates"}
      </button>
    </div>
  );
}

function DriveDashboard({ token: propToken }) {
  const [token, setToken] = useState(propToken || "");
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
    duplicateStats,
    refreshDuplicates,
    formatBytes,
  } = useDrive(token);

  const fetchDuplicateStats = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/driveFiles/duplicates/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        await response.json();
        // Store stats for the toolbar
        // This will be automatically updated when we call fetchDriveFiles(true)
      }
    } catch (err) {
      console.error("Failed to fetch duplicate stats:", err);
    }
  }, [token]);

  useEffect(() => {
    if (propToken) {
      setToken(propToken);
      setIsAuthenticated(true);
      // Auto-fetch duplicate stats when component loads
      fetchDuplicateStats();
    } else {
      setError("No token found.");
    }
  }, [propToken, setError, fetchDuplicateStats]);

  const handleDeleteDuplicate = async (file) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/duplicates/delete", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          file_id: file.file_id // Delete specific file
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete duplicate");
      }
      
      // Show success message
      // eslint-disable-next-line no-alert
      alert(`Successfully deleted "${file.name}" and saved ${formatBytes(file.size)}`);
      
      // Refresh the duplicate list
      await refreshDuplicates();
      
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete duplicate");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllDuplicates = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Are you sure you want to delete all ${duplicateStats?.totalDuplicates} duplicate files? This will free up ${formatBytes(duplicateStats?.totalWastedSpace)} of space.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/duplicates/delete-all", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete duplicates");
      }
      
      // eslint-disable-next-line no-alert
      alert(`Successfully deleted ${result.deleted_count} duplicate files and saved ${formatBytes(result.saved_space)}`);
      
      // Refresh the duplicate list
      await refreshDuplicates();
      
    } catch (err) {
      console.error("Bulk delete error:", err);
      setError(err.message || "Failed to delete all duplicates");
    } finally {
      setLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to permanently delete all files in trash?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/driveFiles/emptyTrash", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const result = await response.json();
      
      if (!result.success && !response.ok) {
        throw new Error(result.error || "Failed to empty trash");
      }
      
      // eslint-disable-next-line no-alert
      alert("Trash emptied successfully!");
      
    } catch (err) {
      console.error("Empty trash error:", err);
      setError(err.message || "Failed to empty trash");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: "2rem",
      backgroundColor: "#f9fafb",
      minHeight: "100vh"
    }}>
      {/* Error Display */}
      {error && (
        <div style={{ 
          backgroundColor: "#fee2e2", 
          border: "1px solid #fca5a5",
          color: "#dc2626",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <AlertTriangle size={20} />
          {error}
          <button 
            onClick={() => setError("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: "1.25rem",
              padding: "0.25rem"
            }}
          >
            ×
          </button>
        </div>
      )}

      {isAuthenticated && (
        <>
          <DriveToolbar
            onList={() => fetchDriveFiles()}
            onDuplicate={() => fetchDriveFiles(true)}
            onTrash={handleEmptyTrash}
            onReports={() => (window.location.href = `/reports?token=${token}`)}
            loading={loading}
            duplicateStats={duplicateStats}
          />
          
          {isDuplicateMode && (
            <DuplicateActionsPanel
              onDeleteAll={handleDeleteAllDuplicates}
              loading={loading}
              duplicateStats={duplicateStats}
            />
          )}
          
          {files.length > 0 && !isDuplicateMode && (
            <FilterPanel
              filters={filters}
              onChange={(e) =>
                setFilters({ ...filters, [e.target.name]: e.target.value })
              }
              onApply={() => fetchDriveFiles()}
            />
          )}
        </>
      )}

      <DriveLoader
        loading={loading}
        isAuthenticated={isAuthenticated}
        files={files}
      />

      {!loading && files.length > 0 && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        }}>
          <div style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb"
          }}>
            <h3 style={{
              margin: 0,
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "space-between"
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HardDrive size={20} />
                {isDuplicateMode ? "Duplicate Files" : "Drive Files"} ({files.length})
              </span>
              {isDuplicateMode && duplicateStats && (
                <span style={{
                  fontSize: "0.875rem",
                  color: "#f59e0b",
                  fontWeight: "500"
                }}>
                  Wasting {formatBytes(duplicateStats.totalWastedSpace)}
                </span>
              )}
            </h3>
          </div>
          <div style={{ padding: "1rem" }}>
            {isDuplicateMode ? (
              <DuplicateFilesList 
                files={files}
                onDeleteDuplicate={handleDeleteDuplicate}
                loading={loading}
                formatBytes={formatBytes}
              />
            ) : (
              <FileTree
                nodes={files}
                showDuplicates={false}
                source="drive"
              />
            )}
          </div>
        </div>
      )}

      {!loading && isDuplicateMode && files.length === 0 && (
        <div style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #0ea5e9",
          color: "#0c4a6e",
          padding: "2rem",
          borderRadius: "8px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}>
          <CheckCircle size={48} color="#0ea5e9" />
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>
            No Duplicates Found!
          </h3>
          <p style={{ margin: 0, fontSize: "1rem" }}>
            Your Google Drive is already optimized. No duplicate files were found.
          </p>
        </div>
      )}
    </div>
  );
}

// Component to display duplicate files with individual delete buttons
function DuplicateFilesList({ files, onDeleteDuplicate, loading, formatBytes }) {
  const fileItemStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "0.75rem",
    backgroundColor: "#fefefe",
    transition: "all 0.2s ease"
  };

  const deleteButtonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    backgroundColor: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: "500",
    transition: "all 0.2s ease"
  };

  return (
    <div>
      {files.map((file, index) => (
        <div 
          key={file.file_id} 
          style={fileItemStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f9fafb";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fefefe";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: "500", 
              color: "#111827", 
              marginBottom: "0.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <Copy size={16} color="#f59e0b" />
              {file.name}
            </div>
            <div style={{ 
              fontSize: "0.875rem", 
              color: "#6b7280",
              display: "flex",
              gap: "1rem"
            }}>
              <span>Size: <strong>{formatBytes(file.size)}</strong></span>
              <span>Type: {file.mime_type}</span>
              <span>Modified: {new Date(file.modified).toLocaleDateString()}</span>
            </div>
          </div>
          
          <button
            onClick={() => onDeleteDuplicate(file)}
            disabled={loading}
            style={deleteButtonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#b91c1c";
                e.target.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#dc2626";
                e.target.style.transform = "scale(1)";
              }
            }}
          >
            <Trash size={14} />
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default DriveDashboard;