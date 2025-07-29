import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// Import components
import App from "./App";
import MainDashboard from "./components/MainDashboard";
import ReportsPage from "./components/ReportsPage";
import GmailDashboard from "./components/Gmail/GmailDashboard";
import DriveDashboard from "./components/Drive/DriveDashboard";
import LocalDashboard from "./components/Local/LocalDashboard";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 overflow-auto max-h-40">
                  <div className="mb-2 font-bold">Error:</div>
                  <div className="mb-4">{this.state.error && this.state.error.toString()}</div>
                  <div className="font-bold">Stack Trace:</div>
                  <div>{this.state.errorInfo.componentStack}</div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Not Found Component
const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl mb-6">
        <span className="text-4xl">🔍</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
        >
          Go Home
        </button>
        <button
          onClick={() => window.history.back()}
          className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

// App Router Component
const AppRouter = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<App />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/gmail" 
            element={
              <ProtectedRoute>
                <GmailDashboard token={new URLSearchParams(window.location.search).get("token")} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/drive" 
            element={
              <ProtectedRoute>
                <DriveDashboard token={new URLSearchParams(window.location.search).get("token")} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/local" 
            element={
              <ProtectedRoute>
                <LocalDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect legacy routes */}
          <Route path="/main" element={<Navigate to="/dashboard" replace />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

// Initialize React App
const root = ReactDOM.createRoot(document.getElementById("root"));

// Add performance monitoring
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 ZeroClutter App starting in development mode');
}

// Render the app
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

// Service Worker Registration (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Analytics and monitoring (optional)
if (process.env.NODE_ENV === 'production') {
  // Add your analytics code here
  // Example: Google Analytics, Mixpanel, etc.
}

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics in development
  window.addEventListener('load', () => {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('📊 Performance Metrics:', {
        'DOM Content Loaded': Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
        'Load Complete': Math.round(perfData.loadEventEnd - perfData.loadEventStart),
        'Total Load Time': Math.round(perfData.loadEventEnd - perfData.fetchStart)
      });
    }
  });
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // You can send errors to your monitoring service here
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // You can send errors to your monitoring service here
});