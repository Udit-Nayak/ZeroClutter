import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import DriveDashboard from "./DriveDashboard";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(token ? <DriveDashboard /> : <App />);
