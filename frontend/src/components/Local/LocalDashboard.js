import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

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


  const checkScanStatus = useCallback(async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/scanstatus`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Scan status response:", response.data);
    const scanStatus = response.data.scanStatus;
    setScanComplete(scanStatus === "completed");
  } catch (error) {
    console.error("Error checking scan status:", error);
  }
}, []);


  useEffect(() => {
    checkScanStatus();
  }, [checkScanStatus]);


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
              contentHash: await generateImprovedFileHash(file),
              fileHandle: entry // Store handle for potential future operations
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

  // Improved file hash generation for better duplicate detection
  const generateImprovedFileHash = async (file) => {
    try {
      // For small files (<10MB), hash the entire content
      if (file.size <= 10 * 1024 * 1024) {
        const buffer = await file.arrayBuffer();
        return await hashBuffer(buffer);
      }
      
      // For larger files, use a more sophisticated approach
      // Hash: beginning + middle + end + metadata
      const chunkSize = 64 * 1024; // 64KB chunks
      const chunks = [];
      
      // Beginning chunk
      chunks.push(file.slice(0, chunkSize));
      
      // Middle chunk
      const middleStart = Math.floor(file.size / 2) - Math.floor(chunkSize / 2);
      chunks.push(file.slice(middleStart, middleStart + chunkSize));
      
      // End chunk
      chunks.push(file.slice(-chunkSize));
      
      // Combine all chunks
      const combinedChunks = [];
      for (const chunk of chunks) {
        const buffer = await chunk.arrayBuffer();
        combinedChunks.push(new Uint8Array(buffer));
      }
      
      // Add file metadata to make hash more unique
      const metadata = `${file.size}-${file.lastModified}-${file.type}`;
      combinedChunks.push(new TextEncoder().encode(metadata));
      
      // Create final buffer and hash
      const totalLength = combinedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const finalBuffer = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of combinedChunks) {
        finalBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      
      return await hashBuffer(finalBuffer.buffer);
      
    } catch (err) {
      console.warn("Error generating improved file hash:", err);
      // Fallback to simple hash
      return generateSimpleFileHash(file);
    }
  };

  // Hash buffer using Web Crypto API
  const hashBuffer = async (buffer) => {
    if (window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 32); // Use longer hash for better uniqueness
    } else {
      // Fallback for older browsers
      return generateSimpleHashFromBuffer(buffer);
    }
  };

  // Simple fallback hash generation
  const generateSimpleFileHash = async (file) => {
    const hashInput = `${file.name}-${file.size}-${file.lastModified}`;
    return btoa(hashInput).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  };

  const generateSimpleHashFromBuffer = (buffer) => {
    const view = new Uint8Array(buffer);
    let hash = 0;
    for (let i = 0; i < Math.min(view.length, 1000); i++) {
      hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
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
    const isConfirmed = window.confirm(
      `⚠️ BROWSER LIMITATION NOTICE ⚠️\n\n` +
      `Due to browser security restrictions, files cannot be automatically deleted from your computer.\n\n` +
      `File: ${fileName}\n\n` +
      `This will only remove the file from the scan results.\n\n` +
      `To actually delete the file, you need to:\n` +
      `1. Navigate to the file location manually\n` +
      `2. Delete it using your file explorer\n\n` +
      `Continue to remove from scan results?`
    );

    if (!isConfirmed) return;

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
        
        alert("✅ File removed from scan results!\n\n📝 Note: To delete the actual file, please use your file explorer.");
      } else {
        throw new Error(result.message || "Failed to remove file from scan");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Error removing file from scan: " + err.message);
    }
  };
  
  const handleClearCache = async () => {
    const isConfirmed = window.confirm("Are you sure?");
    if (isConfirmed) {
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
    return "Scanning folder and analyzing file content... Please wait.";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        
        {/* Browser Limitation Notice */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-yellow-500 mr-2 text-xl">⚠️</span>
            <div>
              <p className="text-yellow-800 font-medium">Browser Security Notice</p>
              <p className="text-yellow-700 text-sm">
                Due to browser security restrictions, this tool can only scan and identify files - it cannot automatically delete them. 
                You'll need to manually delete files using your file explorer.
              </p>
            </div>
          </div>
        </div>
        
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
                    <div className="flex items-center ml-2 space-x-1">
                      <button
                        onClick={() => handleDeleteFile(file.fullPath, file.name)}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                        title="Remove from scan"
                      >
                        🗑️
                      </button>
                    </div>
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
              {duplicateGroups?.length > 0 && (
                <p className="text-red-200 text-sm mt-1">
                  Found {duplicateGroups.length} groups of identical files
                </p>
              )}
            </div>
            <div className="p-4">
              <div className="max-h-96 overflow-y-auto">
                {duplicateGroups?.length > 0 ? duplicateGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-2 flex items-center">
                      <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs mr-2">
                        Group {groupIndex + 1}
                      </span>
                      {group.length} identical files • {formatFileSize(group[0].size)} each
                    </p>
                    {group.map((file, i) => (
                      <div key={i} className="flex justify-between items-center py-1 pl-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate" title={file.fullPath}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">{file.fullPath}</p>
                        </div>
                        <div className="flex items-center ml-2 space-x-1">
                          <button
                            onClick={() => handleDeleteFile(file.fullPath, file.name)}
                            className="text-red-600 hover:text-red-800 text-xs px-1 py-1 rounded hover:bg-red-100"
                            title="Remove from scan"
                          >
                            🗑️
                          </button>
                        </div>
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
                    <div className="flex items-center ml-2 space-x-1">
                      <button
                        onClick={() => handleDeleteFile(file.fullPath, file.name)}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                        title="Remove from scan"
                      >
                        🗑️
                      </button>
                    </div>
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
          <p className="text-gray-400 text-xs mt-2">
            Advanced content-based duplicate detection • Handles renamed files automatically
          </p>
        </div>
      )}
    </div>
  );
};

export default LocalDashboard;