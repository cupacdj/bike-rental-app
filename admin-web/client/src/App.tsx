import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bikes from './pages/Bikes';
import ParkingZones from './pages/ParkingZones';
import Rentals from './pages/Rentals';
import Issues from './pages/Issues';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import type { ProtectedRouteProps } from './types';

function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/bikes" element={<Bikes />} />
                      <Route path="/parking-zones" element={<ParkingZones />} />
                      <Route path="/rentals" element={<Rentals />} />
                      <Route path="/issues" element={<Issues />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
