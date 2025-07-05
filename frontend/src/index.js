import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import MainDashboard from "./components/MainDashboard";
import ReportsPage from "./components/ReportsPage"


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/reports" element={<ReportsPage />} /> 

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
