import { useState } from 'react'

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import Homepage from "./pages/Homepage";
import TotalPopulation from "./pages/TotalPopulation";
import Unauthorized from "./pages/Unauthorized";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from "./components/ProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Root route - redirects based on user role */}
          <Route path="/" element={<RoleBasedRedirect />} />
          
          {/* Regular user homepage */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          } />
          
          <Route path="/total-population" element={
            <ProtectedRoute>
              <TotalPopulation />
            </ProtectedRoute>
          } />
          
          <Route path="/total-male" element={
            <ProtectedRoute>
              <TotalPopulation />
            </ProtectedRoute>
          } />
          
          <Route path="/total-female" element={
            <ProtectedRoute>
              <TotalPopulation />
            </ProtectedRoute>
          } />
          
          <Route path="/total-students" element={
            <ProtectedRoute>
              <TotalPopulation />
            </ProtectedRoute>
          } />
          
          <Route path="/total-unemployed" element={
            <ProtectedRoute>
              <TotalPopulation />
            </ProtectedRoute>
          } />
          
          <Route path="/total-health-condition" element={
            <ProtectedRoute>
              <TotalPopulation />
            </ProtectedRoute>
          } />
          

          {/* Admin dashboard */}
          <Route path="/admin" element={
            <AdminRoute>
              <Homepage />
            </AdminRoute>
          } />
          
     
          
          {/* Admin routes - require admin or super_admin role */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <div>Admin Dashboard (to be implemented)</div>
            </AdminRoute>
          } />
          
          {/* Super Admin routes - require super_admin role */}
          <Route path="/super-admin" element={
            <SuperAdminRoute>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          } />
          <Route path="/super-admin/*" element={
            <SuperAdminRoute>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
