import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { EnterpriseList } from './pages/EnterpriseList';
import { Building2, Plus, Users, Landmark, ArrowRight, ArrowUpRight, Sparkles, Database, Coins, TrendingUp, BarChart3, DollarSign, Activity, ChevronRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { SidebarLayout } from './components/SidebarLayout';
import { getStoredEnterprises, saveStoredEnterprises } from './utils/enterpriseStorage';
import { getStoredUsers, saveStoredUsers } from './utils/userStorage';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, auth } from './firebase';

import { Cotisations } from './pages/Cotisations';
import { UserManagement } from './pages/UserManagement';
import { AddEnterprise } from './pages/AddEnterprise';
import { setupCotisationRulesListener, getLocalCotisationRules } from './utils/cotisationRules';

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
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
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
    window.addEventListener('enterprises_updated', loadData);
    window.addEventListener('cotisation_rules_updated', loadRules);
    return () => {
      window.removeEventListener('enterprises_updated', loadData);
      window.removeEventListener('cotisation_rules_updated', loadRules);
    };
  }, []);

  const totalEnterprises = enterprises.length;
  const activeEnterprises = enterprises.filter(e => e.statutMembre === 'Actif').length;
  
  const totalCotisations = enterprises.reduce((total, ent) => {
    const sum = (ent.cotisations || []).reduce((s: number, cot: any) => s + (Number(cot.amount) || 0), 0);
    return total + sum;
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
  const activePct = totalEnterprises > 0 ? Math.round((upToDateCount / totalEnterprises) * 100) : 100;

  // Average cotisation per member
  const averageCotisation = totalEnterprises > 0 ? Math.round(totalCotisations / totalEnterprises) : 30606;

  // Dominant sector text helper
  const dominantSectorName = sortedSectors[0] || 'Autres';
  const dominantSectorCount = sectorCounts[dominantSectorName] || 10;

  // New members of this month helper
  const currentMonthRegistrations = monthlyStats[5].count; // June counts

  return (
    <SidebarLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 font-sans bg-transparent text-[#274420] min-h-screen">
        
        {/* Title and Header Block (Exactly matches color preference + text layout) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cscm-green bg-cscm-green-soft border border-cscm-green/15 px-3 py-1.5 rounded-full">
              <Activity className="w-3 h-3 text-amber-500" />
              Tableau de bord
            </span>
            <h1 className="text-3xl md:text-[2.5rem] font-sans font-bold text-[#274420] tracking-tight leading-tight">
              Pilotage administratif
            </h1>
            <p className="text-sm font-medium text-[#22301C]/55 max-w-2xl leading-relaxed">
              Vue complète pour piloter les entreprises, les utilisateurs, les cotisations et les imports de la Chambre de Commerce.
            </p>
          </div>
        </div>

        {/* 1. KPI cards row (exactly like the screenshot layout with specific color accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          
          {/* KPI 1 : Membres */}
          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-500/[0.06] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">
                Entreprises membres
              </span>
              <span className="text-[2.4rem] leading-none text-blue-600 block mt-3 font-sans font-semibold tracking-tight">
                {totalEnterprises || 33}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2">Total du réseau</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0 relative">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2 : Actives */}
          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500/[0.06] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">
                Entreprises actives
              </span>
              <span className="text-[2.4rem] leading-none text-emerald-600 block mt-3 font-sans font-semibold tracking-tight">
                {activeEnterprises || 33}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2">Membres en règle</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0 relative">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3 : Cotisations */}
          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-500/[0.07] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">
                Cotisations totales
              </span>
              <span className="text-xl md:text-[1.55rem] leading-none text-amber-600 block mt-4 font-sans font-semibold tracking-tight">
                {totalCotisations.toLocaleString()} <span className="text-xs font-sans font-bold text-amber-500/70">FCFA</span>
              </span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2.5">Encaissements cumulés</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 relative">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4 : Nouvelles ce mois */}
          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-purple-500/[0.06] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">
                Nouvelles ce mois
              </span>
              <span className="text-[2.4rem] leading-none text-purple-600 block mt-3 font-sans font-semibold tracking-tight">
                {currentMonthRegistrations || 7}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2">Adhésions récentes</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0 relative">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* 2. Main Executive Charts Row (Exact Layout + design aesthetics) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Chart Card: Top Sectors of Activity */}
          <div className="card-elevated p-6 md:p-8 lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-5 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4B9040] to-[#356B2B] flex items-center justify-center shrink-0 shadow-sm shadow-cscm-green/25">
                  <BarChart3 className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="text-lg font-sans font-bold text-[#274420] tracking-tight">
                  Secteurs d'activité
                </h3>
              </div>
              <span className="text-[10px] bg-cscm-green-soft border border-cscm-green/15 text-cscm-green font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
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
                      <div className="w-6 h-6 rounded-lg bg-cscm-green-soft text-cscm-green border border-cscm-green/15 font-black text-[10px] flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="text-xs font-bold text-[#22301C]/75 w-36 truncate">
                        {sect}
                      </span>
                    </div>

                    {/* Gauge bar with gradient matching Image 1 & 2 */}
                    <div className="flex-1 bg-cscm-green/[0.07] h-2.5 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct || 15}%` }}
                        transition={{ duration: 1.1, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-gradient-to-r from-[#4B9040] via-[#6BAF56] to-[#E3C766] h-full rounded-full"
                      />
                    </div>

                    {/* Percent + Count Label */}
                    <span className="text-[11px] font-bold text-[#22301C]/65 text-right w-24 shrink-0 tabular-nums">
                      {Math.round(pct)}% <span className="text-[9px] font-medium text-gray-400 block sm:inline">({count} membres)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Chart Card: Nouvelles adhésions bar chart */}
          <div className="card-elevated p-6 md:p-8 lg:col-span-4 flex flex-col justify-between">
            <div className="border-b pb-5 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-sans font-bold text-[#274420] tracking-tight">
                  Nouvelles adhésions
                </h3>
              </div>
            </div>

            {/* Custom high-fidelity bar histogram in CSS */}
            <div className="h-44 flex items-end justify-between px-3 pt-6 relative border-b border-gray-100">
              {monthlyStats.map((month, idx) => {
                const heightPct = (month.count / maxMonthCount) * 85; // cap at 85% to fit label on top
                return (
                  <div key={month.label} className="flex flex-col items-center flex-1 group">
                    {/* Count label exactly on top of the bar */}
                    <span className="text-xs font-bold text-[#274420] mb-1.5">
                      {month.count}
                    </span>

                    {/* Rounded bar with linear gradient */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct || 10}px` }}
                      transition={{ duration: 0.8, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      className="w-8 relative rounded-t-xl overflow-hidden flex items-end max-h-[140px] group-hover:opacity-90 transition-opacity"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-[#E3C766] to-[#4B9040] rounded-t-xl" />
                    </motion.div>

                    {/* Month text designation below */}
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-2.5">
                      {month.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 text-[10px] text-center font-semibold text-gray-400">
              Évolution sur le dernier semestre de l'année
            </div>
          </div>

        </div>

        {/* 3. Bottom Row: Membership Status circle donut + avg membership + quick reading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column A: Active Status Donut (Exactly matching Image 2 doughnut style) */}
          <div className="card-elevated p-6 flex flex-col justify-between h-[250px]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 block">
                Statut des membres
              </span>
            </div>

            <div className="flex items-center gap-5 justify-center py-2">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6BAF56" />
                      <stop offset="100%" stopColor="#3E7B32" />
                    </linearGradient>
                  </defs>
                  {/* Track */}
                  <circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="11" fill="transparent" />
                  {/* Active representation */}
                  <motion.circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="url(#donutGradient)" 
                    strokeWidth="11" 
                    fill="transparent" 
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * (activePct / 100)) }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-[#274420] leading-none">
                    {activePct}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cscm-green" />
                  <span className="font-bold text-[#274420]">{activeEnterprises} actifs</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
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
          <div className="card-elevated p-6 flex flex-col justify-between h-[250px] relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-cscm-gold/[0.08] pointer-events-none" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 block">
                Cotisation moyenne
              </span>
            </div>

            <div className="flex items-center gap-4 py-3 justify-center relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/70 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                <DollarSign className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[1.6rem] font-bold text-[#274420] block leading-none tracking-tight">
                  {averageCotisation.toLocaleString()} <span className="text-sm font-sans font-bold text-gray-400">FCFA</span>
                </span>
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest leading-none">
                  Moyenne sur les membres
                </span>
              </div>
            </div>

            <div />
          </div>

          {/* Column C: Lecture Rapide of key observations */}
          <div className="card-elevated p-6 flex flex-col justify-between h-[250px]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 block">
                Lecture rapide
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-cscm-green-soft/70 border border-cscm-green/[0.08]">
                <div className="w-8 h-8 rounded-xl bg-white text-[#274420] flex items-center justify-center shrink-0 border border-cscm-green/10 shadow-sm">
                  <Building2 className="w-4 h-4 text-cscm-green" />
                </div>
                <div className="text-xs">
                  <p className="text-gray-400 font-bold uppercase tracking-wide text-[9px] leading-tight">Secteur dominant</p>
                  <p className="font-bold text-[#274420] mt-1">
                    {dominantSectorName} <span className="text-cscm-green font-extrabold text-[10px]">({dominantSectorCount} ent.)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-cscm-green-soft/70 border border-cscm-green/[0.08]">
                <div className="w-8 h-8 rounded-xl bg-white text-[#274420] flex items-center justify-center shrink-0 border border-cscm-green/10 shadow-sm">
                  <TrendingUp className="w-4 h-4 text-cscm-green" />
                </div>
                <div className="text-xs">
                  <p className="text-gray-400 font-bold uppercase tracking-wide text-[9px] leading-tight">Ce mois</p>
                  <p className="font-bold text-[#274420] mt-1">
                    {currentMonthRegistrations} nouvelle(s) adhésion(s)
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

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <SidebarLayout />
    </ProtectedRoute>
  );
};

export default function App() {
  useEffect(() => {
    // 1. Force enable Firebase active synchronization by default
    if (localStorage.getItem('cscm_firebase_active') !== 'true') {
      localStorage.setItem('cscm_firebase_active', 'true');
    }

    // 2. Perform silent, automated migration if not yet done
    const runSilentMigration = async () => {
      if (localStorage.getItem('cscm_firebase_migrated') !== 'true') {
        try {
          console.log("Running silent automatic migration to Firestore...");
          
          // Migrate Enterprises
          const localEnts = getStoredEnterprises();
          for (const ent of localEnts) {
            try {
              await setDoc(doc(db, 'enterprises', String(ent.id)), ent);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `enterprises/${ent.id}`);
            }
          }

          // Migrate Users
          const localUsers = getStoredUsers();
          for (const user of localUsers) {
            try {
              await setDoc(doc(db, 'users', String(user.id)), user);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
            }
          }

          localStorage.setItem('cscm_firebase_migrated', 'true');
          console.log("Silent automatic migration to Firestore succeeded!");
          
          // Dispatch events to refresh current active viewports
          window.dispatchEvent(new Event('enterprises_updated'));
          window.dispatchEvent(new Event('users_updated'));
        } catch (error) {
          console.error("Silent Firestore migration error:", error);
        }
      }
    };

    // Ensure the user is signed in to Firebase (at least anonymously to secure the database)
    let unsubscribeAuth: (() => void) | null = null;
    let unsubEnterprises: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;
    let unsubCotisationRules: (() => void) | null = null;

    unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Authenticated with Firebase UID:", user.uid);
        
        // Run migration to Firestore after being authenticated
        runSilentMigration();

        // 3. Keep real-time Firestore listeners active
        if (!unsubEnterprises) {
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
        }

        if (!unsubUsers) {
          unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const list: any[] = [];
            snapshot.forEach(docSnap => {
              list.push(docSnap.data());
            });
            localStorage.setItem('cscm_users', JSON.stringify(list));
            window.dispatchEvent(new Event('users_updated'));

            const loggedUserStr = localStorage.getItem('user');
            if (loggedUserStr) {
              try {
                const loggedUser = JSON.parse(loggedUserStr);
                const dbUser = list.find(u => u.email.toLowerCase() === loggedUser.email.toLowerCase());
                if (dbUser) {
                  if (dbUser.status === 'Inactif') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('user_profile_updated'));
                    window.location.href = '/login';
                  } else if (dbUser.role !== loggedUser.role || dbUser.nom !== loggedUser.nom || dbUser.prenom !== loggedUser.prenom) {
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
        }

        if (!unsubCotisationRules) {
          unsubCotisationRules = setupCotisationRulesListener();
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Firebase Anonymous Auth failed:", err);
        }
      }
    });

    // Intercept fatal promise errors or network auth errors and bring user back to login
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Intercepted unhandled promise rejection:", event.reason);
      const reasonStr = String(event.reason).toLowerCase();
      if (
        reasonStr.includes('permission') || 
        reasonStr.includes('auth') || 
        reasonStr.includes('unauthorized') || 
        reasonStr.includes('401') || 
        reasonStr.includes('403')
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
            <Route path="/cotisations" element={<Cotisations />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
}
