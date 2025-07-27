import React, { useState, useEffect } from 'react';
import { Search, File, Mail, HardDrive, BarChart3, Trash2, Settings, CheckCircle2, Shield, Zap, TrendingUp, AlertTriangle, Clock, RefreshCw, Eye, Filter } from 'lucide-react';
import DriveDashboard from './components/Drive/DriveDashboard';
import GmailDashboard from './components/Gmail/GmailDashboard';
import LocalDashboard from './components/Local/LocalDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [stats] = useState({
    totalFiles: 0,
    duplicates: 0,
    spaceSaved: 0,
    lastScan: null
  });
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check authentication status
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      setIsAuthenticated(true);
    const newURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newURL);
    }
  }, []);

  const connectGoogleDrive = () => {
    window.location.href = "http://localhost:5000/auth/google/login";
  };

  const NavButton = ({ icon: Icon, label, tabKey, count }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
        activeTab === tabKey
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon size={20} className={`${activeTab === tabKey ? 'text-white' : 'text-gray-500'}`} />
      <span className="font-medium">{label}</span>
      {count && (
        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
          activeTab === tabKey ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-6 border border-${color}-200 hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}-500 rounded-xl shadow-sm`}>
          <Icon size={24} className="text-white" />
        </div>
        <TrendingUp size={16} className={`text-${color}-500`} />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
      {subtitle && <p className={`text-${color}-600 text-xs mt-1 font-medium`}>{subtitle}</p>}
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, description, action, status, buttonText = "Analyze Now" }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors duration-200">
          <Icon size={24} className="text-gray-700" />
        </div>
        {status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'completed' ? 'bg-green-100 text-green-800' :
            status === 'scanning' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
            'bg-gray-100 text-gray-600'
          }`}>
            {status === 'completed' ? 'Completed' :
             status === 'scanning' ? 'Scanning...' : 'Ready'}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{description}</p>
      <button
        onClick={action}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
      >
        {buttonText}
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-xl">
              <Search size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Duplicatro</h1>
            <p className="text-gray-600 text-lg">Intelligent duplicate detection across all your digital spaces</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 size={16} className="text-green-600" />
                </div>
                <span className="font-medium">Analyze Gmail, Google Drive & Local Files</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="p-2 bg-green-100 rounded-full">
                  <Shield size={16} className="text-green-600" />
                </div>
                <span className="font-medium">Secure & Privacy-Focused</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="p-2 bg-green-100 rounded-full">
                  <Zap size={16} className="text-green-600" />
                </div>
                <span className="font-medium">AI-Powered Smart Detection</span>
              </div>
            </div>
            
            <button
              onClick={connectGoogleDrive}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              Connect with Google
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
              By connecting, you agree to our Terms of Service and Privacy Policy.<br/>
              Your data remains secure and private.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <RefreshCw size={20} />
              </button>
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
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2 mb-8">
              <NavButton icon={BarChart3} label="Dashboard" tabKey="dashboard" />
              <NavButton icon={Mail} label="Gmail Analysis" tabKey="gmail" count={stats.duplicates > 0 ? stats.duplicates : null} />
              <NavButton icon={HardDrive} label="Google Drive" tabKey="drive" />
              <NavButton icon={File} label="Local Files" tabKey="local" />
              <NavButton icon={Trash2} label="Cleanup Center" tabKey="cleanup" />
            </nav>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Zap size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Pro Tip</span>
              </div>
              <p className="text-xs text-purple-700 leading-relaxed">
                Run regular scans to keep your storage optimized and organized. Set up automatic weekly scans for best results.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
                  <p className="text-gray-600 text-lg">Monitor your storage optimization across all platforms</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={File}
                    title="Total Files Scanned"
                    value="12,847"
                    subtitle="+234 this week"
                    color="blue"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    title="Duplicates Found"
                    value="1,203"
                    subtitle="23.4 GB wasted"
                    color="orange"
                  />
                  <StatCard
                    icon={HardDrive}
                    title="Space Saved"
                    value="45.2 GB"
                    subtitle="Last 30 days"
                    color="green"
                  />
                  <StatCard
                    icon={Clock}
                    title="Last Scan"
                    value="2 hrs ago"
                    subtitle="All systems active"
                    color="purple"
                  />
                </div>

                {/* Quick Actions */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Quick Analysis</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                      <Eye size={16} />
                      <span>View All</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                      icon={Mail}
                      title="Gmail Cleanup"
                      description="Find duplicate emails, large attachments, promotional clutter, and organize your inbox intelligently."
                      action={() => setActiveTab('gmail')}
                      status="ready"
                      buttonText="Start Gmail Scan"
                    />
                    <FeatureCard
                      icon={HardDrive}
                      title="Drive Analysis"
                      description="Identify duplicate files, optimize Google Drive storage, and manage file versions efficiently."
                      action={() => setActiveTab('drive')}
                      status="completed"
                      buttonText="Analyze Drive"
                    />
                    <FeatureCard
                      icon={File}
                      title="Local Scanner"
                      description="Scan your computer for duplicate files, large files, and optimize local storage space."
                      action={() => setActiveTab('local')}
                      status="scanning"
                      buttonText="Choose Folder"
                    />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { action: "Deleted 45 duplicate photos from Drive", time: "2 hours ago", type: "drive", size: "2.3 GB" },
                      { action: "Cleaned 127 promotional emails", time: "1 day ago", type: "gmail", size: "156 MB" },
                      { action: "Scanned Downloads folder", time: "3 days ago", type: "local", size: "4.1 GB" },
                      { action: "Optimized inbox organization", time: "1 week ago", type: "gmail", size: "89 MB" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                        <div className={`p-3 rounded-xl shadow-sm ${
                          activity.type === 'drive' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'gmail' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {activity.type === 'drive' ? <HardDrive size={18} /> :
                           activity.type === 'gmail' ? <Mail size={18} /> : <File size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">{activity.time}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs font-medium text-green-600">Saved {activity.size}</p>
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gmail' && token && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Gmail Analysis</h2>
                    <p className="text-gray-600 text-lg">Clean up your inbox and optimize email storage</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <Filter size={20} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <GmailDashboard token={token} />
                </div>
              </div>
            )}

            {activeTab === 'drive' && token && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Google Drive</h2>
                    <p className="text-gray-600 text-lg">Optimize your Google Drive storage and organization</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <Filter size={20} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Local File Scanner</h2>
                    <p className="text-gray-600 text-lg">Scan your computer for duplicate files and space optimization</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <Filter size={20} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <RefreshCw size={20} />
                    </button>
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
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 px-6 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium"
                      >
                        Scan Gmail
                      </button>
                      <button 
                        onClick={() => setActiveTab('drive')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-2 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium"
                      >
                        Scan Drive
                      </button>
                      <button 
                        onClick={() => setActiveTab('local')}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
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
}

export default App;