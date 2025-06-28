// src/components/ReportsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;

    axios
      .get("http://localhost:5000/api/reports/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReportData(res.data))
      .catch((err) => {
        console.error("Failed to load report:", err);
        setError("Could not load report data.");
      });
  }, []);

  if (!reportData) return <div>{error || "Loading..."}</div>;

  const {
    totalUsage,
    totalQuota,
    totalDuplicateSize,
    deletedSize,
    typeStats,
    sizeCategories,
  } = reportData;

  const chartOptions = {
    responsive: false,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Drive Usage Reports</h2>

      <h3>1️⃣ Drive Usage Breakdown</h3>
      <Bar
        width={500}
        height={300}
        options={chartOptions}
        data={{
          labels: ["Used", "Free"],
          datasets: [
            {
              label: "Storage (MB)",
              data: [
                totalUsage / 1024 / 1024,
                (totalQuota - totalUsage) / 1024 / 1024,
              ],
              backgroundColor: ["#4285F4", "#d3d3d3"],
            },
          ],
        }}
      />

      <h3>2️⃣ Duplicate vs Original Storage</h3>
      <Pie
        width={400}
        height={300}
        options={chartOptions}
        data={{
          labels: ["Duplicate Files", "Original Files"],
          datasets: [
            {
              data: [totalDuplicateSize, totalUsage - totalDuplicateSize],
              backgroundColor: ["#EA4335", "#34A853"],
            },
          ],
        }}
      />

      <h3>3️⃣ Deleted Duplicate Files</h3>
      <Pie
        width={400}
        height={300}
        options={chartOptions}
        data={{
          labels: ["Deleted Duplicates", "Remaining"],
          datasets: [
            {
              data: [deletedSize, totalUsage - deletedSize],
              backgroundColor: ["#FBBC05", "#999999"],
            },
          ],
        }}
      />

      <h3>4️⃣ File Type Distribution</h3>
      <Pie
        width={400}
        height={300}
        options={chartOptions}
        data={{
          labels: ["Videos", "Images", "Documents", "Others"],
          datasets: [
            {
              data: [
                typeStats.videos,
                typeStats.images,
                typeStats.documents,
                typeStats.others,
              ],
              backgroundColor: [
                "#1E88E5",
                "#43A047",
                "#FB8C00",
                "#9E9E9E",
              ],
            },
          ],
        }}
      />

      <h3>5️⃣ File Size Categories</h3>
      <Bar
        width={500}
        height={300}
        options={chartOptions}
        data={{
          labels: ["Small (<5MB)", "Medium (<50MB)", "Large (<200MB)", "Huge"],
          datasets: [
            {
              label: "File Count",
              data: [
                sizeCategories.small,
                sizeCategories.medium,
                sizeCategories.large,
                sizeCategories.huge,
              ],
              backgroundColor: "#7B1FA2",
            },
          ],
        }}
      />
    </div>
  );
};

export default ReportsPage;
