import React, { useState, useEffect, useMemo, useRef } from "react";
import GmailLoader from "./GmailLoader";
import useGmail from "./useGmail";
import axios from "axios";
import { 
  Mail, 
  Trash2, 
  AlertTriangle, 
  Copy, 
  Tag, 
  Brain, 
  Lightbulb, 
  Calendar, 
  Paperclip,
  CheckSquare,
  Square,
  X,
  ExternalLink,
  Clock,
  User,
  MessageSquare,
  Filter
} from "lucide-react";

// Enhanced GmailToolbar component
function GmailToolbar({
  onFetch,
  onFetchLarge,
  onFetchTrash,
  trashMode,
  onClearTrashMode,
  onFetchSpam,
  onDateFilter,
  showFilters,
  onFetchDuplicates,
  onFetchPromotions,
  onFetchAIScan,
  onFetchSmartSuggestions,
  loadingMode,
}) {
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
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#3b82f6",
    color: "white",
    border: "1px solid #3b82f6",
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f1f5f9",
    border: "1px solid #3b82f6",
    color: "#3b82f6",
  };

  const filterSelectStyle = {
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontSize: "0.875rem",
    cursor: "pointer",
    outline: "none",
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
      {/* Main Actions */}
      <div style={{ marginBottom: showFilters ? "1.5rem" : "0" }}>
        <h3 style={{ 
          margin: "0 0 1rem 0", 
          color: "#1e293b", 
          fontSize: "1.125rem",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <Mail size={20} />
          Gmail Management Tools
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          alignItems: "center",
        }}>
          <button 
            onClick={onFetch}
            style={primaryButtonStyle}
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
            <Mail size={16} />
            Fetch Emails
          </button>
          
          <button 
            onClick={trashMode ? onClearTrashMode : onFetchTrash}
            style={trashMode ? activeButtonStyle : buttonStyle}
            onMouseEnter={(e) => {
              if (!trashMode) {
                e.target.style.backgroundColor = "#f1f5f9";
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!trashMode) {
                e.target.style.backgroundColor = "#ffffff";
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
              }
            }}
          >
            <Trash2 size={16} />
            {trashMode ? "Back to Inbox" : "Emails in Trash"}
          </button>
          
          <button 
            onClick={onFetchSpam}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#fef2f2";
              e.target.style.borderColor = "#fca5a5";
              e.target.style.color = "#dc2626";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.color = "#475569";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }}
          >
            <AlertTriangle size={16} />
            Spam Emails
          </button>
          
          <button 
            onClick={onFetchDuplicates}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f0f9ff";
              e.target.style.borderColor = "#0ea5e9";
              e.target.style.color = "#0284c7";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.color = "#475569";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }}
          >
            <Copy size={16} />
            Show Duplicates
          </button>
          
          <button 
            onClick={onFetchPromotions}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#fefce8";
              e.target.style.borderColor = "#facc15";
              e.target.style.color = "#ca8a04";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.color = "#475569";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }}
          >
            <Tag size={16} />
            Promotions
          </button>
          
          <button 
            onClick={onFetchAIScan}
            style={buttonStyle}
            disabled={loadingMode}
            onMouseEnter={(e) => {
              if (!loadingMode) {
                e.target.style.backgroundColor = "#f3f4f6";
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.color = "#7c3aed";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingMode) {
                e.target.style.backgroundColor = "#ffffff";
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.color = "#475569";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
              }
            }}
          >
            <Brain size={16} />
            {loadingMode ? "AI Scanning..." : "AI Scan"}
          </button>
          
          <button 
            onClick={onFetchSmartSuggestions}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#ecfdf5";
              e.target.style.borderColor = "#10b981";
              e.target.style.color = "#059669";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.color = "#475569";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }}
          >
            <Lightbulb size={16} />
            Smart Suggestion
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div style={{
          borderTop: "1px solid #e2e8f0",
          paddingTop: "1.5rem",
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
            Filter Options
          </h4>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            alignItems: "center",
          }}>
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
                <Calendar size={14} />
                Date Range
              </label>
              <select 
                onChange={(e) => onDateFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All Dates</option>
                <option value="1m">Last 1 Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last 1 Year</option>
                <option value="2y">Last 2 Years</option>
                <option value="3y">Last 3 Years</option>
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
                <Paperclip size={14} />
                Attachment Size
              </label>
              <select 
                onChange={(e) => onFetchLarge(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All large attachments</option>
                <option value=">20">Larger than 20 MB</option>
                <option value="10-20">10 MB to 20 MB</option>
                <option value="<10">Smaller than 10 MB</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GmailDashboard({ token: propToken }) {
  const [token, setToken] = useState(propToken || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trashMails, setTrashMails] = useState([]);
  const [spamMails, setSpamMails] = useState([]);
  const [promoMails, setPromoMails] = useState([]);
  const [smartMails, setSmartMails] = useState([]);
  const [selectedMails, setSelectedMails] = useState([]);
  const [mode, setMode] = useState("normal");
  const [loadingMode, setLoadingMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [topicClusters, setTopicClusters] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicEmails, setTopicEmails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { mails, setMails, loading, error, setError } = useGmail(token);
  const isFetchingClusterRef = useRef(false);

  useEffect(() => {
    if (propToken) {
      setToken(propToken);
      setIsAuthenticated(true);
    } else {
      setError("No token found.");
    }
  }, [propToken, setError]);

  // All the existing handler functions remain the same
  const handleFetchTopicClusters = async () => {
    if (isFetchingClusterRef.current) {
      console.warn("🔒 Already fetching cluster data. Skipping re-call.");
      return;
    }
    isFetchingClusterRef.current = true;

    try {
      setLoadingMode(true);
      setMode("topics");

      const res = await axios.get(
        "http://localhost:5000/api/topics/emails/for-topic-clustering",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const emailData = res.data;

      if (!Array.isArray(emailData) || emailData.length === 0) {
        console.warn("⚠️ Email data is empty or invalid");
        return;
      }

      setTopicClusters(res.data);
      setSelectedTopic(null);
      setTopicEmails([]);
      setError("");
    } catch (err) {
      console.error("❌ Failed to fetch topic clusters:", err.message);
      setError("Failed to fetch topic clusters");
    } finally {
      setLoadingMode(false);
      isFetchingClusterRef.current = false;
    }
  };

  const handleTopicClick = async (cluster) => {
    setSelectedTopic(cluster.topic);
    setTopicEmails(cluster.emails);
  };

  const handleFetchDuplicates = async () => {
    try {
      setLoadingMode(true);
      setMode("duplicates");

      const res = await axios.get(
        "http://localhost:5000/api/gmail/duplicates",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDuplicateGroups(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch duplicates:", err.message);
      setError("Failed to fetch duplicate emails");
    } finally {
      setLoadingMode(false);
    }
  };

  const handleDeleteDuplicates = async (ids) => {
    if (ids.length === 0) return;
    try {
      await axios.post(
        "http://localhost:5000/api/gmail/delete-duplicate",
        { ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Duplicate emails deleted successfully.");
      handleFetchDuplicates();
    } catch (err) {
      console.error("Failed to delete duplicates:", err.message);
      setError("Failed to delete duplicate emails.");
    }
  };

  const handleFetchPromotions = async () => {
    try {
      setLoadingMode(true);
      setMode("promotions");
      const res = await axios.get(
        "http://localhost:5000/api/gmail/promotions",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPromoMails(res.data);
      setSelectedMails([]);
      setError("");
    } catch (err) {
      console.error("Failed to fetch promotions:", err.message);
      setError("Failed to fetch promotional emails");
    } finally {
      setLoadingMode(false);
    }
  };

  const handleFetchWithDateFilter = async () => {
    try {
      setMode("normal");
      setShowFilters(true);
      setLoadingMode(true);
      const res = await axios.get("http://localhost:5000/api/gmail/fetch", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMails(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch emails:", err.message);
      setError("Failed to fetch emails");
    } finally {
      setLoadingMode(false);
    }
  };

  const handleDateFilterChange = async (filter) => {
    try {
      setMode("normal");
      setLoadingMode(true);
      const res = await axios.get(
        `http://localhost:5000/api/gmail/fetch?date=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMails(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch filtered emails:", err.message);
      setError("Failed to fetch filtered emails");
    } finally {
      setLoadingMode(false);
    }
  };

  const handleFetchLargeAttachments = async (filter = "all") => {
    try {
      setMode("normal");
      const res = await axios.get(
        `http://localhost:5000/api/gmail/large?filter=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMails(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch large attachments:", err.message);
      setError("Failed to fetch large attachment emails");
    }
  };

  const handleFetchTrashMails = async () => {
    try {
      setMode("trash");
      setLoadingMode(true);
      const res = await axios.get("http://localhost:5000/api/gmail/trash", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrashMails(res.data);
      setSelectedMails([]);
      setError("");
    } catch (err) {
      console.error("Failed to fetch trash emails:", err.message);
      setError("Failed to fetch trash emails");
    } finally {
      setLoadingMode(false);
    }
  };

  const handleFetchSpamMails = async () => {
    try {
      setMode("spam");
      setLoadingMode(true);
      const res = await axios.get("http://localhost:5000/api/gmail/spam", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpamMails(res.data);
      setSelectedMails([]);
      setError("");
    } catch (err) {
      console.error("Failed to fetch spam emails:", err.message);
      setError("Failed to fetch spam emails");
    } finally {
      setLoadingMode(false);
    }
  };

  const handleFetchSmartSuggestions = async () => {
    try {
      setLoadingMode(true);
      setMode("smart");
      setShowFilters(false);
      const res = await axios.get(
        "http://localhost:5000/api/gmail/old-unread",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSmartMails(res.data);
      setUnreadCount(res.data.length);
      setSelectedMails([]);
      setError("");
    } catch (err) {
      console.error("Failed to fetch smart suggestions:", err.message);
      setError("Failed to fetch smart suggestions");
    } finally {
      setLoadingMode(false);
    }
  };

  const handleSelect = (id) => {
    setSelectedMails((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedMails.length === 0) return;
    try {
      const deleteUrl =
        mode === "smart"
          ? "http://localhost:5000/api/gmail/old-unread/delete"
          : `http://localhost:5000/api/gmail/${mode}/delete`;

      await axios.post(
        deleteUrl,
        { ids: selectedMails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (mode === "trash") {
        setTrashMails((prev) =>
          prev.filter((mail) => !selectedMails.includes(mail.id))
        );
      } else if (mode === "spam") {
        setSpamMails((prev) =>
          prev.filter((mail) => !selectedMails.includes(mail.id))
        );
      } else if (mode === "promotions") {
        setPromoMails((prev) =>
          prev.filter((mail) => !selectedMails.includes(mail.id))
        );
      } else if (mode === "smart") {
        setSmartMails((prev) =>
          prev.filter((mail) => !selectedMails.includes(mail.id))
        );
        setUnreadCount((prev) => prev - selectedMails.length);
      }
      
      setSelectedMails([]);
      alert(`Selected emails permanently deleted from ${mode}.`);
    } catch (err) {
      console.error("Failed to delete selected:", err.message);
      setError("Failed to delete selected emails");
    }
  };

  const handleDeleteAll = async () => {
    const allIds =
      mode === "trash"
        ? trashMails.map((m) => m.id)
        : mode === "spam"
        ? spamMails.map((m) => m.id)
        : mode === "promotions"
        ? promoMails.map((m) => m.id)
        : mode === "smart"
        ? smartMails.map((m) => m.id)
        : [];
    
    if (allIds.length === 0) return;

    try {
      const deleteUrl =
        mode === "smart"
          ? "http://localhost:5000/api/gmail/old-unread/delete"
          : `http://localhost:5000/api/gmail/${mode}/delete`;

      await axios.post(
        deleteUrl,
        { ids: allIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (mode === "trash") setTrashMails([]);
      else if (mode === "spam") setSpamMails([]);
      else if (mode === "promotions") setPromoMails([]);
      else if (mode === "smart") {
        setSmartMails([]);
        setUnreadCount(0);
      }
      
      setSelectedMails([]);
      alert(`All ${mode} emails permanently deleted.`);
    } catch (err) {
      console.error(`Failed to delete all ${mode} mails:`, err.message);
      setError(`Failed to delete all ${mode} mails`);
    }
  };

  const displayedMails =
    mode === "trash"
      ? trashMails
      : mode === "spam"
      ? spamMails
      : mode === "promotions"
      ? promoMails
      : mode === "smart"
      ? smartMails
      : mails;

  const allMailIds = useMemo(
    () => displayedMails.map((mail) => mail.id),
    [displayedMails]
  );

  const allSelected = useMemo(
    () =>
      allMailIds.length > 0 &&
      allMailIds.every((id) => selectedMails.includes(id)),
    [allMailIds, selectedMails]
  );

  // Enhanced button styles
  const actionButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.625rem 1rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    borderRadius: "6px",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textDecoration: "none",
  };

  const primaryActionButton = {
    ...actionButtonStyle,
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
    color: "white",
  };

  const secondaryActionButton = {
    ...actionButtonStyle,
    backgroundColor: "white",
    borderColor: "#d1d5db",
    color: "#374151",
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
          <GmailToolbar
            onFetch={() => {
              setShowFilters(true);
              handleFetchWithDateFilter();
            }}
            onFetchLarge={handleFetchLargeAttachments}
            onFetchTrash={() => {
              setShowFilters(false);
              handleFetchTrashMails();
            }}
            onFetchSpam={() => {
              setShowFilters(false);
              handleFetchSpamMails();
            }}
            onFetchDuplicates={handleFetchDuplicates}
            onFetchPromotions={handleFetchPromotions}
            trashMode={mode === "trash"}
            onClearTrashMode={() => {
              setMode("normal");
              setShowFilters(false);
            }}
            onDateFilter={handleDateFilterChange}
            showFilters={showFilters}
            onFetchAIScan={handleFetchTopicClusters}
            onFetchSmartSuggestions={handleFetchSmartSuggestions}
            loadingMode={loadingMode}
          />

          {/* Smart Suggestions Alert */}
          {mode === "smart" && unreadCount > 0 && (
            <div style={{ 
              margin: "0 0 1.5rem 0", 
              padding: "1rem 1.25rem", 
              backgroundColor: "#dbeafe", 
              border: "1px solid #3b82f6", 
              borderRadius: "8px",
              color: "#1e40af",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
            }}>
              <Lightbulb size={20} />
              You have {unreadCount} unread emails from the past 6 months, want to delete them?
            </div>
          )}

          {/* Action Buttons for special modes */}
          {(mode === "trash" ||
            mode === "spam" ||
            mode === "promotions" ||
            mode === "smart") && (
            <div style={{ 
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
            }}>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedMails.length === 0}
                style={{
                  ...primaryActionButton,
                  opacity: selectedMails.length === 0 ? 0.5 : 1,
                  cursor: selectedMails.length === 0 ? "not-allowed" : "pointer"
                }}
              >
                <Trash2 size={16} />
                Delete Selected ({selectedMails.length})
              </button>
              
              <button
                onClick={() => {
                  if (allSelected) setSelectedMails([]);
                  else setSelectedMails(allMailIds);
                }}
                style={secondaryActionButton}
              >
                {allSelected ? <Square size={16} /> : <CheckSquare size={16} />}
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              
              <button 
                onClick={handleDeleteAll} 
                style={{
                  ...secondaryActionButton,
                  borderColor: "#dc2626",
                  color: "#dc2626"
                }}
              >
                <Trash2 size={16} />
                Delete All
              </button>
            </div>
          )}

          {/* Topics Display */}
          {mode === "topics" &&
            Array.isArray(topicClusters) &&
            topicClusters.length > 0 && (
              <div style={{ 
                marginBottom: "1.5rem",
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
                    <Brain size={20} />
                    AI-Detected Topics
                  </h3>
                </div>
                <div style={{ padding: "1rem" }}>
                  {topicClusters.map((cluster, i) => (
                    <div
                      key={i}
                      onClick={() => handleTopicClick(cluster)}
                      style={{
                        padding: "0.75rem 1rem",
                        margin: "0.5rem 0",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#e0e7ff";
                        e.target.style.borderColor = "#6366f1";
                        e.target.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#f8fafc";
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        {cluster.topic}
                      </span>
                      <span style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "500"
                      }}>
                        {cluster.email_ids?.length || cluster.emails?.length || 0} emails
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Topic Emails Display */}
          {mode === "topics" && selectedTopic && topicEmails.length > 0 && (
            <div style={{ 
              marginBottom: "1.5rem",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
            }}>
              <div style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#111827"
                }}>
                  Emails under "{selectedTopic}"
                </h4>
                <button
                  onClick={() => {
                    setSelectedTopic(null);
                    setTopicEmails([]);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: "0.25rem"
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {topicEmails.map((email) => (
                  <div
                    key={email.id}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid #f3f4f6",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "white";
                    }}
                  >
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        textDecoration: "none", 
                        color: "inherit",
                        display: "block"
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontWeight: "600",
                          color: "#111827"
                        }}>
                          <User size={16} />
                          {email.from || "Unknown sender"}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.75rem",
                          color: "#6b7280"
                        }}>
                          <Clock size={12} />
                          {email.date
                            ? new Date(email.date).toLocaleDateString()
                            : "No date"}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "0.25rem"
                      }}>
                        {email.subject}
                      </div>
                      <div style={{ 
                        color: "#6b7280", 
                        fontSize: "0.875rem",
                        lineHeight: "1.4"
                      }}>
                        {email.snippet}
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading Display */}
      {(loading || loadingMode) && (
        <GmailLoader
          loading={true}
          isAuthenticated={isAuthenticated}
          mails={[]}
        />
      )}

      {/* Duplicates Table */}
      {!loading &&
        !loadingMode &&
        mode === "duplicates" &&
        duplicateGroups.length > 0 && (
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
                <Copy size={20} />
                Duplicate Emails
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#374151",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Sender
                    </th>
                    <th style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#374151",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Subject
                    </th>
                    <th style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#374151",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Snippet
                    </th>
                    <th style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#374151",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Count
                    </th>
                    <th style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#374151",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateGroups.map((group, i) => (
                    <tr key={i} style={{
                      borderBottom: "1px solid #f3f4f6",
                      transition: "background-color 0.15s ease"
                    }}>
                      <td style={{
                        padding: "1rem 1rem",
                        fontSize: "0.875rem",
                        color: "#111827"
                      }}>
                        {group.from}
                      </td>
                      <td style={{
                        padding: "1rem 1rem",
                        fontSize: "0.875rem",
                        color: "#111827",
                        fontWeight: "500"
                      }}>
                        {group.subject}
                      </td>
                      <td style={{
                        padding: "1rem 1rem",
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {group.snippet}
                      </td>
                      <td style={{
                        padding: "1rem 1rem",
                        fontSize: "0.875rem",
                        color: "#111827"
                      }}>
                        <span style={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "500"
                        }}>
                          {group.count}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1rem" }}>
                        <button
                          onClick={() => handleDeleteDuplicates(group.duplicateIds)}
                          style={{
                            ...primaryActionButton,
                            fontSize: "0.75rem",
                            padding: "0.5rem 0.75rem"
                          }}
                        >
                          <Trash2 size={14} />
                          Delete Duplicates
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Main Email List */}
      {!loading &&
        !loadingMode &&
        mode !== "duplicates" &&
        displayedMails.length > 0 && (
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
                <Mail size={20} />
                {mode === "trash" ? "Trash Emails" :
                 mode === "spam" ? "Spam Emails" :
                 mode === "promotions" ? "Promotional Emails" :
                 mode === "smart" ? "Smart Suggestions" :
                 "Emails"} ({displayedMails.length})
              </h3>
            </div>
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {displayedMails.map((mail) => (
                <div
                  key={mail.id}
                  style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid #f3f4f6",
                    transition: "background-color 0.15s ease",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  {(mode === "trash" ||
                    mode === "spam" ||
                    mode === "promotions" ||
                    mode === "smart") && (
                    <input
                      type="checkbox"
                      checked={selectedMails.includes(mail.id)}
                      onChange={() => handleSelect(mail.id)}
                      style={{
                        marginTop: "0.25rem",
                        width: "16px",
                        height: "16px",
                        cursor: "pointer"
                      }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${mail.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        textDecoration: "none", 
                        color: "inherit",
                        display: "block"
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontWeight: "600",
                          color: "#111827"
                        }}>
                          <User size={16} />
                          {mail.from}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.75rem",
                          color: "#6b7280"
                        }}>
                          <Clock size={12} />
                          {mail.date
                            ? new Date(mail.date).toLocaleDateString()
                            : "No date"}
                          <ExternalLink size={12} />
                        </div>
                      </div>
                      <div style={{
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        <MessageSquare size={16} />
                        {mail.subject}
                      </div>
                      <div style={{ 
                        color: "#6b7280", 
                        fontSize: "0.875rem",
                        lineHeight: "1.4"
                      }}>
                        {mail.snippet}
                      </div>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* No emails message */}
      {!loading &&
        !loadingMode &&
        mode !== "duplicates" &&
        displayedMails.length === 0 && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            border: "2px dashed #d1d5db",
            padding: "3rem",
            textAlign: "center",
            color: "#6b7280"
          }}>
            <Mail size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: "500" }}>
              No emails found.
            </p>
          </div>
        )}
    </div>
  );
}

export default GmailDashboard;