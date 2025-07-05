import React, { useState, useEffect } from "react";
import GmailToolbar from "./GmailToolbar";
import GmailLoader from "./GmailLoader";
import useGmail from "./useGmail";

function GmailDashboard({ token: propToken }) {
  const [token, setToken] = useState(propToken || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    mails,
    loading,
    error,
    fetchMails,
    setError
  } = useGmail(token);

  useEffect(() => {
    if (propToken) {
      setToken(propToken);
      setIsAuthenticated(true);
    } else {
      setError("No token found.");
    }
  }, [propToken, setError]);

  return (
  <div style={{ padding: "2rem" }}>
    <h2>Your Gmail Messages</h2>
    {error && <p style={{ color: "red" }}>{error}</p>}

    {isAuthenticated && <GmailToolbar onFetch={fetchMails} />}

    <GmailLoader
      loading={loading}
      isAuthenticated={isAuthenticated}
      mails={mails}
    />

    {!loading && mails?.length > 0 && (
      <ul style={{ listStyle: "none", padding: 0 }}>
        {mails.map((mail, index) => (
          <li
            key={index}
            style={{
              padding: "1rem",
              borderBottom: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
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
  </div>
);

}

export default GmailDashboard;
