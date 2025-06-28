import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const ReportsPage = () => {
  const [data, setData] = useState(null);
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    const fetchReports = async () => {
      const res = await axios.get("http://localhost:5000/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    };
    fetchReports();
  }, [token]);

  if (!data) return <p>Loading reports...</p>;

  const {
    totalUsage,
    totalDuplicateSize,
    deletedSize,
    typeStats,
    sizeCategories,
  } = data;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📊 Drive Storage Reports</h2>

      <h3>1. Total vs Duplicate vs Deleted Storage (MB)</h3>
      <PieChart width={400} height={300}>
        <Pie
          data={[
            { name: "Used", value: totalUsage },
            { name: "Duplicates", value: totalDuplicateSize },
            { name: "Deleted", value: deletedSize },
          ]}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name }) => name}
          dataKey="value"
        >
          {COLORS.map((color, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>

      <h3>2. File Type Distribution (MB)</h3>
      <PieChart width={400} height={300}>
        <Pie
          data={Object.entries(typeStats).map(([key, val]) => ({
            name: key,
            value: val,
          }))}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name }) => name}
          dataKey="value"
        >
          {COLORS.map((color, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>

      <h3>3. File Size Categories (Count)</h3>
      <BarChart width={500} height={300} data={Object.entries(sizeCategories).map(([k, v]) => ({ name: k, count: v }))}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </div>
  );
};

export default ReportsPage;
