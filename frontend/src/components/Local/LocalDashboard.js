import React, { useState, useEffect } from "react";

const LocalDashboard = () => {
  const [files, setFiles] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [largest, setLargest] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [folderName, setFolderName] = useState("");

  // Check scan status on component mount
  useEffect(() => {
    checkScanStatus();
  }, []);

  const checkScanStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/localFiles/status");
      if (response.ok) {
        const data = await response.json();
        if (data.hasData) {
          setStats(data);
          setFolderName(data.folderName);
          setScanComplete(true);
          // Load the existing data
          await loadExistingData();
        }
      }
    } catch (err) {
      console.error("Error checking scan status:", err);
    }
  };

  const loadExistingData = async () => {
    try {
      // Load files, duplicates, and large files
      const [filesRes, duplicatesRes, largeRes] = await Promise.all([
        fetch("http://localhost:5000/api/localFiles/files?limit=100"),
        fetch("http://localhost:5000/api/localFiles/duplicates"),
        fetch("http://localhost:5000/api/localFiles/large?limit=10")
      ]);

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData.files || []);
      }

      if (duplicatesRes.ok) {
        const duplicatesData = await duplicatesRes.json();
        setDuplicates(duplicatesData.duplicates || []);
        setDuplicateGroups(duplicatesData.duplicateGroups || []);
      }

      if (largeRes.ok) {
        const largeData = await largeRes.json();
        setLargest(largeData.largeFiles || []);
      }
    } catch (err) {
      console.error("Error loading existing data:", err);
    }
  };

  const handleFolderPick = async () => {
    setError(null);
    
    try {
      setIsScanning(true);
      setScanComplete(false);
      
      // Check if File System Access API is supported
      if (!window.showDirectoryPicker) {
        throw new Error("Your browser doesn't support folder access. Please use a modern browser like Chrome or Edge.");
      }

      const dirHandle = await window.showDirectoryPicker();
      console.log("Directory selected:", dirHandle.name);
      
      const fileList = await processDirectory(dirHandle);
      console.log("Files processed:", fileList.length);
      
      if (fileList.length === 0) {
        throw new Error("No files found in the selected folder");
      }
      
      // Send file metadata to backend for processing
      const response = await fetch("http://localhost:5000/api/localFiles/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileList,
          folderName: dirHandle.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Scan failed");
      }

      setFiles(data.files || []);
      setDuplicates(data.duplicates || []);
      setLargest(data.largest || []);
      setStats(data.stats);
      setFolderName(data.stats?.folderName || dirHandle.name);
      setScanComplete(true);
      
      // Group duplicates properly
      const groups = groupDuplicatesByHash(data.duplicates || []);
      setDuplicateGroups(groups);
      
      console.log("Scan completed successfully");
      
    } catch (err) {
      console.error("Folder access error:", err);
      setError(err.message);
      setScanComplete(false);
    } finally {
      setIsScanning(false);
    }
  };

  const processDirectory = async (dirHandle, basePath = "", maxFiles = 10000) => {
    const files = [];
    let processedCount = 0;
    
    try {
      for await (const entry of dirHandle.values()) {
        if (processedCount >= maxFiles) {
          console.warn(`Reached maximum file limit of ${maxFiles}`);
          break;
        }

        const fullPath = basePath ? `${basePath}/${entry.name}` : entry.name;
        
        if (entry.kind === "file") {
          try {
            const file = await entry.getFile();
            
            // Skip very large files (>1GB) for performance
            if (file.size > 1024 * 1024 * 1024) {
              console.warn(`Skipping large file: ${entry.name} (${formatFileSize(file.size)})`);
              continue;
            }

            const fileData = {
              name: file.name,
              fullPath: fullPath,
              size: file.size,
              type: file.type || getFileExtension(file.name),
              lastModified: file.lastModified,
              contentHash: await generateFileHash(file)
            };
            
            files.push(fileData);
            processedCount++;
          } catch (fileErr) {
            console.warn(`Could not access file: ${entry.name}`, fileErr.message);
          }
        } else if (entry.kind === "directory" && !shouldSkipDirectory(entry.name)) {
          // Recursively process subdirectories
          try {
            const subFiles = await processDirectory(entry, fullPath, maxFiles - processedCount);
            files.push(...subFiles);
            processedCount += subFiles.length;
          } catch (dirErr) {
            console.warn(`Could not access directory: ${entry.name}`, dirErr.message);
          }
        }
      }
    } catch (err) {
      console.error("Error processing directory:", err);
    }
    
    return files;
  };

  const shouldSkipDirectory = (dirName) => {
    const systemDirs = [
      'node_modules', '.git', '.svn', '.hg', 'bower_components',
      '.DS_Store', 'Thumbs.db', '.tmp', '.cache', 'temp', 'System Volume Information',
      '$RECYCLE.BIN', 'AppData', 'Application Data'
    ];
    return systemDirs.some(sysDir => 
      dirName.toLowerCase().includes(sysDir.toLowerCase()) || dirName.startsWith('.')
    );
  };

  const generateFileHash = async (file) => {
    try {
      // For performance, only hash first 64KB for files larger than 1MB
      const chunkSize = file.size > 1024 * 1024 ? 65536 : Math.min(file.size, 65536);
      const chunk = file.slice(0, chunkSize);
      const buffer = await chunk.arrayBuffer();
      
      // Create a simple hash using file metadata and content sample
      const hashInput = `${file.name}-${file.size}-${file.lastModified}-${new Uint8Array(buffer).slice(0, 1000).join('')}`;
      
      // Use built-in crypto API if available, otherwise fallback
      if (window.crypto && window.crypto.subtle) {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
        return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 20);
      } else {
        // Fallback hash
        return btoa(hashInput).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      }
    } catch (err) {
      console.warn("Error generating file hash:", err);
      // Fallback hash based on file metadata only
      return btoa(`${file.name}-${file.size}-${file.lastModified}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    }
  };

  const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return 'unknown';
    const ext = filename.split('.').pop();
    return ext === filename ? 'unknown' : ext.toLowerCase();
  };

  const groupDuplicatesByHash = (duplicates) => {
    const groups = {};
    duplicates.forEach(file => {
      if (!groups[file.contentHash]) {
        groups[file.contentHash] = [];
      }
      groups[file.contentHash].push(file);
    });
    return Object.values(groups).filter(group => group.length > 1);
  };

  const handleDeleteFile = async (filePath, fileName) => {
    if (!confirm(`Are you sure you want to delete: ${fileName}?`)) {
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/localFiles/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullPath: filePath }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove from all lists
        setFiles(prev => prev.filter(f => f.fullPath !== filePath));
        setDuplicates(prev => prev.filter(f => f.fullPath !== filePath));
        setLargest(prev => prev.filter(f => f.fullPath !== filePath));
        
        // Update duplicate groups
        const newDuplicates = duplicates.filter(f => f.fullPath !== filePath);
        setDuplicateGroups(groupDuplicatesByHash(newDuplicates));
        
        // Update stats
        if (stats) {
          setStats(prev => ({
            ...prev,
            totalFiles: prev.totalFiles - 1,
            duplicateCount: newDuplicates.length
          }));
        }
        
        alert(result.message || "File processed successfully!");
      } else {
        throw new Error(result.message || "Failed to delete file");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error processing file: " + err.message);
    }
  };

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear all scan data?")) {
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/localFiles/clear", {
        method: "DELETE",
      });

      if (response.ok) {
        setFiles([]);
        setDuplicates([]);
        setDuplicateGroups([]);
        setLargest([]);
        setStats(null);
        setFolderName("");
        setScanComplete(false);
        setError(null);
        alert("Cache cleared successfully!");
      } else {
        throw new Error("Failed to clear cache");
      }
    } catch (err) {
      console.error("Clear cache error:", err);
      alert("Error clearing cache: " + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScanProgress = () => {
    if (!isScanning) return null;
    return "Scanning folder... Please wait.";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 flex items-center">
          🧹 <span className="ml-2">Local Storage Cleaner</span>
        </h1>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-800">Total Files</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="font-semibold text-red-800">Duplicates</div>
              <div className="text-2xl font-bold text-red-600">{stats.duplicateCount}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-semibold text-green-800">Total Size</div>
              <div className="text-xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="font-semibold text-purple-800">Folder</div>
              <div className="text-sm font-medium text-purple-600 truncate">{folderName}</div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFolderPick}
            disabled={isScanning}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
              isScanning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all'
            }`}
          >
            {isScanning ? '🔄' : '📁'} 
            <span className="ml-2">{isScanning ? 'Scanning...' : 'Pick Folder to Scan'}</span>
          </button>
          
          {scanComplete && (
            <button
              onClick={handleClearCache}
              className="px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all flex items-center"
            >
              🗑️ <span className="ml-2">Clear Cache</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-800 font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <span className="animate-spin mr-2">🔄</span>
              <span className="text-blue-800">{getScanProgress()}</span>
            </div>
          </div>
        )}
      </div>

      {scanComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* All Files */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-semibold flex items-center">
                📄 <span className="ml-2">All Files ({files?.length || 0})</span>
              </h2>
            </div>
            <div className="p-4">
              <div className="max-h-96 overflow-y-auto">
                {files?.length > 0 ? files.slice(0, 50).map((file, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.fullPath, file.name)}
                      className="ml-2 text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                      title="Remove from scan"
                    >
                      🗑️
                    </button>
                  </div>
                )) : <p className="text-gray-500 text-center py-4">No files found</p>}
                {files?.length > 50 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Showing first 50 files of {files.length}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Duplicate Files */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-red-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-semibold flex items-center">
                🔄 <span className="ml-2">Duplicate Files ({duplicates?.length || 0})</span>
              </h2>
            </div>
            <div className="p-4">
              <div className="max-h-96 overflow-y-auto">
                {duplicateGroups?.length > 0 ? duplicateGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-2 flex items-center">
                      <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs mr-2">
                        Group {groupIndex + 1}
                      </span>
                      {group.length} identical files
                    </p>
                    {group.map((file, i) => (
                      <div key={i} className="flex justify-between items-center py-1 pl-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate" title={file.fullPath}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file.fullPath, file.name)}
                          className="ml-2 text-red-600 hover:text-red-800 text-xs px-1 py-1 rounded hover:bg-red-100"
                          title="Remove from scan"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )) : <p className="text-gray-500 text-center py-4">No duplicates found</p>}
              </div>
            </div>
          </div>

          {/* Largest Files */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-yellow-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-semibold flex items-center">
                📊 <span className="ml-2">Largest Files ({largest?.length || 0})</span>
              </h2>
            </div>
            <div className="p-4">
              <div className="max-h-96 overflow-y-auto">
                {largest?.length > 0 ? largest.map((file, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0 hover:bg-yellow-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-yellow-600 font-semibold">{formatFileSize(file.size)}</p>
                        <span className="text-xs text-gray-500">#{i + 1}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.fullPath, file.name)}
                      className="ml-2 text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                      title="Remove from scan"
                    >
                      🗑️
                    </button>
                  </div>
                )) : <p className="text-gray-500 text-center py-4">No large files found</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!scanComplete && !isScanning && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="mb-4 text-6xl">📁</div>
          <p className="text-gray-500 text-lg mb-2">Select a folder to start scanning</p>
          <p className="text-gray-400 text-sm">
            Find duplicate files and large files taking up space on your computer
          </p>
        </div>
      )}
    </div>
  );
};

export default LocalDashboard;