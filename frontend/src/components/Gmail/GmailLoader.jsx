// src/components/Gmail/GmailLoader.jsx
import React from "react";

function GmailLoader({ loading, isAuthenticated, mails }) {
  if (loading) return <p>Loading...</p>;
  if (!loading && isAuthenticated && mails.length === 0) return <p>No emails found.</p>;
  return null;
}

export default GmailLoader;



