import { useState } from "react";
import axios from "axios";

const useGmail = (token) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("http://localhost:5000/api/gmail/fetch", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmails(response.data); // assumes backend returns an array of emails
    } catch (err) {
      setError("Failed to fetch emails.");
    } finally {
      setLoading(false);
    }
  };

  return {
    emails,
    loading,
    error,
    fetchEmails,
    setError,
    setLoading,
  };
};

export default useGmail;
