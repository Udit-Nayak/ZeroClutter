// === FRONTEND ===
// File: src/components/Local/LocalDashboard.js
import React, { useState } from "react";

const LocalDashboard = () => {
  const [files, setFiles] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [largest, setLargest] = useState([]);

  const handleFolderPick = async () => {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const formData = new FormData();

    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        formData.append("files", file, file.name);
      }
    }

    const res = await fetch("http://localhost:5000/api/localFiles/scan", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setFiles(data.files || []);
    setDuplicates(data.duplicates || []);
    setLargest(data.largest || []);
  } catch (err) {
    console.error("Folder access error:", err);
  }
};


  const serializeDirectory = async (dirHandle) => {
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        files.push({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });
      } else if (entry.kind === "directory") {
        // recursively handle directories if needed
      }
    }
    return files;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧹 Local Storage Cleaner</h1>
      <button
        onClick={handleFolderPick}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Pick Folder to Scan
      </button>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">
          Scanned Files: {files?.length || 0}
        </h2>
        <ul className="mt-2">
          {files?.map((f, i) => (
            <li key={i}>
              {f.name} - {(f.size / 1024 / 1024).toFixed(2)} MB
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mt-4 text-red-600">
          Duplicate Files
        </h2>
        <ul className="mt-2">
          {duplicates.map((f, i) => (
            <li key={i}>{f.name}</li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mt-4 text-yellow-700">
          Top 10 Largest Files
        </h2>
        <ul className="mt-2">
          {largest.map((f, i) => (
            <li key={i}>
              {f.name} - {(f.size / 1024 / 1024).toFixed(2)} MB
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LocalDashboard;
