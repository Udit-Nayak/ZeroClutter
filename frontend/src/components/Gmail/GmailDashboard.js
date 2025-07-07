import React, { useState, useEffect, useMemo } from "react";
import GmailToolbar from "./GmailToolbar";
import GmailLoader from "./GmailLoader";
import useGmail from "./useGmail";
import axios from "axios";

function GmailDashboard({ token: propToken }) {
  const [token, setToken] = useState(propToken || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trashMails, setTrashMails] = useState([]);
  const [spamMails, setSpamMails] = useState([]);
  const [selectedMails, setSelectedMails] = useState([]);
  const [mode, setMode] = useState("normal"); // "normal", "trash", "spam"
  const [loadingMode, setLoadingMode] = useState(false);

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

  const handleSelect = (id) => {
    setSelectedMails((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedMails.length === 0) return;
    try {
      await axios.post(
        `http://localhost:5000/api/gmail/${mode}/delete`,
        { ids: selectedMails },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (mode === "trash") {
        setTrashMails((prev) => prev.filter((mail) => !selectedMails.includes(mail.id)));
      } else if (mode === "spam") {
        setSpamMails((prev) => prev.filter((mail) => !selectedMails.includes(mail.id)));
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
      mode === "trash" ? trashMails.map((m) => m.id) : spamMails.map((m) => m.id);
    if (allIds.length === 0) return;

    try {
      await axios.post(
        `http://localhost:5000/api/gmail/${mode}/delete`,
        { ids: allIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (mode === "trash") setTrashMails([]);
      else if (mode === "spam") setSpamMails([]);
      setSelectedMails([]);
      alert(`All ${mode} emails permanently deleted.`);
    } catch (err) {
      console.error(`Failed to delete all ${mode} mails:`, err.message);
      setError(`Failed to delete all ${mode} mails`);
    }
  };

  const displayedMails =
    mode === "trash" ? trashMails : mode === "spam" ? spamMails : mails;

  const allMailIds = useMemo(() => displayedMails.map((mail) => mail.id), [displayedMails]);
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
            onFetchSpam={handleFetchSpamMails}
            mode={mode}
            onClearMode={() => setMode("normal")}
          />

          {(mode === "trash" || mode === "spam") && (
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

      {(loading || loadingMode) && (
        <GmailLoader loading={true} isAuthenticated={isAuthenticated} mails={[]} />
      )}

      {!loading && !loadingMode && displayedMails.length > 0 && (
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
              {(mode === "trash" || mode === "spam") && (
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
                    {mail.date ? new Date(mail.date).toLocaleString() : "No date"}
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

      {!loading && !loadingMode && displayedMails.length === 0 && (
        <p>No emails found.</p>
      )}
    </div>
  );
}

export default GmailDashboard;




