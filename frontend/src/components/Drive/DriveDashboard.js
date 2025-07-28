import React, { useEffect, useState } from "react";
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
  AlertTriangle
} from "lucide-react";

// Enhanced DriveToolbar component (without Rescan)
function DriveToolbar({ onList, onDuplicate, onTrash, onReports, loading }) {
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
          style={buttonStyle}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#fef3c7";
              e.target.style.borderColor = "#f59e0b";
              e.target.style.color = "#d97706";
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
          <Copy size={16} />
          Show Duplicates
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
            display: "block", 
            marginBottom: "0.5rem", 
            fontSize: "0.875rem", 
            fontWeight: "500",
            color: "#374151",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <Search size={14} />
            Search by Name
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
            display: "block", 
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
  } = useDrive(token);

  useEffect(() => {
    if (propToken) {
      setToken(propToken);
      setIsAuthenticated(true);
    } else {
      setError("No token found.");
    }
  }, [propToken, setError]);

  const handleDeleteDuplicate = async (name, size, content_hash) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/duplicates/delete", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, size, content_hash })
      });
      
      if (!response.ok) throw new Error("Failed to delete duplicates");
      
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
      const response = await fetch("http://localhost:5000/api/driveFiles/emptyTrash", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) throw new Error("Failed to empty trash");
      
      alert("Trash emptied successfully!");
    } catch (err) {
      setError("Failed to empty trash");
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
          />
          
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
              gap: "0.5rem"
            }}>
              <HardDrive size={20} />
              {isDuplicateMode ? "Duplicate Files" : "Drive Files"} ({files.length})
            </h3>
          </div>
          <div style={{ padding: "1rem" }}>
            <FileTree
              nodes={files}
              showDuplicates={isDuplicateMode}
              onDeleteDuplicate={handleDeleteDuplicate}
              source="drive"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DriveDashboard;