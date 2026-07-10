import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const SidebarLayoutContext = createContext<boolean>(false);
import { 
  Building2, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Download, 
  LogOut, 
  Menu, 
  X, 
  UserCircle, 
  CheckCircle2, 
  Plus,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExcelImportModal } from './ExcelImportModal';
import { ProfileModal } from './ProfileModal';
import { getStoredEnterprises, saveStoredEnterprises } from '../utils/enterpriseStorage';
import { exportEnterprisesToCSV } from '../utils/exportUtils';
import logoImg from './logo.png';

export const SidebarLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const hasParent = useContext(SidebarLayoutContext);
  const navigate = useNavigate();

  if (hasParent) {
    return <>{children || <Outlet />}</>;
  }
  const location = useLocation();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scrollPositions = React.useRef<Record<string, number>>({});

  // Capture scroll position for the current pathname as the user scrolls
  const handleScroll = () => {
    if (scrollRef.current) {
      scrollPositions.current[location.pathname] = scrollRef.current.scrollTop;
    }
  };

  useEffect(() => {
    // When path changes, restore the scroll position (or 0 if not visited yet)
    const savedScroll = scrollPositions.current[location.pathname] || 0;
    
    if (scrollRef.current) {
      scrollRef.current.scrollTop = savedScroll;
    }

    // Double check after transitions complete
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = savedScroll;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [enterpriseCount, setEnterpriseCount] = useState(0);

  // Collapsible sidebar state stored locally
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('sidebar_expanded') !== 'false';
  });

  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || '{"nom": "Admin", "prenom": "System", "email": "admin@ccaism.com"}');
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem('profile_photo');
  });

  const loadProfile = () => {
    setUser(JSON.parse(localStorage.getItem('user') || '{"nom": "Admin", "prenom": "System", "email": "admin@ccaism.com"}'));
    setProfilePhoto(localStorage.getItem('profile_photo'));
  };

  const updateCountState = () => {
    const list = getStoredEnterprises();
    setEnterpriseCount(list.length);
  };

  const toggleSidebar = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_expanded', String(next));
      return next;
    });
  };

  const handleAddEnterprise = (newEnt: any) => {
    const current = getStoredEnterprises();
    saveStoredEnterprises([...current, newEnt]);
    setToastText("L'entreprise a été ajoutée avec succès !");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    // Reload state and trigger event
    window.dispatchEvent(new Event('enterprises_updated'));
  };

  useEffect(() => {
    const pendingToast = sessionStorage.getItem('cscm_toast_message');
    if (pendingToast) {
      setToastText(pendingToast);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      sessionStorage.removeItem('cscm_toast_message');
    }
  }, [location.pathname]);

  useEffect(() => {
    updateCountState();
    loadProfile();
    // Listen for storage changes
    window.addEventListener('enterprises_updated', updateCountState);
    window.addEventListener('user_profile_updated', loadProfile);
    return () => {
      window.removeEventListener('enterprises_updated', updateCountState);
      window.removeEventListener('user_profile_updated', loadProfile);
    };
  }, []);

  const triggerExport = () => {
    const list = getStoredEnterprises();
    if (list.length === 0) {
      setToastText("Aucune entreprise disponible pour l'export.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    exportEnterprisesToCSV(list);
    setToastText("Annuaire exporté avec succès ! (.csv)");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleImportSuccess = () => {
    setToastText("Données Excel importées et ajoutées !");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    // Reload components that listen to events
    window.dispatchEvent(new Event('enterprises_updated'));
  };

  const navigationItems = [
    { 
      label: 'Tableau de bord', 
      path: '/dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      label: 'Liste des Entreprises', 
      path: '/enterprises', 
      icon: Building2,
      badge: enterpriseCount > 0 ? `${enterpriseCount}` : null
    },
    ...(user.role === 'ADMIN' ? [
      { 
        label: 'Suivi des Cotisations', 
        path: '/cotisations', 
        icon: Coins,
        badge: null
      },
      {
        label: 'Gestion Utilisateurs',
        path: '/users',
        icon: Users,
        badge: null
      }
    ] : [])
  ];

  return (
    <SidebarLayoutContext.Provider value={true}>
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#FAFBF6] via-[#F3F7EC] to-[#EEF4E4] flex font-sans">
      {/* Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[100] bg-white/95 backdrop-blur-md border border-cscm-green/20 text-cscm-dark rounded-2xl px-5 py-3.5 shadow-[0_20px_50px_-12px_rgba(22,48,30,0.35)] flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-cscm-green-soft text-cscm-green flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-sans text-sm font-semibold">{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Resizing according to isExpanded) */}
      <aside className={`hidden lg:flex flex-col transition-all duration-300 ${isExpanded ? 'w-72' : 'w-20'} bg-gradient-to-b from-[#1E4D2B] via-[#1A4226] to-[#16301E] border-r border-white/10 text-white shrink-0 h-screen sticky top-0 relative z-30 overflow-hidden texture-noise`}>
        {/* Glow Effects */}
        <div className="absolute -left-20 -top-20 w-52 h-52 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-52 h-52 rounded-full bg-cscm-gold/15 blur-3xl pointer-events-none" />

        {/* Sidebar Header Brand */}
        <div className={`p-6 relative z-10 flex items-center ${isExpanded ? 'gap-3 justify-start' : 'justify-center'}`}>
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-lg shadow-black/10 shrink-0 overflow-hidden relative">
            <img 
              src={logoImg} 
              alt="Logo" 
              className="w-full h-full object-contain p-1" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Building2 className="w-5 h-5 text-cscm-gold absolute -z-10" />
          </div>
          {isExpanded && (
            <div className="overflow-hidden">
              <h1 className="text-base font-sans font-bold tracking-wide text-white truncate">Portail CSCM</h1>
              <p className="text-[8px] text-cscm-gold-light uppercase font-black tracking-[0.22em] leading-none mt-1 truncate">Chambre Sénégalaise</p>
            </div>
          )}
        </div>

        <div className="mx-6 divider-gold relative z-10" />

        {/* User Mini Card (Clicking triggers Profile update) */}
        <div 
          onClick={() => setIsProfileOpen(true)}
          className={`p-3.5 mx-3 mt-4 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all duration-300 cursor-pointer relative z-10 flex items-center ${isExpanded ? 'gap-3 mx-4 justify-start' : 'justify-center'}`}
          title="Mon Profil Utilisateur"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 text-white ring-2 ring-cscm-gold/40 flex items-center justify-center shrink-0 overflow-hidden">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-6 h-6" />
            )}
          </div>
          {isExpanded && (
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{user.prenom} {user.nom}</h4>
              <p className="text-[8px] text-cscm-gold-light font-black uppercase tracking-wider mt-1 bg-black/15 border border-cscm-gold/25 px-1.5 py-0.5 rounded-md inline-block">
                {user.role || 'MEMBRE'}
              </p>
            </div>
          )}
        </div>

        {/* Main Nav Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 relative z-10 overflow-y-auto scrollbar-none">
          {isExpanded && (
            <span className="px-4 text-[9px] font-black uppercase text-white/45 tracking-[0.25em] block mb-3">Navigation</span>
          )}
          
          {navigationItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center relative ${isExpanded ? 'justify-between px-4' : 'justify-center p-3'} py-3 rounded-2xl transition-all duration-300 font-sans text-sm font-semibold select-none cursor-pointer group ${
                  isActive 
                    ? 'bg-white text-cscm-green shadow-lg shadow-black/15' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title={item.label}
              >
                {isActive && isExpanded && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-cscm-gold" />
                )}
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cscm-green' : 'text-white/60 group-hover:text-cscm-gold-light'}`} />
                  {isExpanded && <span className="text-xs">{item.label}</span>}
                </div>
                {isExpanded && item.badge && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive ? 'bg-cscm-green-soft text-cscm-green' : 'bg-white/15 text-white/90'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {user.role !== 'MEMBRE' && (
            <div className="pt-4 mt-4 border-t border-white/15 space-y-1.5">
              {isExpanded && (
                <span className="px-4 text-[9px] font-black uppercase text-white/45 tracking-[0.25em] block mb-2">Actions de données</span>
              )}
              
              <button
                onClick={() => navigate('/enterprises/add')}
                className={`w-full flex items-center relative ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl font-sans text-xs font-semibold cursor-pointer text-left transition-all duration-300 group ${
                  location.pathname === '/enterprises/add'
                    ? 'bg-white text-cscm-green shadow-lg shadow-black/15'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Ajouter une Entreprise"
              >
                {location.pathname === '/enterprises/add' && isExpanded && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-cscm-gold" />
                )}
                <Plus className={`w-5 h-5 shrink-0 ${location.pathname === '/enterprises/add' ? 'text-cscm-green' : 'text-cscm-gold-light'}`} />
                {isExpanded && <span>Ajouter Entreprise</span>}
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-sans text-xs font-semibold cursor-pointer text-left transition-all duration-300`}
                title="Importation Excel / CSV"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-200 shrink-0" />
                {isExpanded && <span>Importer Excel</span>}
              </button>

              <button
                onClick={triggerExport}
                className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-sans text-xs font-semibold cursor-pointer text-left transition-all duration-300`}
                title="Exportation de la Liste"
              >
                <Download className="w-5 h-5 text-cscm-gold-light shrink-0" />
                {isExpanded && <span>Exporter Liste</span>}
              </button>

              {user.role === 'ADMIN' && (
                <a
                  href="https://console.firebase.google.com/project/aesthetic-computer-mjhcx/firestore/databases/ai-studio-1f26c2df-bc6a-4a47-bfae-9a0c0efaad81/data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl text-amber-200 hover:text-white hover:bg-white/10 font-sans text-xs font-bold cursor-pointer text-left transition-all duration-300`}
                  title="Base de données Firebase (Firestore)"
                >
                  <Sparkles className="w-5 h-5 text-[#ffcf70] shrink-0 fill-[#ffcf70]/25" />
                  {isExpanded && <span>Firebase Database</span>}
                </a>
              )}
            </div>
          )}
        </nav>

        {/* Expand / Collapse Toggle row */}
        <div className="px-2 py-2 border-t border-white/15 relative z-10 shrink-0">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center ${isExpanded ? 'justify-start gap-3 px-4' : 'justify-center'} py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-xs font-bold cursor-pointer`}
            title={isExpanded ? "Réduire le menu" : "Agrandir le menu"}
          >
            {isExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4 text-cscm-gold-light shrink-0" />
                <span className="text-[10px]">Plier le menu</span>
              </>
            ) : (
              <ChevronRight className="w-5 h-5 text-cscm-gold-light shrink-0" />
            )}
          </button>
        </div>

        {/* Sidebar Logout Footer */}
        <div className="p-3 border-t border-white/15 relative z-10 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4 py-3' : 'justify-center p-3'} rounded-xl text-rose-100/90 hover:text-white hover:bg-rose-500/25 font-bold text-xs tracking-wide transition-colors cursor-pointer`}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isExpanded && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Container including Top Header Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar for Desktop — même thème que la sidebar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-gradient-to-r from-[#1E4D2B] via-[#1A4226] to-[#16301E] border-b border-white/15 text-white shrink-0 relative z-20 texture-noise">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cscm-gold/60 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cscm-gold" />
              </span>
              <p className="text-[13px] font-medium text-white/75">
                Bienvenue, <b className="text-white font-bold">{user.prenom} {user.nom}</b>
                <span className="mx-2 text-white/30">·</span>
                <span className="text-cscm-gold-light font-semibold">{user.role === 'ADMIN' ? 'Administrateur CSCM' : user.role === 'MODERATEUR' ? 'Modérateur CSCM' : 'Membre CSCM'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-white/10 text-cscm-gold-light border border-white/20">
              Chambre Active
            </span>

            <button 
              onClick={() => setIsProfileOpen(true)}
              className="btn-sheen flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-px active:translate-y-0 cursor-pointer shrink-0 select-none ring-1 ring-white/20 border border-white/15"
            >
              <Settings className="w-3.5 h-3.5 text-cscm-gold-light" />
              <span>Réglages Profil</span>
            </button>
          </div>
        </header>

        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-gradient-to-r from-[#1E4D2B] to-[#16301E] backdrop-blur-md border-b border-white/15 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors shrink-0"
            >
              <Menu className="w-6 h-6 text-cscm-gold-light" />
            </button>
            <div className="text-left">
              <h1 className="text-base font-sans font-bold leading-none">CSCM</h1>
              <p className="text-[7px] text-cscm-gold-light uppercase tracking-[0.2em] font-black mt-1">Chambre Sénégalaise au Maroc</p>
            </div>
          </div>

          <div 
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-white/20 text-white ring-2 ring-cscm-gold/40 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer Backdrop */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 bg-black z-50 lg:hidden"
              />
              
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-[#1E4D2B] via-[#1A4226] to-[#16301E] text-white z-50 lg:hidden flex flex-col texture-noise"
              >
                <div className="p-6 border-b border-white/15 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden relative">
                      <img 
                        src={logoImg} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-1" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Building2 className="w-5 h-5 text-cscm-gold absolute -z-10" />
                    </div>
                    <div>
                      <h2 className="text-lg font-sans font-bold">CSCM</h2>
                      <p className="text-[8px] text-cscm-gold-light uppercase font-black tracking-[0.2em] mt-0.5">Sénégal au Maroc</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div 
                  onClick={() => {
                    setIsProfileOpen(true);
                    setIsMobileOpen(false);
                  }}
                  className="p-6 flex items-center gap-3 border-b border-white/15 bg-white/10 hover:bg-white/20 transition-all cursor-pointer relative z-10"
                  title="Modifier mon profil"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 text-white ring-2 ring-cscm-gold/40 flex items-center justify-center shrink-0 overflow-hidden">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate">{user.prenom} {user.nom}</h4>
                    <p className="text-[10px] text-cscm-gold-light font-bold uppercase tracking-wider">{user.email}</p>
                  </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                  {navigationItems.map(item => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-sans text-sm font-semibold select-none ${
                          isActive 
                            ? 'bg-white text-cscm-green shadow-lg shadow-black/15' 
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-cscm-green' : 'text-white/60'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-cscm-green-soft text-cscm-green' : 'bg-white/15 text-white'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {user.role !== 'MEMBRE' && (
                    <div className="pt-6 mt-6 border-t border-white/15 space-y-1.5">
                      <button
                        onClick={() => {
                          navigate('/enterprises/add');
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-sans text-sm font-semibold cursor-pointer text-left transition-colors"
                      >
                        <Plus className="w-5 h-5 text-cscm-gold-light shrink-0" />
                        <span>Ajouter une Entreprise</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsImportOpen(true);
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-sans text-sm font-semibold cursor-pointer text-left transition-colors"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-emerald-200 shrink-0" />
                        <span>Importation Excel / CSV</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerExport();
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-sans text-xs font-semibold cursor-pointer text-left transition-colors"
                      >
                        <Download className="w-5 h-5 text-cscm-gold-light shrink-0" />
                        <span>Exportation de la Liste</span>
                      </button>

                      {user.role === 'ADMIN' && (
                        <a
                          href="https://console.firebase.google.com/project/aesthetic-computer-mjhcx/firestore/databases/ai-studio-1f26c2df-bc6a-4a47-bfae-9a0c0efaad81/data"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setIsMobileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-amber-200 hover:text-white hover:bg-white/10 font-sans text-sm font-black cursor-pointer text-left transition-colors"
                        >
                          <Sparkles className="w-5 h-5 text-[#ffcf70] shrink-0 fill-[#ffcf70]/25" />
                          <span>Console Firebase DB</span>
                        </a>
                      )}
                    </div>
                  )}
                </nav>

                <div className="p-4 border-t border-white/15 relative z-10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-rose-100/90 hover:text-white hover:bg-rose-500/25 font-bold text-sm tracking-wide transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic page main container - Independent Scrollable Area */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pb-24 lg:pb-6 relative scroll-smooth isolate">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Instagram/Facebook format) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#1E4D2B]/95 to-[#16301E]/95 backdrop-blur-xl border-t border-white/15 pb-safe shadow-[0_-8px_30px_rgba(22,48,30,0.35)]">
        <div className="flex justify-around items-center h-16 px-2">
          {/* Dashboard tab */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors ${
              location.pathname === '/dashboard' ? 'text-cscm-gold-light font-bold' : 'text-white/70 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Accueil</span>
          </button>

          {/* Enterprises tab */}
          <button
            onClick={() => navigate('/enterprises')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors relative ${
              location.pathname === '/enterprises' ? 'text-cscm-gold-light font-bold' : 'text-white/70 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Membres</span>
            {enterpriseCount > 0 && (
              <span className="absolute top-1 right-5 bg-white text-cscm-green text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {enterpriseCount}
              </span>
            )}
          </button>

          {/* Plus button (aligned and simple like the other buttons) */}
          {user.role !== 'MEMBRE' ? (
            <button
              onClick={() => navigate('/enterprises/add')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors ${
                location.pathname === '/enterprises/add' ? 'text-cscm-gold-light font-bold' : 'text-white/70 hover:text-white'
              }`}
              title="Ajouter une entreprise"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Ajouter</span>
            </button>
          ) : null}

          {/* 4th Button: Cotisations for Admin, Profile for everyone else (ensures max 5 items for perfect layout symmetry) */}
          {user.role === 'ADMIN' ? (
            <button
              onClick={() => navigate('/cotisations')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors ${
                location.pathname === '/cotisations' ? 'text-cscm-gold-light font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <Coins className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Suivi</span>
            </button>
          ) : (
            <button
              onClick={() => setIsProfileOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors ${
                isProfileOpen ? 'text-cscm-gold-light font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white/20 text-white border border-white/30 flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-4 h-4" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">Profil</span>
            </button>
          )}

          {/* 5th Button: Drawer trigger for other action buttons */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-white/60 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Menu</span>
          </button>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImportSuccess={handleImportSuccess}
      />

      {/* Profile Setting Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onLogout={handleLogout}
      />

    </div>
    </SidebarLayoutContext.Provider>
  );
};
