import React from "react";
import DriveDashboard from "./Drive/DriveDashboard";
import GmailDashboard from "./Gmail/GmailDashboard";
import LocalDashboard from "./Local/LocalDashboard"

const MainDashboard = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <h3>Token not found. Please authenticate again.</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <DriveDashboard token={token} />
      <GmailDashboard token={token} />
      <LocalDashboard />
    </div>
  );
};

export default MainDashboard;