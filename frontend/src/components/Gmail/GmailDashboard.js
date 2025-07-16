import React, { useState, useEffect, useMemo, useRef } from "react";
import GmailToolbar from "./GmailToolbar";
import GmailLoader from "./GmailLoader";
import useGmail from "./useGmail";
import axios from "axios";

function GmailDashboard({ token: propToken }) {
  const [token, setToken] = useState(propToken || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trashMails, setTrashMails] = useState([]);
  const [spamMails, setSpamMails] = useState([]);
  const [promoMails, setPromoMails] = useState([]);
  const [selectedMails, setSelectedMails] = useState([]);
  const [mode, setMode] = useState("normal");
  const [loadingMode, setLoadingMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [topicClusters, setTopicClusters] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicEmails, setTopicEmails] = useState([]);
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
      isFetchingClusterRef.current = false; // 🔓 unlock
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
          ? "http://localhost:5000/api/gmail/smart-delete"
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
      } else if (mode === "spam" || mode === "promotions") {
        const updateList = (listSetter) =>
          listSetter((prev) =>
            prev.filter((mail) => !selectedMails.includes(mail.id))
          );
        if (mode === "spam") updateList(setSpamMails);
        if (mode === "promotions") updateList(setPromoMails);
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
        : promoMails.map((m) => m.id);
    if (allIds.length === 0) return;

    try {
      const deleteUrl =
        mode === "smart"
          ? "http://localhost:5000/api/gmail/smart-delete"
          : `http://localhost:5000/api/gmail/${mode}/delete`;

      await axios.post(
        deleteUrl,
        { ids: selectedMails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (mode === "trash") setTrashMails([]);
      else if (mode === "spam") setSpamMails([]);
      else if (mode === "promotions") setPromoMails([]);
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

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Your Gmail Messages</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

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
          />


          {mode === "topics" &&
            Array.isArray(topicClusters) &&
            topicClusters.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <h3>🧠 AI-Detected Topics</h3>
                {topicClusters.map((cluster, i) => (
                  <p
                    key={i}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                    onClick={() => handleTopicClick(cluster)}
                  >
                    {cluster.topic} (
                    {cluster.email_ids?.length || cluster.emails?.length || 0}{" "}
                    emails)
                  </p>
                ))}
              </div>
            )}

          {mode === "topics" && selectedTopic && topicEmails.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h4>Emails under "{selectedTopic}"</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {topicEmails.map((email) => (
                  <li
                    key={email.id}
                    style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}
                  >
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div>
                        <strong>{email.from || "Unknown sender"}</strong>
                        <span
                          style={{
                            float: "right",
                            fontSize: "0.9rem",
                            color: "#555",
                          }}
                        >
                          {email.date
                            ? new Date(email.date).toLocaleString()
                            : "No date"}
                        </span>
                      </div>
                      <div>
                        <strong>{email.subject}</strong>
                      </div>
                      <div style={{ color: "#555" }}>{email.snippet}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(mode === "trash" ||
            mode === "spam" ||
            mode === "promotions" ) && (
            <div style={{ marginBottom: "1rem" }}>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedMails.length === 0}
              >
                Delete Selected
              </button>
              <button
                onClick={() => {
                  if (allSelected) setSelectedMails([]);
                  else setSelectedMails(allMailIds);
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
        <GmailLoader
          loading={true}
          isAuthenticated={isAuthenticated}
          mails={[]}
        />
      )}

      {!loading &&
        !loadingMode &&
        mode === "duplicates" &&
        duplicateGroups.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Sender</th>
                <th style={{ padding: "0.5rem" }}>Subject</th>
                <th style={{ padding: "0.5rem" }}>Snippet</th>
                <th style={{ padding: "0.5rem" }}>Count</th>
                <th style={{ padding: "0.5rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {duplicateGroups.map((group, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{group.from}</td>
                  <td style={{ padding: "0.5rem" }}>{group.subject}</td>
                  <td style={{ padding: "0.5rem", color: "#555" }}>
                    {group.snippet}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{group.count}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() => handleDeleteDuplicates(group.duplicateIds)}
                    >
                      Delete duplicate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {!loading &&
        !loadingMode &&
        mode !== "duplicates" &&
        displayedMails.length > 0 && (
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
                {/* Show checkbox for deletable modes */}
                {(mode === "trash" ||
                  mode === "spam" ||
                  mode === "promotions") && (
                  <input
                    type="checkbox"
                    checked={selectedMails.includes(mail.id)}
                    onChange={() => handleSelect(mail.id)}
                    style={{ marginRight: "1rem" }}
                  />
                )}

                {/* Gmail message link */}
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

      {!loading &&
        !loadingMode &&
        mode !== "duplicates" &&
        displayedMails.length === 0 && <p>No emails found.</p>}
    </div>
  );
}

export default GmailDashboard;
