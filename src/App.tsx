import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Login } from './frontend/pages/Login';
import { Signup } from './frontend/pages/Signup';
import { ForgotPassword } from './frontend/pages/ForgotPassword';
import { EnterpriseList } from './frontend/pages/EnterpriseList';
import { Building2, Plus, Users, Landmark, ArrowRight, ArrowUpRight, Sparkles, Database, Coins, TrendingUp, BarChart3, DollarSign, Activity, ChevronRight, Check, X, PartyPopper } from 'lucide-react';
import { motion } from 'motion/react';
import { SidebarLayout } from './frontend/components/SidebarLayout';
import { getStoredEnterprises, saveStoredEnterprises } from './database/enterpriseStorage';
import { getStoredUsers, saveStoredUsers } from './database/userStorage';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, auth } from './database/firebase';

import { Cotisations } from './frontend/pages/Cotisations';
import { UserManagement } from './frontend/pages/UserManagement';
import { AddEnterprise } from './frontend/pages/AddEnterprise';
import { EnterpriseDetail } from './frontend/pages/EnterpriseDetail';
import { setupCotisationRulesListener, getLocalCotisationRules } from './database/cotisationRules';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Global Error Boundary to catch any runtime rendering crash and redirect to connection page
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
    // Clear corrupted session values so that the login screen is clean and accessible
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  render() {
    if (this.state.hasError) {
      // Force direct browser redirect to login to completely clean state and recover
      window.location.href = '/login';
      return null;
    }

    return this.props.children;
  }
}

// Global resource 404 mitigation - intercepts broken image loads and serves premium fallbacks
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.target && (event.target as HTMLElement).nodeName === 'IMG') {
      const img = event.target as HTMLImageElement;
      if (!img.src.startsWith('data:image/')) {
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="1"><rect width="24" height="24" rx="6" fill="%23fcfcfc" stroke="%23f1f1f1"/><circle cx="12" cy="10" r="3"/><path d="M17 18v1H7v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3z"/></svg>';
      }
    }
  }, true);
}

// Fallback redirect returning to the previous history page or fallback to dashboard
const FallbackRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Navigate back if history exists, otherwise go to dashboard
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAF9F5] font-sans">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest">Redirection en cours...</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [rules, setRules] = useState(() => getLocalCotisationRules());
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const userName = JSON.parse(localStorage.getItem('user') || '{"prenom": "Moustapha"}').prenom;

  const loadData = () => {
    setEnterprises(getStoredEnterprises());
  };

  const loadRules = () => {
    setRules(getLocalCotisationRules());
  };

  useEffect(() => {
    loadData();
    loadRules();
    if (localStorage.getItem('cscm_just_registered') === 'true') {
      setShowWelcome(true);
      localStorage.removeItem('cscm_just_registered');
    }
    window.addEventListener('enterprises_updated', loadData);
    window.addEventListener('cotisation_rules_updated', loadRules);
    return () => {
      window.removeEventListener('enterprises_updated', loadData);
      window.removeEventListener('cotisation_rules_updated', loadRules);
    };
  }, []);

  const totalEnterprises = enterprises.length;
  const activeEnterprises = enterprises.filter(e => (e.statutMembre || '').trim().toLowerCase() === 'actif').length;
  
  const totalCotisations = enterprises.reduce((total, ent) => {
    const sum = (ent.cotisations || []).reduce((s: number, cot: any) => s + (Number(cot.amount) || 0), 0);
    const yearsSum = (Number(ent.cotisation_2023) || 0) + (Number(ent.cotisation_2024) || 0) + (Number(ent.cotisation_2025) || 0);
    return total + sum + yearsSum;
  }, 0);

  // Compute stats for sector progress bars
  const sectorCounts: { [key: string]: number } = {};
  enterprises.forEach(e => {
    const s = e.secteur || 'Autres';
    sectorCounts[s] = (sectorCounts[s] || 0) + 1;
  });

  // Sort sectors dynamically based on all available default and custom sectors
  const defaultSectors = ['Tourisme', 'Transport et logistique', 'Agro', 'BTP', 'Education', 'Commerce', 'Industrie', 'Sante', 'Autres'];
  const allUniqueSectors = Array.from(new Set([...defaultSectors, ...Object.keys(sectorCounts)]));
  const sortedSectors = allUniqueSectors.sort((a, b) => (sectorCounts[b] || 0) - (sectorCounts[a] || 0));

  // Helper to extract the month index (0-11) from date string safely
  const getMonthFromDate = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      if (!isNaN(month) && month >= 1 && month <= 12) {
        return month - 1; // 0-indexed (Jan = 0)
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.getMonth();
    }
    return null;
  };

  // Dynamic monthly registration calculations - fully coherent with database entries
  const monthlyStats = [
    { label: 'Jan', count: enterprises.filter(e => getMonthFromDate(e.dateAdhesion) === 0).length },
    { label: 'Fév', count: enterprises.filter(e => getMonthFromDate(e.dateAdhesion) === 1).length },
    { label: 'Mar', count: enterprises.filter(e => getMonthFromDate(e.dateAdhesion) === 2).length },
    { label: 'Avr', count: enterprises.filter(e => getMonthFromDate(e.dateAdhesion) === 3).length },
    { label: 'Mai', count: enterprises.filter(e => getMonthFromDate(e.dateAdhesion) === 4).length },
    { label: 'Juin', count: enterprises.filter(e => getMonthFromDate(e.dateAdhesion) === 5).length }
  ];

  const maxMonthCount = Math.max(...monthlyStats.map(m => m.count), 1);

  // Solvability check using dynamic rules
  const upToDateList = enterprises.filter(e => {
    const sum = (e.cotisations || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
    const yearsSum = (Number(e.cotisation_2023) || 0) + (Number(e.cotisation_2024) || 0) + (Number(e.cotisation_2025) || 0);
    const totalPaid = sum + yearsSum;

    // Calculate required amount up to today using rules.amountPerSemester
    const dateAdhesionStr = e.dateAdhesion || e.dateCreation || '';
    let membershipYear = 2023;
    let membershipHalf = 1;
    let membershipMonth = 1;

    if (dateAdhesionStr) {
      const adDate = new Date(dateAdhesionStr);
      if (!isNaN(adDate.getTime())) {
        membershipYear = adDate.getFullYear();
        membershipMonth = adDate.getMonth() + 1;
        membershipHalf = membershipMonth <= 6 ? 1 : 2;
      }
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentHalf = currentMonth <= 6 ? 1 : 2;

    let requiredTotalToDate = 0;
    let isExempt = false;

    // Check if joining date is in the future relative to current period
    if (membershipYear > currentYear || (membershipYear === currentYear && membershipHalf > currentHalf)) {
      isExempt = true;
    } else {
      const effectiveMemberYear = Math.max(2023, membershipYear);
      const effectiveMemberHalf = membershipYear < 2023 ? 1 : membershipHalf;

      for (let y = effectiveMemberYear; y <= currentYear; y++) {
        const startHalf = (y === effectiveMemberYear) ? effectiveMemberHalf : 1;
        const endHalf = (y === currentYear) ? currentHalf : 2;
        for (let h = startHalf; h <= endHalf; h++) {
          requiredTotalToDate += rules.amountPerSemester;
        }
      }
    }

    return isExempt ? true : (totalPaid >= requiredTotalToDate);
  });
  const upToDateCount = upToDateList.length;
  const delayedCount = Math.max(0, totalEnterprises - upToDateCount);
  const activePct = totalEnterprises > 0 ? Math.round((activeEnterprises / totalEnterprises) * 100) : 100;

  // Average cotisation per member
  const averageCotisation = totalEnterprises > 0 ? Math.round(totalCotisations / totalEnterprises) : 30606;

  // Dominant sector text helper
  const dominantSectorName = sortedSectors[0] || 'Autres';
  const dominantSectorCount = sectorCounts[dominantSectorName] || 0;

  // New members of this month helper
  const currentMonthRegistrations = monthlyStats[5].count; // June counts

  return (
    <SidebarLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 font-sans bg-transparent text-[#12210E] min-h-screen">
        
        {/* Title and Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#12210E]/10 pb-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cscm-gold mb-1.5">
              CCAISM • Tableau de bord
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-[#12210E] tracking-tight">
              Pilotage administrative
            </h1>
            <p className="text-sm font-semibold text-emerald-800/80 mt-1.5 max-w-2xl leading-relaxed">
              Vue complète pour piloter les entreprises, les utilisateurs, les cotisations et les imports de la Chambre de Commerce.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/enterprises" className="btn-outline px-5 py-2.5">
              <Building2 className="w-4 h-4" />
              Voir les membres
            </Link>
            <Link to="/enterprises/add" className="btn-primary text-xs px-5 py-2.5">
              <Plus className="w-4 h-4" />
              Ajouter une entreprise
            </Link>
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative bg-gradient-to-r from-emerald-800 to-[#1e3d16] text-white rounded-[2rem] p-6 md:p-8 shadow-xl overflow-hidden border border-emerald-700/50"
          >
            {/* Background decorative patterns */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none">
              <svg className="w-full h-full text-white" viewBox="0 0 100 100" preserveAspectRatio="none" fill="currentColor">
                <path d="M0,0 L100,0 L100,100 Z" />
              </svg>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 relative z-10">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20 shadow-inner text-cscm-gold shrink-0">
                <PartyPopper className="w-8 h-8 text-amber-300 animate-bounce" />
              </div>
              <div className="space-y-2 text-left flex-1">
                <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight flex items-center gap-2">
                  <span>Félicitations et bienvenue, {userName} !</span>
                  <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
                </h2>
                <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed font-semibold max-w-4xl">
                  Votre inscription a été finalisée avec succès et votre compte est désormais actif. Vous avez été connecté automatiquement. 
                  En tant que membre de l'équipe de la <b>Chambre de Commerce et d'Industrie</b>, vous disposez maintenant d'un accès complet pour piloter les entreprises adhérentes, suivre et enregistrer les cotisations, importer des fichiers de données et gérer les profils utilisateurs.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="bg-white hover:bg-emerald-50 text-emerald-900 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <span>Commencer à explorer</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <Link
                    to="/enterprises/add"
                    className="bg-emerald-700/60 hover:bg-emerald-700/80 text-white border border-white/15 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Ajouter une entreprise</span>
                    <Plus className="w-4 h-4 shrink-0" />
                  </Link>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute top-0 right-0 md:relative md:top-auto md:right-auto p-2 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Fermer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}

        {/* 1. KPI cards row (exactly like the screenshot layout with specific color accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* KPI 1 : Membres */}
          <div className="group bg-white rounded-[1.75rem] p-5 border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] flex justify-between items-center transition-all duration-300 hover:shadow-[0_12px_40px_rgba(19,46,21,0.1)] hover:border-cscm-green/25 hover:-translate-y-0.5 relative overflow-hidden">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#12210E]/45 block">
                Entreprises membres
              </span>
              <span className="text-3xl font-black text-blue-600 block mt-2 font-serif font-black">
                {totalEnterprises}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2 : Actives */}
          <div className="group bg-white rounded-[1.75rem] p-5 border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] flex justify-between items-center transition-all duration-300 hover:shadow-[0_12px_40px_rgba(19,46,21,0.1)] hover:border-cscm-green/25 hover:-translate-y-0.5 relative overflow-hidden">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#12210E]/45 block">
                Entreprises actives
              </span>
              <span className="text-3xl font-black text-emerald-600 block mt-2 font-serif font-black">
                {activeEnterprises}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3 : Cotisations */}
          <div className="group bg-white rounded-[1.75rem] p-5 border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] flex justify-between items-center transition-all duration-300 hover:shadow-[0_12px_40px_rgba(19,46,21,0.1)] hover:border-cscm-green/25 hover:-translate-y-0.5 relative overflow-hidden">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#12210E]/45 block">
                Cotisations totales
              </span>
              <span className="text-xl md:text-2xl font-black text-amber-500 block mt-3.5 font-sans font-black tracking-tight leading-none">
                {totalCotisations.toLocaleString()} FCFA
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4 : Nouvelles ce mois */}
          <div className="group bg-white rounded-[1.75rem] p-5 border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] flex justify-between items-center transition-all duration-300 hover:shadow-[0_12px_40px_rgba(19,46,21,0.1)] hover:border-cscm-green/25 hover:-translate-y-0.5 relative overflow-hidden">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#12210E]/45 block">
                Nouvelles ce mois
              </span>
              <span className="text-3xl font-black text-purple-600 block mt-2 font-serif font-black">
                {currentMonthRegistrations}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* 2. Main Executive Charts Row (Exact Layout + design aesthetics) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Chart Card: Top Sectors of Activity */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#12210E]/10 shadow-sm lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4 border-gray-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#12210E]" />
                <h3 className="text-lg font-serif font-black text-[#12210E]">
                  Secteurs d'activité
                </h3>
              </div>
              <span className="text-[10px] bg-[#E1EADF] text-[#12210E] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {sortedSectors.length} secteurs répertoriés
              </span>
            </div>

            {/* List with solid dark green circles and gradient fill indicators */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
              {sortedSectors.map((sect, index) => {
                const count = sectorCounts[sect] || 0;
                const pct = totalEnterprises > 0 ? (count / totalEnterprises) * 100 : 0;
                return (
                  <div key={sect} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
                    {/* Ring and number */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#12210E] text-[#E5C35E] font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="text-xs font-bold text-[#12210E] w-36 truncate">
                        {sect}
                      </span>
                    </div>

                    {/* Gauge bar with gradient matching Image 1 & 2 */}
                    <div className="flex-1 bg-gray-100 h-3.5 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct || 15}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="bg-gradient-to-r from-[#12210E] to-[#E5C35E] h-full rounded-full"
                      />
                    </div>

                    {/* Percent + Count Label */}
                    <span className="text-[11px] font-black text-[#12210E]/70 text-right w-24 shrink-0 font-mono">
                      {Math.round(pct)}% <span className="text-[9px] font-bold text-gray-400 block sm:inline">({count} membres)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Chart Card: Nouvelles adhésions bar chart */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#12210E]/10 shadow-sm lg:col-span-4 flex flex-col justify-between">
            <div className="border-b pb-4 border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-serif font-black text-[#12210E]">
                  Nouvelles adhésions
                </h3>
              </div>
            </div>

            {/* Custom high-fidelity bar histogram in CSS */}
            <div className="h-44 flex items-end justify-between px-3 pt-6 relative border-b border-gray-100">
              {monthlyStats.map(month => {
                const heightPct = (month.count / maxMonthCount) * 85; // cap at 85% to fit label on top
                return (
                  <div key={month.label} className="flex flex-col items-center flex-1 group">
                    {/* Count label exactly on top of the bar */}
                    <span className="text-xs font-black text-[#12210E] mb-1 font-serif">
                      {month.count}
                    </span>

                    {/* Rounded bar with linear gradient */}
                    <div className="w-8 relative bg-gray-150 rounded-t-lg overflow-hidden flex items-end transition-all max-h-[140px]" style={{ height: `${heightPct || 10}px` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#E5C35E] to-[#12210E] rounded-t-lg transition-transform duration-500" />
                    </div>

                    {/* Month text designation below */}
                    <span className="text-[10px] font-black uppercase text-gray-400 mt-2 font-mono">
                      {month.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 text-[10px] text-center font-bold text-gray-400 italic">
              Évolution sur le dernier semestre de l'année
            </div>
          </div>

        </div>

        {/* 3. Bottom Row: Membership Status circle donut + avg membership + quick reading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column A: Active Status Donut (Exactly matching Image 2 doughnut style) */}
          <div className="bg-white rounded-3xl p-6 border border-[#12210E]/10 shadow-sm flex flex-col justify-between h-[250px]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Statut des membres
              </span>
            </div>

            <div className="flex items-center gap-5 justify-center py-2">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track */}
                  <circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                  {/* Active representation */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="#12210E" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (activePct / 100))} 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-serif font-black text-[#12210E] leading-none">
                    {activePct}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#12210E]" />
                  <span className="font-extrabold text-[#12210E]">{activeEnterprises} actifs</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  <span className="font-semibold">{totalEnterprises - activeEnterprises} non actif</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Taux d'adhésion actif
                </p>
              </div>
            </div>

            <div />
          </div>

          {/* Column B: Cotisation Moyenne */}
          <div className="bg-white rounded-3xl p-6 border border-[#12210E]/10 shadow-sm flex flex-col justify-between h-[250px]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Cotisation moyenne
              </span>
            </div>

            <div className="flex items-center gap-4 py-3 justify-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#E5C35E] shrink-0 shadow-sm">
                <DollarSign className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <span className="text-2xl font-serif font-black text-[#12210E] block leading-none tracking-tight">
                  {averageCotisation.toLocaleString()} FCFA
                </span>
                <span className="text-[10px] font-black text-gray-400 block uppercase tracking-widest leading-none">
                  Moyenne sur les membres
                </span>
              </div>
            </div>

            <div />
          </div>

          {/* Column C: Lecture Rapide of key observations */}
          <div className="bg-white rounded-3xl p-6 border border-[#12210E]/10 shadow-sm flex flex-col justify-between h-[250px]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Lecture rapide
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#E1EADF] text-[#12210E] flex items-center justify-center shrink-0 border border-[#12210E]/10 mt-0.5">
                  <Building2 className="w-4 h-4 text-[#12210E]" />
                </div>
                <div className="text-xs">
                  <p className="text-gray-400 font-bold uppercase tracking-wide text-[9px] leading-tight">Secteur dominant</p>
                  <p className="font-bold text-[#12210E] mt-0.5 uppercase">
                    {dominantSectorName} <span className="text-emerald-800 font-extrabold text-[10px] lowercase">({dominantSectorCount} ent.)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#E1EADF] text-[#12210E] flex items-center justify-center shrink-0 border border-[#12210E]/10 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-[#12210E]" />
                </div>
                <div className="text-xs">
                  <p className="text-gray-400 font-bold uppercase tracking-wide text-[9px] leading-tight">Ce mois</p>
                  <p className="font-bold text-[#12210E] mt-0.5 uppercase">
                    {currentMonthRegistrations} Nouvelle(s) adhésion(s)
                  </p>
                </div>
              </div>
            </div>

            <div />
          </div>

        </div>

      </div>

    </SidebarLayout>
  );
};

const PROTECTED_PAGES: Array<{
  key: string;
  match: (pathname: string) => boolean;
  element: React.ReactNode;
  preserveScroll?: boolean;
}> = [
  { key: 'dashboard', match: p => p === '/dashboard', element: <Dashboard /> },
  // La liste conserve sa position de scroll quand on revient d'une fiche
  { key: 'enterprises', match: p => p === '/enterprises', element: <EnterpriseList />, preserveScroll: true },
  { key: 'enterprises-add', match: p => p === '/enterprises/add', element: <AddEnterprise /> },
  { key: 'enterprises-detail', match: p => p.startsWith('/enterprises/') && p !== '/enterprises/add' && p !== '/enterprises', element: <EnterpriseDetail /> },
  { key: 'cotisations', match: p => p === '/cotisations', element: <Cotisations /> },
  { key: 'users', match: p => p === '/users', element: <UserManagement /> },
];

const ProtectedLayout = () => {
  const location = useLocation();
  const pageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  // À chaque navigation, la page qui devient active repart du haut
  useEffect(() => {
    const active = PROTECTED_PAGES.find(p => p.match(location.pathname));
    if (active && !active.preserveScroll) {
      requestAnimationFrame(() => {
        const el = pageRefs.current[active.key];
        if (el) el.scrollTop = 0;
      });
    }
  }, [location.pathname]);

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <div className="flex-1 relative overflow-hidden h-full w-full">
          {PROTECTED_PAGES.map(page => {
            const isActive = page.match(location.pathname);
            return (
              <motion.div
                key={page.key}
                ref={el => { pageRefs.current[page.key] = el; }}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden={!isActive}
                className={`absolute inset-0 overflow-y-auto pb-28 lg:pb-8 ${
                  isActive
                    ? 'z-10 pointer-events-auto'
                    : 'z-0 pointer-events-none'
                }`}
              >
                <div className="page-shell">
                  {page.element}
                </div>
              </motion.div>
            );
          })}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
};

export default function App() {
  useEffect(() => {
    // 1. Force enable Firebase active synchronization by default
    if (localStorage.getItem('cscm_firebase_active') !== 'true') {
      localStorage.setItem('cscm_firebase_active', 'true');
    }

    localStorage.setItem('cscm_firebase_migrated', 'true');

    // Keep real-time Firestore listeners active unconditionally
    let unsubEnterprises: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;
    let unsubCotisationRules: (() => void) | null = null;

    unsubEnterprises = onSnapshot(collection(db, 'enterprises'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
      localStorage.setItem('cscm_enterprises', JSON.stringify(list));
      window.dispatchEvent(new Event('enterprises_updated'));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'enterprises');
    });

    unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      localStorage.setItem('cscm_users', JSON.stringify(list));
      window.dispatchEvent(new Event('users_updated'));

      // Keep currently logged-in user profile updated in real-time
      const loggedUserStr = localStorage.getItem('user');
      if (loggedUserStr) {
        try {
          const loggedUser = JSON.parse(loggedUserStr);
          const dbUser = list.find(u => u.email.toLowerCase() === loggedUser.email.toLowerCase());
          if (dbUser) {
            if (dbUser.status === 'Inactif') {
              // Instantly kick user out if deactivated by an admin
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('user_profile_updated'));
              window.location.href = '/login';
            } else if (dbUser.role !== loggedUser.role || dbUser.nom !== loggedUser.nom || dbUser.prenom !== loggedUser.prenom) {
              // Update role or profile information in real-time
              const updatedUser = {
                ...loggedUser,
                role: dbUser.role,
                nom: dbUser.nom,
                prenom: dbUser.prenom
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              window.dispatchEvent(new Event('user_profile_updated'));
            }
          }
        } catch (e) {
          console.error("Error keeping logged-in user synchronized:", e);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    unsubCotisationRules = setupCotisationRulesListener();

    // Ensure the user is signed in to Firebase (at least anonymously if supported)
    let unsubscribeAuth: (() => void) | null = null;
    unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Authenticated with Firebase UID:", user.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Silent Firebase Anonymous Auth skipped/failed (app continues working normally):", err);
        }
      }
    });

    // Intercept fatal promise errors or network auth errors and bring user back to login
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Intercepted unhandled promise rejection:", event.reason);
      const reasonStr = String(event.reason).toLowerCase();
      // Do NOT kick out for Firestore permission errors since database acts as public
      if (
        (reasonStr.includes('unauthorized') || 
         reasonStr.includes('401') || 
         reasonStr.includes('403')) &&
        !reasonStr.includes('permission')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubEnterprises) unsubEnterprises();
      if (unsubUsers) unsubUsers();
      if (unsubCotisationRules) unsubCotisationRules();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected nested routes with persistent SidebarLayout and smooth page transitions */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/enterprises" element={<EnterpriseList />} />
            <Route path="/enterprises/add" element={<AddEnterprise />} />
            <Route path="/enterprises/:id" element={<EnterpriseDetail />} />
            <Route path="/cotisations" element={<Cotisations />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
}
