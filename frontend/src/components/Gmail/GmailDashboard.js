import React, { useState, useEffect } from "react";
import GmailToolbar from "./GmailToolbar";
import GmailLoader from "./GmailLoader";
import useGmail from "./useGmail";

function GmailDashboard({ token: propToken }) {
  const [token, setToken] = useState(propToken || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mails, setMails] = useState([]);


  const {
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

      {isAuthenticated && (
        <GmailToolbar onFetch={fetchMails} />
      )}

      <GmailLoader loading={loading} isAuthenticated={isAuthenticated} mails={mails} />

      {!loading && mails?.length > 0 && (
        <ul>
          {mails.map((mail, index) => (
            <li key={index}>
              <strong>{mail.subject}</strong> - {mail.snippet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GmailDashboard;
