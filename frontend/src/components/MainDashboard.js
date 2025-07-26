import React, { useState, useEffect } from "react";
import { Search, Mail, HardDrive, File, BarChart3, Trash2, Settings, AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap, RefreshCw, Eye, Shield } from 'lucide-react';
import DriveDashboard from "./Drive/DriveDashboard";
import GmailDashboard from "./Gmail/GmailDashboard";
import LocalDashboard from "./Local/LocalDashboard";

const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalFiles: 0,
    duplicates: 0,
    spaceSaved: 0,
    lastScan: null
  });

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    if (token) {
      // Mock user data - replace with actual API call
      setUser({ 
        name: "John Doe", 
        email: "john@example.com",
        avatar: null
      });
      
      // Fetch actual stats from your backend
      fetchUserStats();
    }
  }, [token]);

  const fetchUserStats = async () => {
    try {
      // Replace with actual API calls to get user statistics
      setStats({
        totalFiles: 12847,
        duplicates: 1203,
        spaceSaved: "45.2 GB",
        lastScan: "2 hours ago"
      });
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl mb-6 shadow-xl">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Please authenticate with Google to access your dashboard and start analyzing your files.
          </p>
          <button 
            onClick={() => window.location.href = "http://localhost:5000/auth/google/login"}
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
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
      }`}
      title={description}
    >
      <Icon size={20} className={`${activeTab === tabKey ? 'text-white' : 'text-gray-500'}`} />
      <div className="flex-1 text-left">
        <span className="font-medium block">{label}</span>
        {description && (
          <span className={`text-xs ${activeTab === tabKey ? 'text-white/70' : 'text-gray-400'}`}>
            {description}
          </span>
        )}
      </div>
      {count && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          activeTab === tabKey ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue", trend }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-6 border border-${color}-200 hover:shadow-lg transition-all duration-200 cursor-pointer group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}-500 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-${color}-600`}>
            <TrendingUp size={16} />
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      {subtitle && <p className={`text-${color}-600 text-xs mt-1 font-medium`}>{subtitle}</p>}
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, action, status, color = "blue" }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-${color}-100 rounded-xl group-hover:bg-${color}-200 transition-colors duration-200`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        {status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'active' ? 'bg-green-100 text-green-800' :
            status === 'scanning' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
            'bg-gray-100 text-gray-600'
          }`}>
            {status === 'active' ? 'Active' :
             status === 'scanning' ? 'Scanning...' : 'Ready'}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{description}</p>
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
                  <h1 className="text-xl font-bold text-gray-900">Duplicatro</h1>
                  <p className="text-xs text-gray-500">Smart Duplicate Detection</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-xl px-3 py-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-sm text-gray-700">All systems operational</span>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <Settings size={20} />
              </button>
              
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
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
              <NavButton 
                icon={Trash2} 
                label="Cleanup Center" 
                tabKey="cleanup"
                description="Review & manage duplicates"
              />
            </nav>
            
            
            {/* System Status */}
            <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-900">System Status</span>
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
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
                  <p className="text-gray-600 text-lg">Monitor your storage optimization across all platforms</p>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={File}
                    title="Total Files Scanned"
                    value={stats.totalFiles.toLocaleString()}
                    subtitle="+234 this week"
                    color="blue"
                    trend="+12%"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    title="Duplicates Found"
                    value={stats.duplicates.toString()}
                    subtitle="23.4 GB wasted space"
                    color="orange"
                    trend="-8%"
                  />
                  <StatCard
                    icon={HardDrive}
                    title="Space Saved"
                    value={stats.spaceSaved}
                    subtitle="Last 30 days"
                    color="green"
                    trend="+23%"
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
                    <h3 className="text-xl font-semibold text-gray-900">Quick Analysis</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors duration-200">
                      <Eye size={16} />
                      <span>View All Reports</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard
                      icon={Mail}
                      title="Gmail Cleanup"
                      description="Find duplicate emails, large attachments, promotional clutter, and organize your inbox intelligently."
                      action={() => setActiveTab('gmail')}
                      status="active"
                      color="red"
                    />
                    <QuickActionCard
                      icon={HardDrive}
                      title="Drive Analysis"
                      description="Identify duplicate files, optimize Google Drive storage, and manage file versions efficiently."
                      action={() => setActiveTab('drive')}
                      status="ready"
                      color="blue"
                    />
                    <QuickActionCard
                      icon={File}
                      title="Local Scanner"
                      description="Scan your computer for duplicate files, large files, and optimize local storage space."
                      action={() => setActiveTab('local')}
                      status="scanning"
                      color="green"
                    />
                  </div>
                </div>

                {/* Enhanced Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>

                  </div>
                  <div className="space-y-4">
                    {[
                      { 
                        action: "Deleted 45 duplicate photos from Drive", 
                        time: "2 hours ago", 
                        type: "drive", 
                        size: "2.3 GB",
                        impact: "high"
                      },
                      { 
                        action: "Cleaned 127 promotional emails", 
                        time: "1 day ago", 
                        type: "gmail", 
                        size: "156 MB",
                        impact: "medium"
                      },
                      { 
                        action: "Scanned Downloads folder", 
                        time: "3 days ago", 
                        type: "local", 
                        size: "4.1 GB",
                        impact: "high"
                      },
                      { 
                        action: "Optimized inbox organization", 
                        time: "1 week ago", 
                        type: "gmail", 
                        size: "89 MB",
                        impact: "low"
                      },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer group">
                        <div className={`p-3 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200 ${
                          activity.type === 'drive' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'gmail' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {activity.type === 'drive' ? <HardDrive size={18} /> :
                           activity.type === 'gmail' ? <Mail size={18} /> : <File size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            {activity.action}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">{activity.time}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs font-medium text-green-600">Saved {activity.size}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              activity.impact === 'high' ? 'bg-green-100 text-green-700' :
                              activity.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {activity.impact} impact
                            </span>
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-green-500 group-hover:scale-110 transition-transform duration-200" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage Health Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail size={16} className="text-red-500" />
                          <span className="text-sm text-gray-700">Gmail</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: '75%'}}></div>
                          </div>
                          <span className="text-xs text-gray-500">75%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <HardDrive size={16} className="text-blue-500" />
                          <span className="text-sm text-gray-700">Google Drive</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                          </div>
                          <span className="text-xs text-gray-500">45%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <File size={16} className="text-green-500" />
                          <span className="text-sm text-gray-700">Local Storage</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '60%'}}></div>
                          </div>
                          <span className="text-xs text-gray-500">60%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Suggestions</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Gmail needs attention</p>
                          <p className="text-xs text-yellow-700">127 promotional emails found</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <CheckCircle2 size={16} className="text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Drive optimization available</p>
                          <p className="text-xs text-blue-700">45 duplicate files detected</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Zap size={16} className="text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Local scan recommended</p>
                          <p className="text-xs text-green-700">Downloads folder not scanned</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gmail' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Gmail Analysis</h2>
                    <p className="text-gray-600 text-lg">Clean up your inbox and optimize email storage</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <GmailDashboard token={token} />
                </div>
              </div>
            )}

            {activeTab === 'drive' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Google Drive</h2>
                    <p className="text-gray-600 text-lg">Optimize your Google Drive storage and organization</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <DriveDashboard token={token} />
                </div>
              </div>
            )}

            {activeTab === 'local' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">🧹 Local File Scanner</h2>
                    <p className="text-gray-600 text-lg">Scan your computer for duplicate files and space optimization</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <LocalDashboard />
                </div>
              </div>
            )}

            {activeTab === 'cleanup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Cleanup Center</h2>
                  <p className="text-gray-600 text-lg">Review and manage identified duplicates across all platforms</p>
                </div>
                
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                      <Trash2 size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Items to Clean</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                      Run analysis on your Gmail, Google Drive, or local files to discover duplicates and optimization opportunities.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button 
                        onClick={() => setActiveTab('gmail')}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-6 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        Scan Gmail
                      </button>
                      <button 
                        onClick={() => setActiveTab('drive')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        Scan Drive
                      </button>
                      <button 
                        onClick={() => setActiveTab('local')}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        Scan Local
                      </button>
                    </div>
                  </div>
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