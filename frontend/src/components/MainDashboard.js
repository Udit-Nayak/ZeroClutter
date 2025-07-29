import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Mail,
  HardDrive,
  File,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  Shield,
  LogOut,
  ChevronDown,
  ChevronUp,
  FolderOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import DriveDashboard from "./Drive/DriveDashboard";
import GmailDashboard from "./Gmail/GmailDashboard";
import LocalDashboard from "./Local/LocalDashboard";

const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    duplicates: 0,
    spaceSaved: 0,
    lastScan: null,
  });
  const [storageData, setStorageData] = useState({
    total: {
      used: 0,
      limit: 0,
      percentage: 0,
      formattedUsed: "0 B",
      formattedLimit: "0 B",
    },
    gmail: {
      used: 0,
      percentage: 0,
      formattedUsed: "0 B",
    },
    drive: {
      used: 0,
      percentage: 0,
      formattedUsed: "0 B",
    },
    photos: {
      used: 0,
      percentage: 0,
      formattedUsed: "0 B",
    },
    trash: {
      used: 0,
      percentage: 0,
      formattedUsed: "0 B",
    },
  });
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  const [spamStats, setSpamStats] = useState({
    count: 0,
    totalSize: 0,
    formattedSize: "0 B",
  });
  const [oldUnreadStats, setOldUnreadStats] = useState({
    count: 0,
    formattedSize: "0 B",
  });
  const [isRescanning, setIsRescanning] = useState(false);
  const [promotionalStats, setPromotionalStats] = useState({
    count: 0,
    totalSize: 0,
    formattedSize: "0 B",
  });
  const [duplicateStats, setDuplicateStats] = useState({
    duplicateCount: 0,
    wastedSpace: 0,
    wastedSpaceFormatted: "0 B",
    duplicateGroups: 0,
  });
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const fetchStorageQuota = useCallback(async () => {
    if (!token) return;

    try {
      console.log("Fetching storage quota...");
      const res = await fetch("http://localhost:5000/api/user/storage-quota", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(
          "Storage quota fetch failed:",
          res.status,
          res.statusText
        );
        const errorData = await res.json();

        // Use fallback data if API fails but still has fallback data
        if (errorData.data) {
          console.log("Using fallback storage data");
          setStorageData(errorData.data);
        }
        return;
      }

      const data = await res.json();
      console.log("Storage quota data received:", data);

      // Validate data structure before setting
      if (data && data.total && typeof data.total.percentage === "number") {
        setStorageData(data);
      } else {
        console.warn("Invalid storage data structure received:", data);
      }
    } catch (error) {
      console.error("Failed to fetch storage quota:", error);
    }
  }, [token]);

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;

    try {
      console.log("Fetching user profile with token:", token);
      const res = await fetch("http://localhost:5000/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        console.error("Profile fetch failed:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      console.log("User profile data:", data);
      setUser(data); // { name, email, picture }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }, [token]);

  const fetchSpamStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/gmail/spam", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch spam emails");

      const data = await res.json();

      // Calculate total size (approximate 25KB per spam email - typically smaller than promotional)
      const approximateSize = data.length * 25 * 1024; // 25KB per email

      const formatBytes = (bytes) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
      };

      setSpamStats({
        count: data.length,
        totalSize: approximateSize,
        formattedSize: formatBytes(approximateSize),
      });
    } catch (err) {
      console.error("Error fetching spam stats:", err);
    }
  }, [token]);

  const fetchOldUnreadStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/gmail/old-unread", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch old unread emails");
      const data = await res.json();

      const approximateSize = data.length * 20 * 1024; // 20KB per old unread email
      setOldUnreadStats({
        count: data.length,
        formattedSize: formatBytes(approximateSize),
      });
    } catch (err) {
      console.error("Error fetching old unread stats:", err);
    }
  }, [token]);
  // NEW FUNCTION: Fetch duplicate statistics
  const fetchDuplicateStats = useCallback(async () => {
    if (!token) return;

    try {
      console.log("Fetching duplicate stats...");
      const res = await fetch(
        "http://localhost:5000/api/driveFiles/duplicates/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error(
          "Duplicate stats fetch failed:",
          res.status,
          res.statusText
        );
        return;
      }

      const data = await res.json();
      console.log("Duplicate stats data:", data);
      setDuplicateStats(data);
    } catch (error) {
      console.error("Failed to fetch duplicate stats:", error);
    }
  }, [token]);

  const fetchPromotionalStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/gmail/promotions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch promotional emails");

      const data = await res.json();

      // Calculate total size (approximate 50KB per promotional email)
      const approximateSize = data.length * 50 * 1024; // 50KB per email

      const formatBytes = (bytes) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
      };

      setPromotionalStats({
        count: data.length,
        totalSize: approximateSize,
        formattedSize: formatBytes(approximateSize),
      });
    } catch (err) {
      console.error("Error fetching promotional stats:", err);
    }
  }, [token]);

  const fetchRecentActivities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/activity/recent", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch activity logs");

      const data = await res.json();
      setRecentActivities(data.activities);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    }
  }, [token]);

  const StorageHealthCard = () => {
    const getStorageColor = (percentage) => {
      if (percentage >= 90) return "red";
      if (percentage >= 75) return "yellow";
      return "blue";
    };

    const storageColor = getStorageColor(storageData.total.percentage);

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Storage {storageData.total.percentage}% full
          </h2>
          <p className="text-gray-600 text-sm">
            Your storage is shared across Google Photos, Drive, Gmail and more
          </p>
        </div>

        {/* Main Storage Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Storage used
            </span>
            <span className="text-sm font-medium text-gray-900">
              {storageData.total.formattedUsed} of{" "}
              {storageData.total.formattedLimit}
            </span>
          </div>

          {/* Multi-segment progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden relative">
            <div className="h-full flex">
              {/* Google Photos segment - Yellow/Orange */}
              <div
                className="bg-yellow-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.min(storageData.photos.percentage, 100)}%`,
                }}
                title={`Google Photos: ${storageData.photos.formattedUsed}`}
              />
              {/* Google Drive segment - Blue */}
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.min(storageData.drive.percentage, 100)}%`,
                }}
                title={`Google Drive: ${storageData.drive.formattedUsed}`}
              />
              {/* Gmail segment - Red */}
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.min(storageData.gmail.percentage, 100)}%`,
                }}
                title={`Gmail: ${storageData.gmail.formattedUsed}`}
              />
            </div>
          </div>
        </div>

        {/* Usage Details Toggle */}
        <button
          onClick={() => setShowUsageDetails(!showUsageDetails)}
          className="flex items-center justify-center w-full py-3 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 rounded-lg hover:bg-gray-50"
        >
          <span className="mr-2 font-medium">Usage details</span>
          {showUsageDetails ? (
            <ChevronUp
              size={16}
              className="transition-transform duration-200"
            />
          ) : (
            <ChevronDown
              size={16}
              className="transition-transform duration-200"
            />
          )}
        </button>

        {/* Detailed Usage Breakdown */}
        {showUsageDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Google Photos */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    Google Photos
                  </span>
                  <span className="text-xs text-gray-500">
                    {storageData.photos.percentage}% of total storage
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {storageData.photos.formattedUsed}
                </span>
              </div>
            </div>

            {/* Google Drive */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    Google Drive
                  </span>
                  <span className="text-xs text-gray-500">
                    {storageData.drive.percentage}% of total storage
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {storageData.drive.formattedUsed}
                </span>
              </div>
            </div>

            {/* Gmail */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    Gmail
                  </span>
                  <span className="text-xs text-gray-500">
                    {storageData.gmail.percentage}% of total storage
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {storageData.gmail.formattedUsed}
                </span>
              </div>
            </div>

            {/* Storage Status Indicator */}
            <div
              className={`mt-4 p-3 rounded-lg border-l-4 ${
                storageColor === "red"
                  ? "bg-red-50 border-red-400"
                  : storageColor === "yellow"
                  ? "bg-yellow-50 border-yellow-400"
                  : "bg-blue-50 border-blue-400"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  storageColor === "red"
                    ? "text-red-800"
                    : storageColor === "yellow"
                    ? "text-yellow-800"
                    : "text-blue-800"
                }`}
              >
                {storageColor === "red"
                  ? "⚠️ Storage almost full"
                  : storageColor === "yellow"
                  ? "💾 Storage filling up"
                  : "✅ Storage healthy"}
              </p>
              <p
                className={`text-xs mt-1 ${
                  storageColor === "red"
                    ? "text-red-600"
                    : storageColor === "yellow"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              >
                {storageColor === "red"
                  ? "Consider cleaning up files or upgrading storage"
                  : storageColor === "yellow"
                  ? "You may want to review and clean up files"
                  : "Your storage usage looks good"}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          <button
            onClick={fetchStorageQuota}
            className="flex items-center justify-center w-full py-3 px-4 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium border border-blue-200 hover:border-blue-300"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh Storage Data
          </button>

          {storageData.total.percentage > 75 && (
            <button
              onClick={() => {
                // Navigate to cleanup sections
                setActiveTab("gmail");
              }}
              className={`flex items-center justify-center w-full py-3 px-4 text-sm text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md ${
                storageColor === "red"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              <AlertTriangle size={16} className="mr-2" />
              Free Up Space
            </button>
          )}
        </div>
      </div>
    );
  };
  useEffect(() => {
    if (token) {
      fetchRecentActivities();
      fetchPromotionalStats();
      fetchSpamStats();
      fetchOldUnreadStats();
    }
  }, [
    token,
    fetchRecentActivities,
    fetchPromotionalStats,
    fetchSpamStats,
    fetchOldUnreadStats,
  ]);
  // NEW FUNCTION: Handle Drive Rescan
  const handleRescanDriveFiles = async () => {
    if (!token) return;

    try {
      setIsRescanning(true);
      console.log("Starting drive rescan...");

      const response = await fetch(
        "http://localhost:5000/api/driveFiles/rescan",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error("Failed to rescan drive");

      // Refresh user profile and duplicate stats after rescan
      await Promise.all([
        fetchUserProfile(),
        fetchDuplicateStats(),
        fetchRecentActivities(),
        fetchPromotionalStats(),
      ]);

      alert("Drive rescan completed and files updated!");
    } catch (err) {
      console.error("Failed to rescan drive:", err);
      alert("Failed to rescan drive. Please try again.");
    } finally {
      setIsRescanning(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("🚪 Initiating logout...");
      const res = await fetch("http://localhost:5000/api/user/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();
      console.log("📤 Logout response:", data);
      if (res.ok) {
        const url = new URL(window.location);
        url.searchParams.delete("token");
        window.history.replaceState({}, document.title, url.pathname);

        window.location.reload();
      } else {
        console.error("Logout failed:", data);
      }
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  const fetchUserStats = useCallback(async () => {
    try {
      setStats({
        totalFiles: user?.drive_file_count ?? 0,
        duplicates: duplicateStats.duplicateCount,
        spaceSaved: duplicateStats.wastedSpaceFormatted,
        lastScan: user?.last_opened_at
          ? formatDistanceToNow(new Date(user.last_opened_at), {
              addSuffix: true,
            })
          : "Not available",
      });
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.drive_file_count, user?.last_opened_at, duplicateStats]); // Added duplicateStats dependency

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchStorageQuota();
      fetchDuplicateStats();
      // Fetch duplicate stats
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile, fetchDuplicateStats, fetchStorageQuota]);

  // Update stats when duplicateStats or user changes
  useEffect(() => {
    if (user || duplicateStats.duplicateCount > 0) {
      fetchUserStats();
    }
  }, [user, duplicateStats, fetchUserStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl mb-6 shadow-xl">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Please authenticate with Google to access your dashboard and start
            analyzing your files.
          </p>
          <button
            onClick={() =>
              (window.location.href = "http://localhost:5000/auth/google/login")
            }
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-8 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Connect with Google
          </button>
        </div>
      </div>
    );
  }

  const NavButton = ({ icon: Icon, label, tabKey, count, description }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
        activeTab === tabKey
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
          : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      }`}
      title={description}
    >
      <Icon
        size={20}
        className={`${activeTab === tabKey ? "text-white" : "text-gray-500"}`}
      />
      <div className="flex-1 text-left">
        <span className="font-medium block">{label}</span>
        {description && (
          <span
            className={`text-xs ${
              activeTab === tabKey ? "text-white/70" : "text-gray-400"
            }`}
          >
            {description}
          </span>
        )}
      </div>
      {count && (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            activeTab === tabKey
              ? "bg-white/20 text-white"
              : "bg-red-100 text-red-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div
      className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-6 border border-${color}-200 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 bg-${color}-500 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200`}
        >
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      {subtitle && (
        <p className={`text-${color}-600 text-xs mt-1 font-medium`}>
          {subtitle}
        </p>
      )}
    </div>
  );

  const QuickActionCard = ({
    icon: Icon,
    title,
    description,
    action,
    status,
    color = "blue",
  }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 bg-${color}-100 rounded-xl group-hover:bg-${color}-200 transition-colors duration-200`}
        >
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        {status && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : status === "scanning"
                ? "bg-yellow-100 text-yellow-800 animate-pulse"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {status === "active"
              ? "Active"
              : status === "scanning"
              ? "Scanning..."
              : "Ready"}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {description}
      </p>
      <button
        onClick={action}
        className={`w-full bg-gradient-to-r from-${color}-500 to-${color}-600 text-white py-3 px-4 rounded-xl hover:from-${color}-600 hover:to-${color}-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5`}
      >
        Get Started
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm">
                  <Search size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Duplicatro
                  </h1>
                  <p className="text-xs text-gray-500">
                    Smart Duplicate Detection
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-xl px-3 py-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-sm text-gray-700">
                  All systems operational
                </span>
              </div>

              {/* Avatar or Initials */}
              <div className="w-10 h-10 rounded-full shadow-sm overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Name & Email */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "Loading..."}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || "Loading..."}
                </p>
              </div>
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-100 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Enhanced Sidebar */}
          <div className="w-72 flex-shrink-0">
            <nav className="space-y-2 mb-8">
              <NavButton
                icon={BarChart3}
                label="Dashboard"
                tabKey="dashboard"
                description="Overview & analytics"
              />
              <NavButton
                icon={Mail}
                label="Gmail Analysis"
                tabKey="gmail"
                description="Email cleanup & organization"
              />
              <NavButton
                icon={HardDrive}
                label="Google Drive"
                tabKey="drive"
                description="Cloud storage optimization"
              />
              <NavButton
                icon={File}
                label="Local Files"
                tabKey="local"
                description="Computer file scanner"
              />
            </nav>

            {/* System Status */}
            <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  System Status
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700">Gmail API</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700">Drive API</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700">Scanner</span>
                  <span className="text-green-600 font-medium">Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1">
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Dashboard Overview
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Monitor your storage optimization across all platforms
                  </p>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={File}
                    title="Total Drive Files Scanned"
                    value={stats.totalFiles.toLocaleString()}
                    subtitle="Status: Up to Date"
                    color="blue"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    title="Duplicates Found"
                    value={stats.duplicates.toString()}
                    subtitle={`${duplicateStats.wastedSpaceFormatted} wasted space`}
                    color="yellow"
                  />
                  <StatCard
                    icon={HardDrive}
                    title="Space That Can Be Saved"
                    value={duplicateStats.wastedSpaceFormatted}
                    subtitle={`${duplicateStats.duplicateGroups} duplicate groups`}
                    color="green"
                  />
                  <StatCard
                    icon={Clock}
                    title="Last Scan"
                    value={stats.lastScan}
                    subtitle="All systems active"
                    color="purple"
                  />
                </div>

                {/* Enhanced Quick Actions */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Quick Analysis
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard
                      icon={Mail}
                      title="Gmail Cleanup"
                      description="Find duplicate emails, large attachments, promotional clutter, and organize your inbox."
                      action={() => setActiveTab("gmail")}
                      status="active"
                      color="red"
                    />
                    <QuickActionCard
                      icon={HardDrive}
                      title="Drive Analysis"
                      description="Identify duplicate files, optimize Google Drive storage, and manage file versions efficiently."
                      action={() => setActiveTab("drive")}
                      status="ready"
                      color="blue"
                    />
                    <QuickActionCard
                      icon={File}
                      title="Local Scanner"
                      description="Scan your computer for duplicate files, large files, and optimize local storage space."
                      action={() => setActiveTab("local")}
                      status="scanning"
                      color="green"
                    />
                  </div>
                </div>

                {/* Enhanced Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Recent Activity
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {/* First card - Dynamic duplicate data from dashboard stats */}
                    {duplicateStats.duplicateCount > 0 && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer group">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                          <HardDrive size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            Found {duplicateStats.duplicateCount} duplicate
                            files in Drive
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs font-medium text-green-600">
                              Can save {duplicateStats.wastedSpaceFormatted}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2
                          size={16}
                          className="text-green-500 group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    )}

                    {/* Second card - Promotional emails */}
                    {promotionalStats.count > 0 && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer group">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                          <Mail size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            Detected {promotionalStats.count} promotional emails
                            in Gmail
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs font-medium text-green-600">
                              Can save {promotionalStats.formattedSize}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2
                          size={16}
                          className="text-green-500 group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    )}

                    {/* Third card - Spam emails */}
                    {spamStats.count > 0 && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer group">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                          <AlertTriangle size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            Found {spamStats.count} spam emails in Gmail
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs font-medium text-green-600">
                              Can save {spamStats.formattedSize}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2
                          size={16}
                          className="text-green-500 group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    )}

                    {/* Sixth card - Old unread emails */}
                    {oldUnreadStats.count > 0 && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer group">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                          <Clock size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            Found {oldUnreadStats.count} old unread emails (6+
                            months)
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs font-medium text-green-600">
                              Can clean {oldUnreadStats.formattedSize}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2
                          size={16}
                          className="text-green-500 group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    )}

                    {/* Rest of the activities from API */}
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer group"
                      >
                        <div
                          className={`p-3 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200 ${
                            activity.type === "drive"
                              ? "bg-blue-100 text-blue-600"
                              : activity.type === "gmail"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {activity.type === "drive" ? (
                            <HardDrive size={18} />
                          ) : activity.type === "gmail" ? (
                            <Mail size={18} />
                          ) : (
                            <File size={18} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            {activity.action}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(activity.time), {
                                addSuffix: true,
                              })}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs font-medium text-green-600">
                              Saved {activity.size}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2
                          size={16}
                          className="text-green-500 group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage Health Overview - Updated with real data */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Replace the old storage health card with the new one */}
                  <StorageHealthCard />

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Optimization Suggestions
                    </h3>
                    <div className="space-y-3">
                      {/* Gmail Promotional Emails Card */}
                      <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertTriangle
                          size={16}
                          className="text-yellow-600 mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Gmail needs attention
                          </p>
                          <p className="text-xs text-yellow-700">
                            {promotionalStats.count > 0
                              ? `${promotionalStats.count} promotional emails found`
                              : "No promotional emails detected"}
                          </p>
                        </div>
                      </div>

                      {/* Drive Duplicates Card */}
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <CheckCircle2
                          size={16}
                          className="text-blue-600 mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Drive optimization available
                          </p>
                          <p className="text-xs text-blue-700">
                            {duplicateStats.duplicateCount > 0
                              ? `${duplicateStats.duplicateCount} duplicate files detected`
                              : "No duplicate files found"}
                          </p>
                        </div>
                      </div>

                      {/* Local Scan Card - Keep as placeholder/encouragement */}
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Zap size={16} className="text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Local scan recommended
                          </p>
                          <p className="text-xs text-green-700">
                            Downloads folder not scanned recently
                          </p>
                        </div>
                      </div>

                      {/* Summary Card - Show total potential savings */}
                      {(promotionalStats.count > 0 ||
                        duplicateStats.duplicateCount > 0 ||
                        spamStats.count > 0) && (
                        <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                          <CheckCircle2
                            size={16}
                            className="text-blue-600 mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Total optimization potential
                            </p>
                            <p className="text-xs text-blue-700">
                              Can save approximately{" "}
                              {
                                // Calculate total potential savings
                                (() => {
                                  const promotionalSize =
                                    promotionalStats.totalSize || 0;
                                  const spamSize = spamStats.totalSize || 0;
                                  const duplicateSize =
                                    duplicateStats.wastedSpace || 0;
                                  const totalBytes =
                                    promotionalSize + spamSize + duplicateSize;
                                  return formatBytes(totalBytes);
                                })()
                              }{" "}
                              across all platforms
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Empty State - When no issues found */}
                      {promotionalStats.count === 0 &&
                        duplicateStats.duplicateCount === 0 &&
                        spamStats.count === 0 &&
                        oldUnreadStats.count === 0 && (
                          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <CheckCircle2
                              size={16}
                              className="text-green-600 mt-0.5"
                            />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                All systems optimized!
                              </p>
                              <p className="text-xs text-green-700">
                                No immediate cleanup actions needed
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gmail" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Mail size={30} />
                      <h2 className="text-3xl font-bold text-gray-900">
                        Gmail Analysis
                      </h2>
                    </div>
                    <p className="text-gray-600 text-lg">
                      Clean up your inbox and optimize email storage
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <GmailDashboard token={token} />
                </div>
              </div>
            )}

            {activeTab === "drive" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FolderOpen size={30} />
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Google Drive
                      </h2>
                    </div>
                    <p className="text-gray-600 text-lg">
                      Optimize your Google Drive storage and organization
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleRescanDriveFiles}
                      disabled={isRescanning}
                      className={`p-2 rounded-xl transition-colors duration-200 ${
                        isRescanning
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-400 hover:text-blue-600 hover:bg-blue-100"
                      }`}
                      title={
                        isRescanning ? "Rescanning..." : "Rescan Google Drive"
                      }
                    >
                      <RefreshCw
                        size={20}
                        className={isRescanning ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <DriveDashboard token={token} />
                </div>
              </div>
            )}

            {activeTab === "local" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      🧹 Local File Scanner
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Scan your computer for duplicate files and space
                      optimization
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <LocalDashboard />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
