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
  Plus,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FeedbackToast } from './FeedbackToast';
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

  const handleScroll = () => {
    if (scrollRef.current) {
      scrollPositions.current[currentPathNameRef.current] = scrollRef.current.scrollTop;
    }
  };

  useEffect(() => {
    const savedScroll = scrollPositions.current[location.pathname] || 0;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = savedScroll;
    }
    currentPathNameRef.current = location.pathname;
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

  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('sidebar_expanded') === 'true';
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
    setEnterpriseCount(getStoredEnterprises().length);
  };

  const toggleSidebar = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_expanded', String(next));
      return next;
    });
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
      setToastText("Aucune entreprise à exporter.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    exportEnterprisesToCSV(list);
    setToastText("Annuaire exporté (.csv).");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleImportSuccess = () => {
    setToastText("Import Excel terminé.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    window.dispatchEvent(new Event('enterprises_updated'));
  };

  const roleLabel = user.role === 'ADMIN' ? 'Administrateur' : user.role === 'MODERATEUR' ? 'Modérateur' : 'Membre';

  const navigationItems = [
    { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard, badge: null as string | null },
    { label: 'Liste des Entreprises', path: '/enterprises', icon: Building2, badge: enterpriseCount > 0 ? `${enterpriseCount}` : null },
    ...(user.role === 'ADMIN' ? [
      { label: 'Suivi des Cotisations', path: '/cotisations', icon: Coins, badge: null as string | null },
      { label: 'Gestion Utilisateurs', path: '/users', icon: Users, badge: null as string | null },
    ] : [])
  ];

  const NavIconButton = ({
    active,
    onClick,
    title,
    children,
    expanded,
    label,
    badge,
  }: {
    active: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    expanded?: boolean;
    label?: string;
    badge?: string | null;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-full flex items-center transition-all duration-300 cursor-pointer select-none ${
        expanded ? 'justify-between gap-2 px-3 py-2.5 rounded-2xl' : 'justify-center p-0'
      } ${
        active
          ? expanded
            ? 'glass-nav-active font-bold'
            : ''
          : expanded
            ? 'text-white/65 hover:text-white hover:bg-white/10 rounded-2xl'
            : ''
      }`}
    >
      <div className={`flex items-center ${expanded ? 'gap-3 min-w-0' : ''}`}>
        <span
          className={`inline-flex items-center justify-center transition-all duration-300 ${
            expanded
              ? `w-9 h-9 rounded-xl shrink-0 ${active ? 'bg-[#1A3D18]/8 text-white' : 'bg-white/5 text-white/70'}`
              : `w-11 h-11 rounded-2xl ${active ? 'glass-nav-active' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
          }`}
        >
          {children}
        </span>
        {expanded && label && (
          <span className={`text-xs truncate ${active ? 'text-[#1A3D18]' : ''}`}>{label}</span>
        )}
      </div>
      {expanded && badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
          active ? 'bg-[#1A3D18]/10 text-[#1A3D18]' : 'bg-white/15 text-white/80'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <SidebarLayoutContext.Provider value={true}>
      <div className="h-[100dvh] w-full overflow-hidden app-ambient-bg flex flex-col font-sans relative">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-[#a8d49a]/40 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#e8d9a0]/35 blur-3xl" />
          <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] rounded-full bg-white/40 blur-3xl" />
        </div>

        {/* Toast */}
        <FeedbackToast
          message={showToast ? { type: 'success', text: toastText } : null}
          onDismiss={() => setShowToast(false)}
        />

        {/* ═══ NAVBAR VERRE VERT (pleine largeur) ═══ */}
        <header className="relative z-40 shrink-0 mx-3 mt-3 lg:mx-4 lg:mt-4">
          <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6 lg:py-3.5 rounded-[1.5rem] bg-gradient-to-r from-[#2E4D31] via-[#355a38] to-[#2E4D31] shadow-[0_10px_40px_rgba(46,77,49,0.35)] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                <img
                  src={logoImg}
                  alt="Logo CSCM"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              <div className="leading-tight min-w-0">
                <p className="text-sm lg:text-base font-extrabold text-white truncate">
                  Bienvenue {user.prenom || 'System'}
                </p>
                <p className="text-[10px] lg:text-xs font-semibold text-white/70 truncate">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/90 border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Chambre Active
              </span>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="inline-flex items-center gap-2 bg-[#1e3a22]/80 hover:bg-[#162a19] text-white px-3.5 py-2 lg:px-4 rounded-full text-xs font-bold tracking-wide transition-all border border-white/20 shadow-inner cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Réglages</span>
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-9 h-9 rounded-full border-2 border-white/30 bg-white/10 p-0.5 overflow-hidden hover:border-white/50 transition-all cursor-pointer"
                title="Profil"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profil" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserCircle className="w-full h-full text-white/90" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ═══ CORPS : sidebar flottante + contenu ═══ */}
        <div className="flex-1 flex min-h-0 relative z-10 px-3 pb-3 lg:px-4 lg:pb-4 gap-3 lg:gap-4 pt-3">

          {/* Sidebar verre sombre flottante (desktop) */}
          <aside
            className={`hidden lg:flex flex-col glass-sidebar rounded-[1.75rem] transition-all duration-300 shrink-0 overflow-hidden ${
              isExpanded ? 'w-64' : 'w-[4.5rem]'
            }`}
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.75rem]">
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-cscm-green/20 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-cscm-gold/15 blur-2xl" />
            </div>

            <div className={`relative z-10 flex flex-col h-full py-4 ${isExpanded ? 'px-3' : 'px-2.5'}`}>
              {/* Brand mini */}
              {isExpanded && (
                <div className="px-2 mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cscm-gold/80">CSCM</p>
                  <p className="text-xs font-bold text-white/90 mt-0.5">Navigation</p>
                </div>
              )}

              <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-none">
                {navigationItems.map(item => {
                  const isActive = location.pathname === item.path ||
                    (item.path === '/enterprises' && location.pathname.startsWith('/enterprises/') && location.pathname !== '/enterprises/add');
                  const Icon = item.icon;
                  return (
                    <NavIconButton
                      key={item.path}
                      active={isActive}
                      onClick={() => navigate(item.path)}
                      title={item.label}
                      expanded={isExpanded}
                      label={item.label}
                      badge={item.badge}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </NavIconButton>
                  );
                })}

                {user.role !== 'MEMBRE' && (
                  <div className={`${isExpanded ? 'pt-3 mt-2 border-t border-white/10' : 'pt-2'} space-y-2`}>
                    <NavIconButton
                      active={location.pathname === '/enterprises/add'}
                      onClick={() => navigate('/enterprises/add')}
                      title="Ajouter une Entreprise"
                      expanded={isExpanded}
                      label="Ajouter Entreprise"
                    >
                      <Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </NavIconButton>
                    <NavIconButton
                      active={false}
                      onClick={() => setIsImportOpen(true)}
                      title="Importer Excel"
                      expanded={isExpanded}
                      label="Importer Excel"
                    >
                      <FileSpreadsheet className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </NavIconButton>
                    <NavIconButton
                      active={false}
                      onClick={triggerExport}
                      title="Exporter Liste"
                      expanded={isExpanded}
                      label="Exporter Liste"
                    >
                      <Download className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </NavIconButton>
                    {user.role === 'ADMIN' && (
                      <a
                        href="https://console.firebase.google.com/project/aesthetic-computer-mjhcx/firestore/databases/ai-studio-1f26c2df-bc6a-4a47-bfae-9a0c0efaad81/data"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Firebase Database"
                        className={`w-full flex items-center transition-all ${
                          isExpanded ? 'gap-3 px-3 py-2.5 rounded-2xl text-amber-300/80 hover:bg-white/10' : 'justify-center'
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center ${isExpanded ? 'w-9 h-9 rounded-xl bg-white/5' : 'w-11 h-11 rounded-2xl text-amber-300/80 hover:bg-white/10'}`}>
                          <Sparkles className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        </span>
                        {isExpanded && <span className="text-xs font-semibold">Firebase</span>}
                      </a>
                    )}
                  </div>
                )}
              </nav>

              {/* Footer actions sidebar */}
              <div className={`relative z-10 space-y-2 pt-3 mt-2 border-t border-white/10 ${isExpanded ? '' : 'flex flex-col items-center'}`}>
                <button
                  onClick={toggleSidebar}
                  title={isExpanded ? 'Réduire' : 'Agrandir'}
                  className={`flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer ${
                    isExpanded ? 'w-full gap-2 px-3 py-2 rounded-xl text-xs font-bold' : 'w-11 h-11 rounded-2xl'
                  }`}
                >
                  {isExpanded ? (
                    <>
                      <ChevronLeft className="w-4 h-4" />
                      <span>Réduire</span>
                    </>
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => setIsProfileOpen(true)}
                  title="Réglages"
                  className={`flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer ${
                    isExpanded ? 'w-full gap-2 px-3 py-2 rounded-xl text-xs font-bold' : 'w-11 h-11 rounded-2xl'
                  }`}
                >
                  <Settings className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {isExpanded && <span>Réglages</span>}
                </button>

                <button
                  onClick={handleLogout}
                  title="Déconnexion"
                  className={`flex items-center justify-center text-rose-300/70 hover:text-rose-200 hover:bg-rose-500/15 transition-all cursor-pointer ${
                    isExpanded ? 'w-full gap-2 px-3 py-2 rounded-xl text-xs font-bold' : 'w-11 h-11 rounded-2xl'
                  }`}
                >
                  <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {isExpanded && <span>Déconnexion</span>}
                </button>
              </div>
            </div>
          </aside>

          {/* Zone contenu */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden rounded-[1.5rem]">
            {/* Mobile drawer */}
            <AnimatePresence>
              {isMobileOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-3 left-3 w-[min(20rem,85vw)] glass-sidebar text-white z-50 lg:hidden flex flex-col rounded-[1.75rem] overflow-hidden"
                  >
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                          <img src={logoImg} alt="Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <div>
                          <h2 className="text-base font-serif font-black">CSCM</h2>
                          <p className="text-[8px] text-cscm-gold uppercase font-black tracking-widest">Sénégal au Maroc</p>
                        </div>
                      </div>
                      <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-white/70">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div
                      onClick={() => { setIsProfileOpen(true); setIsMobileOpen(false); }}
                      className="p-5 flex items-center gap-3 border-b border-white/10 hover:bg-white/5 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 overflow-hidden">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-full h-full text-white/80 p-0.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate">{user.prenom} {user.nom}</h4>
                        <p className="text-[10px] text-cscm-gold/90 font-bold uppercase truncate">{user.email}</p>
                      </div>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                      {navigationItems.map(item => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setIsMobileOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-semibold transition-all ${
                              isActive ? 'glass-nav-active' : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5" strokeWidth={1.75} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-black/10' : 'bg-white/15'}`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {user.role !== 'MEMBRE' && (
                        <div className="pt-4 mt-2 border-t border-white/10 space-y-1.5">
                          <button
                            onClick={() => { navigate('/enterprises/add'); setIsMobileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-white/70 hover:bg-white/10 text-sm font-semibold"
                          >
                            <Plus className="w-5 h-5" /> Ajouter une Entreprise
                          </button>
                          <button
                            onClick={() => { setIsImportOpen(true); setIsMobileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-white/70 hover:bg-white/10 text-sm font-semibold"
                          >
                            <FileSpreadsheet className="w-5 h-5" /> Importation Excel
                          </button>
                          <button
                            onClick={() => { triggerExport(); setIsMobileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-white/70 hover:bg-white/10 text-sm font-semibold"
                          >
                            <Download className="w-5 h-5" /> Exportation
                          </button>
                        </div>
                      )}
                    </nav>

                    <div className="p-3 border-t border-white/10">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-rose-300 hover:bg-rose-500/15 font-bold text-sm"
                      >
                        <LogOut className="w-5 h-5" /> Déconnexion
                      </button>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Contenu scrollable */}
            {children ? (
              <div className="flex-1 relative overflow-y-auto pb-24 lg:pb-4 w-full h-full">
                {children}
              </div>
            ) : (
              <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pb-24 lg:pb-4 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Footer mobile verre */}
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30">
          <div className="glass-panel !rounded-[1.5rem] !bg-white/70 flex justify-around items-center h-16 px-2 border border-white/60 shadow-[0_8px_30px_rgba(30,70,40,0.12)]">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                location.pathname === '/dashboard' ? 'text-[#2E4D31] font-bold' : 'text-[#2E4D31]/45 hover:text-[#2E4D31]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[10px]">Accueil</span>
            </button>
            <button
              onClick={() => navigate('/enterprises')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative ${
                location.pathname === '/enterprises' ? 'text-[#2E4D31] font-bold' : 'text-[#2E4D31]/45 hover:text-[#2E4D31]'
              }`}
            >
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[10px]">Membres</span>
            </button>
            {user.role !== 'MEMBRE' && (
              <button
                onClick={() => navigate('/enterprises/add')}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  location.pathname === '/enterprises/add' ? 'text-[#2E4D31] font-bold' : 'text-[#2E4D31]/45 hover:text-[#2E4D31]'
                }`}
              >
                <Plus className="w-5 h-5" strokeWidth={1.75} />
                <span className="text-[10px]">Ajouter</span>
              </button>
            )}
            {user.role === 'ADMIN' ? (
              <button
                onClick={() => navigate('/cotisations')}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  location.pathname === '/cotisations' ? 'text-[#2E4D31] font-bold' : 'text-[#2E4D31]/45 hover:text-[#2E4D31]'
                }`}
              >
                <Coins className="w-5 h-5" strokeWidth={1.75} />
                <span className="text-[10px]">Suivi</span>
              </button>
            ) : (
              <button
                onClick={() => setIsProfileOpen(true)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  isProfileOpen ? 'text-[#2E4D31] font-bold' : 'text-[#2E4D31]/45 hover:text-[#2E4D31]'
                }`}
              >
                <Settings className="w-5 h-5" strokeWidth={1.75} />
                <span className="text-[10px]">Profil</span>
              </button>
            )}
          </div>
        </div>

        <ExcelImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </SidebarLayoutContext.Provider>
  );
};
