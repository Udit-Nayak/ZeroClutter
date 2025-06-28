import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import DriveDashboard from "./DriveDashboard";
import ReportsPage from "./components/ReportsPage";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/dashboard"
          element={token ? <DriveDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/reports"
          element={token ? <ReportsPage /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
