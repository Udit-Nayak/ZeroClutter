import React, { useState, useEffect, useMemo } from "react";
import GmailToolbar from "./GmailToolbar";
import GmailLoader from "./GmailLoader";
import useGmail from "./useGmail";
import axios from "axios";

function GmailDashboard({ token: propToken }) {
  const [token, setToken] = useState(propToken || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trashMails, setTrashMails] = useState([]);
  const [selectedMails, setSelectedMails] = useState([]);
  const [trashMode, setTrashMode] = useState(false);
  const [loadingTrash, setLoadingTrash] = useState(false);

  const { mails, setMails, loading, error, fetchMails, setError } = useGmail(token);

  useEffect(() => {
    if (propToken) {
      setToken(propToken);
      setIsAuthenticated(true);
    } else {
      setError("No token found.");
    }
  }, [propToken, setError]);

  const handleFetchLargeAttachments = async (filter = "all") => {
    try {
      setTrashMode(false);
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
      setTrashMode(true);
      setLoadingTrash(true);
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
      setLoadingTrash(false);
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
      await axios.post(
        "http://localhost:5000/api/gmail/trash/delete",
        { ids: selectedMails },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTrashMails((prev) =>
        prev.filter((mail) => !selectedMails.includes(mail.id))
      );
      setSelectedMails([]);
      alert("Selected emails permanently deleted from trash.");
    } catch (err) {
      console.error("Failed to delete selected:", err.message);
      setError("Failed to delete selected emails");
    }
  };

  const handleDeleteAll = async () => {
    const allIds = trashMails.map((mail) => mail.id);
    if (allIds.length === 0) return;

    try {
      await axios.post(
        "http://localhost:5000/api/gmail/trash/delete",
        { ids: allIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTrashMails([]);
      setSelectedMails([]);
      alert("All trash emails permanently deleted.");
    } catch (err) {
      console.error("Failed to delete all trash mails:", err.message);
      setError("Failed to delete all trash mails");
    }
  };

  const displayedMails = trashMode ? trashMails : mails;

  // ✅ NEW: Toggle logic using useMemo
  const allMailIds = useMemo(() => trashMails.map((mail) => mail.id), [trashMails]);
  const allSelected = useMemo(
    () => allMailIds.length > 0 && allMailIds.every((id) => selectedMails.includes(id)),
    [allMailIds, selectedMails]
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Your Gmail Messages</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isAuthenticated && (
        <>
          <GmailToolbar
            onFetch={fetchMails}
            onFetchLarge={handleFetchLargeAttachments}
            onFetchTrash={handleFetchTrashMails}
            trashMode={trashMode}
            onClearTrashMode={() => setTrashMode(false)}
          />

          {trashMode && (
            <div style={{ marginBottom: "1rem" }}>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedMails.length === 0}
              >
                Delete Selected
              </button>
              <button
                onClick={() => {
                  if (allSelected) {
                    setSelectedMails([]);
                  } else {
                    setSelectedMails(allMailIds);
                  }
                }}
                style={{ marginLeft: "1rem" }}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              <button onClick={handleDeleteAll} style={{ marginLeft: "1rem" }}>
                Delete All
              </button>
            </div>
          )}
        </>
      )}

      {(loading || loadingTrash) && (
        <GmailLoader
          loading={true}
          isAuthenticated={isAuthenticated}
          mails={[]}
        />
      )}

      {!loading && !loadingTrash && displayedMails?.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {displayedMails.map((mail) => (
            <li
              key={mail.id}
              style={{
                padding: "1rem",
                borderBottom: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              {trashMode && (
                <input
                  type="checkbox"
                  checked={selectedMails.includes(mail.id)}
                  onChange={() => handleSelect(mail.id)}
                  style={{ marginRight: "1rem" }}
                />
              )}
              <a
                href={`https://mail.google.com/mail/u/0/#inbox/${mail.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div>
                  <strong>{mail.from}</strong>
                  <span
                    style={{
                      float: "right",
                      fontSize: "0.9rem",
                      color: "#555",
                    }}
                  >
                    {mail.date
                      ? new Date(mail.date).toLocaleString()
                      : "No date"}
                  </span>
                </div>
                <div>
                  <strong>{mail.subject}</strong>
                </div>
                <div style={{ color: "#555" }}>{mail.snippet}</div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {!loading && !loadingTrash && displayedMails.length === 0 && (
        <p>No emails found.</p>
      )}
    </div>
  );
}

export default GmailDashboard;
