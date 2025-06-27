import React from "react";

function App() {
  const connectGoogleDrive = () => {
    window.location.href = "http://localhost:5000/auth/google/login";
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Drive Integration Test</h1>
      <button onClick={connectGoogleDrive}>Connect Google Drive</button>
    </div>
  );
}

export default App;