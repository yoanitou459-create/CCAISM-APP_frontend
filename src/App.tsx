import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { EnterpriseList } from './pages/EnterpriseList';
import { LayoutDashboard, Building2, Plus, UserCircle, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { AddEnterpriseModal } from './components/AddEnterpriseModal';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Mock token check for frontend-only demo
  const token = localStorage.getItem('token') || 'demo-token';
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Dashboard = () => {
  const [isAddEnterpriseOpen, setIsAddEnterpriseOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-cscm-dark font-serif">
      <Navbar />

      {/* Main Content */}
      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-white rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Home className="w-8 h-8 text-[#4A3728]" />
          </button>
          
          <button 
            onClick={() => setIsAddEnterpriseOpen(true)}
            className="bg-[#1A3F23] text-[#D4AF37] px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-[#14321B] transition-all shadow-lg font-bold"
          >
            <div className="bg-[#D4AF37] p-1 rounded">
              <Plus className="w-5 h-5 text-[#1A3F23]" />
            </div>
            Ajouter une entreprise
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-cscm-gold rounded-3xl p-12 flex items-center justify-center cursor-pointer shadow-xl aspect-square md:aspect-auto md:h-80"
          >
            <div className="w-48 h-48 border-2 border-cscm-dark/20 rounded-2xl flex items-center justify-center">
              <LayoutDashboard className="w-24 h-24 text-cscm-dark/40" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/enterprises')}
            className="bg-red-600 rounded-3xl p-12 flex items-center justify-center cursor-pointer shadow-xl aspect-square md:aspect-auto md:h-80"
          >
            <div className="w-48 h-48 border-2 border-white/20 rounded-2xl flex items-center justify-center">
              <Building2 className="w-24 h-24 text-white/40" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Add Enterprise Modal */}
      <AddEnterpriseModal 
        isOpen={isAddEnterpriseOpen} 
        onClose={() => setIsAddEnterpriseOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/enterprises" 
          element={
            <ProtectedRoute>
              <EnterpriseList />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
