import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import ContactsPage from './pages/Contacts';
import TasksPage from './pages/Tasks';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="text-2xl text-primary">Yükleniyor...</div>
    </div>;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        currentUser ? <Navigate to="/" /> : <Login />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/calendar" element={
        <ProtectedRoute>
          <MainLayout>
            <CalendarPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/contacts" element={
        <ProtectedRoute>
          <MainLayout>
            <ContactsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tasks" element={
        <ProtectedRoute>
          <MainLayout>
            <TasksPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
