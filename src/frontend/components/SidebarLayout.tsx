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
import { getStoredEnterprises, saveStoredEnterprises } from '../../database/enterpriseStorage';
import { exportEnterprisesToCSV } from '../../backend/exportUtils';
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
  const currentPathNameRef = React.useRef(location.pathname);

  // Capture scroll position for the current pathname as the user scrolls
  const handleScroll = () => {
    if (scrollRef.current) {
      scrollPositions.current[currentPathNameRef.current] = scrollRef.current.scrollTop;
    }
  };

  useEffect(() => {
    // When path changes, restore the scroll position (or 0 if not visited yet)
    const savedScroll = scrollPositions.current[location.pathname] || 0;
    
    if (scrollRef.current) {
      scrollRef.current.scrollTop = savedScroll;
    }

    // Update path reference after we applied/restored scroll position
    currentPathNameRef.current = location.pathname;

    // Double check after transitions complete to ensure exact positioning
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
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#f5faef] via-[#FAF9F5] to-[#fefbe3] flex font-sans">
      {/* Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[100] bg-cscm-dark border border-cscm-gold/30 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-cscm-gold/15 text-cscm-gold flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-sans text-sm font-semibold">{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Resizing according to isExpanded) */}
      <aside className={`hidden lg:flex flex-col transition-all duration-300 ${isExpanded ? 'w-72' : 'w-20'} bg-[#0a1208] border-r border-[#1a3315] text-white shrink-0 h-screen sticky top-0 relative z-30 overflow-hidden`}>
        {/* Glow Effects */}
        <div className="absolute -left-20 -top-20 w-44 h-44 rounded-full bg-cscm-green/25 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-44 h-44 rounded-full bg-cscm-gold/15 blur-3xl pointer-events-none" />

        {/* Sidebar Header Brand */}
        <div className={`p-6 border-b border-[#112310] relative z-10 flex items-center ${isExpanded ? 'gap-3 justify-start' : 'justify-center'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cscm-green to-[#12210e] flex items-center justify-center border border-white/10 shadow-lg shrink-0 overflow-hidden relative">
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
              <h1 className="text-base font-serif font-black tracking-wide text-white truncate">Portail CSCM</h1>
              <p className="text-[8px] text-cscm-gold uppercase font-black tracking-widest leading-none mt-0.5 truncate">Chambre Sénégalaise</p>
            </div>
          )}
        </div>

        {/* User Mini Card (Clicking triggers Profile update) */}
        <div 
          onClick={() => setIsProfileOpen(true)}
          className={`p-4 mx-3 mt-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer relative z-10 flex items-center ${isExpanded ? 'gap-3.5 mx-4 p-5 justify-start' : 'justify-center'}`}
          title="Mon Profil Utilisateur"
        >
          <div className="w-10 h-10 rounded-full bg-cscm-green/20 text-cscm-gold border border-cscm-green/35 flex items-center justify-center shrink-0 overflow-hidden">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-6 h-6" />
            )}
          </div>
          {isExpanded && (
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{user.prenom} {user.nom}</h4>
              <p className="text-[8px] text-cscm-gold font-black uppercase tracking-wider mt-0.5 bg-cscm-green/20 px-1.5 py-0.5 rounded inline-block">
                Role: {user.role || 'MEMBRE'}
              </p>
            </div>
          )}
        </div>

        {/* Main Nav Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 relative z-10 overflow-y-auto">
          {isExpanded && (
            <span className="px-4 text-[9px] font-black uppercase text-white/30 tracking-widest block mb-3">Navigation</span>
          )}
          
          {navigationItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center ${isExpanded ? 'justify-between px-4' : 'justify-center p-3'} py-3 rounded-2xl transition-all duration-300 font-sans text-sm font-semibold select-none cursor-pointer ${
                  isActive 
                    ? 'bg-cscm-green text-white shadow-lg shadow-cscm-green/20 border-l-4 border-cscm-gold pl-3' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cscm-gold' : 'text-white/40'}`} />
                  {isExpanded && <span className="text-xs">{item.label}</span>}
                </div>
                {isExpanded && item.badge && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#214118] text-cscm-gold' : 'bg-white/10 text-white/80'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {user.role !== 'MEMBRE' && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">
              {isExpanded && (
                <span className="px-4 text-[9px] font-black uppercase text-white/30 tracking-widest block mb-2">Actions de données</span>
              )}
              
              <button
                onClick={() => navigate('/enterprises/add')}
                className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl font-sans text-xs font-semibold cursor-pointer text-left transition-all ${
                  location.pathname === '/enterprises/add'
                    ? 'bg-cscm-green text-white shadow-lg shadow-cscm-green/20 border-l-4 border-cscm-gold pl-3'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title="Ajouter une Entreprise"
              >
                <Plus className="w-5 h-5 text-cscm-gold shrink-0" />
                {isExpanded && <span>Ajouter Entreprise</span>}
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-sans text-xs font-semibold cursor-pointer text-left transition-all`}
                title="Importation Excel / CSV"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                {isExpanded && <span>Importer Excel</span>}
              </button>

              <button
                onClick={triggerExport}
                className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-sans text-xs font-semibold cursor-pointer text-left transition-all`}
                title="Exportation de la Liste"
              >
                <Download className="w-5 h-5 text-cscm-gold shrink-0" />
                {isExpanded && <span>Exporter Liste</span>}
              </button>

              {user.role === 'ADMIN' && (
                <a
                  href="https://console.firebase.google.com/project/aesthetic-computer-mjhcx/firestore/databases/ai-studio-1f26c2df-bc6a-4a47-bfae-9a0c0efaad81/data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center p-3'} py-3 rounded-2xl text-orange-400 hover:text-white hover:bg-amber-500/10 font-sans text-xs font-black cursor-pointer text-left transition-all`}
                  title="Base de données Firebase (Firestore)"
                >
                  <Sparkles className="w-5 h-5 text-[#ffa600] shrink-0 fill-[#ffa600]/20 animate-pulse" />
                  {isExpanded && <span>Firebase Database</span>}
                </a>
              )}
            </div>
          )}
        </nav>

        {/* Expand / Collapse Toggle row */}
        <div className="px-2 py-2 border-t border-white/5 bg-white/5 relative z-10 shrink-0">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center ${isExpanded ? 'justify-start gap-3 px-4' : 'justify-center'} py-2 rounded-xl text-white/50 hover:text-white transition-all duration-200 text-xs font-bold cursor-pointer`}
            title={isExpanded ? "Réduire le menu" : "Agrandir le menu"}
          >
            {isExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4 text-cscm-gold shrink-0" />
                <span className="text-[10px]">Plier le menu</span>
              </>
            ) : (
              <ChevronRight className="w-5 h-5 text-cscm-gold shrink-0" />
            )}
          </button>
        </div>

        {/* Sidebar Logout Footer */}
        <div className="p-3 border-t border-[#1a3116] relative z-10 bg-[#070d06] shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4 py-3' : 'justify-center p-3'} rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/10 font-bold text-xs tracking-wide transition-colors cursor-pointer`}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isExpanded && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Container including Top Header Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar for Desktop - Elegant & High Contrast */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/95 backdrop-blur-xs border-b border-gray-200/85 shadow-xs shrink-0 sticky top-0 z-40">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-white" />
              <p className="text-xs font-semibold text-gray-600 bg-gray-55 bg-gray-100 px-3 py-1 rounded-full border border-gray-150">
                Bienvenue <b className="text-[#132e15]">{user.prenom} {user.nom}</b> | {user.role === 'ADMIN' ? 'Administrateur CSCM' : user.role === 'MODERATEUR' ? 'Modérateur CSCM' : 'Membre CSCM'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-100/60">
              Chambre Active
            </span>

            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 bg-[#1b381c] hover:bg-[#122613] text-white px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-md cursor-pointer shrink-0 select-none border border-white/10"
            >
              <Settings className="w-3.5 h-3.5 text-cscm-gold" />
              <span>Réglages Profil</span>
            </button>
          </div>
        </header>

        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-[#070d06]/95 backdrop-blur-xs border-b border-[#112310] text-white p-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0"
            >
              <Menu className="w-6 h-6 text-cscm-gold" />
            </button>
            <div className="text-left">
              <h1 className="text-base font-serif font-black leading-none">CSCM</h1>
              <p className="text-[7px] text-cscm-gold uppercase tracking-widest font-black mt-0.5">Chambre Sénégalaise au Maroc</p>
            </div>
          </div>

          <div 
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-cscm-green/20 text-cscm-gold border border-cscm-green/45 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
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
                className="fixed inset-y-0 left-0 w-80 bg-[#0a1208] text-white z-50 lg:hidden flex flex-col"
              >
                <div className="p-6 border-b border-[#112310] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cscm-green flex items-center justify-center shrink-0 overflow-hidden relative">
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
                      <h2 className="text-lg font-serif font-black">CSCM</h2>
                      <p className="text-[8px] text-cscm-gold uppercase font-black tracking-widest mt-0.5">Sénégal au Maroc</p>
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
                  className="p-6 flex items-center gap-3 border-b border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  title="Modifier mon profil"
                >
                  <div className="w-10 h-10 rounded-full bg-cscm-green/20 text-cscm-gold border border-cscm-green/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate">{user.prenom} {user.nom}</h4>
                    <p className="text-[10px] text-cscm-gold/90 font-bold uppercase tracking-wider">{user.email}</p>
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
                            ? 'bg-cscm-green text-white shadow-lg shadow-cscm-green/15 border-l-4 border-cscm-gold pl-3' 
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-cscm-gold' : 'text-white/40'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {user.role !== 'MEMBRE' && (
                    <div className="pt-6 mt-6 border-t border-white/10 space-y-1.5">
                      <button
                        onClick={() => {
                          navigate('/enterprises/add');
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-sans text-sm font-semibold cursor-pointer text-left transition-colors"
                      >
                        <Plus className="w-5 h-5 text-cscm-gold shrink-0" />
                        <span>Ajouter une Entreprise</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsImportOpen(true);
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-sans text-sm font-semibold cursor-pointer text-left transition-colors"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Importation Excel / CSV</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerExport();
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-sans text-xs font-semibold cursor-pointer text-left transition-colors"
                      >
                        <Download className="w-5 h-5 text-cscm-gold shrink-0" />
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
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-orange-400 hover:text-white hover:bg-amber-500/10 font-sans text-sm font-black cursor-pointer text-left transition-colors"
                        >
                          <Sparkles className="w-5 h-5 text-[#ffa600] shrink-0 fill-[#ffa600]/20" />
                          <span>Console Firebase DB</span>
                        </a>
                      )}
                    </div>
                  )}
                </nav>

                <div className="p-4 border-t border-white/5 bg-[#0e180b]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/10 font-bold text-sm tracking-wide transition-colors"
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
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pb-24 lg:pb-6 relative scroll-smooth">
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070d06]/95 backdrop-blur-md border-t border-[#112310] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex justify-around items-center h-16 px-2">
          {/* Dashboard tab */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors ${
              location.pathname === '/dashboard' ? 'text-cscm-gold font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Accueil</span>
          </button>

          {/* Enterprises tab */}
          <button
            onClick={() => navigate('/enterprises')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors relative ${
              location.pathname === '/enterprises' ? 'text-cscm-gold font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Membres</span>
            {enterpriseCount > 0 && (
              <span className="absolute top-1 right-5 bg-cscm-gold text-[#0a1208] text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {enterpriseCount}
              </span>
            )}
          </button>

          {/* Plus button (aligned and simple like the other buttons) */}
          {user.role !== 'MEMBRE' ? (
            <button
              onClick={() => navigate('/enterprises/add')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors ${
                location.pathname === '/enterprises/add' ? 'text-cscm-gold font-bold' : 'text-white/60 hover:text-white'
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
                location.pathname === '/cotisations' ? 'text-cscm-gold font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <Coins className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Suivi</span>
            </button>
          ) : (
            <button
              onClick={() => setIsProfileOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-colors ${
                isProfileOpen ? 'text-cscm-gold font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-cscm-green/20 text-cscm-gold border border-cscm-green/35 flex items-center justify-center overflow-hidden">
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
