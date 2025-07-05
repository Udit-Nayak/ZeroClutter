// useGmail.js
import { useState } from "react";
import axios from "axios";

export default function useGmail(token) {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMails = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/gmail/fetch", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMails(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch Gmail messages");
    } finally {
      setLoading(false);
    }
  };

  return {
    mails,
    loading,
    error,
    fetchMails,
    setError,
    setLoading,
    setMails, // exposed so GmailDashboard can use it if needed
  };
}
