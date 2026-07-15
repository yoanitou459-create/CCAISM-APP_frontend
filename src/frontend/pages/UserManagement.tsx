import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarLayout } from '../components/SidebarLayout';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { getStoredUsers, saveStoredUsers, AppUser } from '../../database/userStorage';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  AlertCircle,
  Eye,
  Settings,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  // Form fields
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MODERATEUR' | 'MEMBRE'>('MEMBRE');
  const [status, setStatus] = useState<'Actif' | 'Inactif'>('Actif');
  const [entreprise, setEntreprise] = useState('');
  const [formError, setFormError] = useState('');

  // Current logged in user to avoid self-deletion
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Delete target state
  const [deleteTargetUser, setDeleteTargetUser] = useState<AppUser | null>(null);

  // Toast
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);

  const loadUsers = () => {
    setUsers(getStoredUsers());
    const loggedUser = localStorage.getItem('user');
    if (loggedUser) {
      const parsed = JSON.parse(loggedUser);
      setCurrentUser(parsed);
      // Strictly verify if current user is ADMIN, otherwise redirect
      if (parsed.role !== 'ADMIN') {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    loadUsers();
    window.addEventListener('users_updated', loadUsers);
    return () => {
      window.removeEventListener('users_updated', loadUsers);
    };
  }, []);

  const triggerToast = (text: string) => {
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setNom('');
    setPrenom('');
    setEmail('');
    setPassword('');
    setRole('MEMBRE');
    setStatus('Actif');
    setEntreprise('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setNom(user.nom);
    setPrenom(user.prenom);
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
    setStatus(user.status || 'Actif');
    setEntreprise(user.entreprise || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user: AppUser) => {
    if (currentUser && currentUser.email.toLowerCase() === user.email.toLowerCase()) {
      triggerToast("Invalide: Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    setDeleteTargetUser(user);
  };

  const confirmDeleteUser = () => {
    if (!deleteTargetUser) return;
    const updated = users.filter(u => u.id !== deleteTargetUser.id);
    saveStoredUsers(updated);
    triggerToast('Utilisateur supprimé avec succès.');
    setDeleteTargetUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check duplication of email
    const duplicate = users.find(u => u.email.toLowerCase() === trimmedEmail && (!editingUser || u.id !== editingUser.id));
    if (duplicate) {
      setFormError('Un utilisateur avec cette adresse email existe déjà.');
      return;
    }

    if (editingUser) {
      // Edit
      const updated = users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            nom: nom.trim(),
            prenom: prenom.trim(),
            email: trimmedEmail,
            role,
            password: password || 'password',
            status, // Include status!
            entreprise: entreprise.trim()
          };
        }
        return u;
      });
      saveStoredUsers(updated);
      setIsModalOpen(false);
      triggerToast("L'utilisateur a été mis à jour avec succès.");
    } else {
      // Add
      const newUser: AppUser = {
        id: 'u_' + Date.now(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: trimmedEmail,
        role,
        password: password || 'password',
        status, // Include status!
        entreprise: entreprise.trim(),
        dateCreation: new Date().toISOString().split('T')[0]
      };
      saveStoredUsers([...users, newUser]);
      setIsModalOpen(false);
      triggerToast("Nouvel utilisateur créé avec succès.");
    }
  };

  const filteredUsers = users.filter(u => {
    const term = search.toLowerCase();
    const matchSearch = u.nom.toLowerCase().includes(term) || 
                        u.prenom.toLowerCase().includes(term) || 
                        u.email.toLowerCase().includes(term) ||
                        (u.entreprise && u.entreprise.toLowerCase().includes(term));
    const matchRole = roleFilter === '' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <SidebarLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-transparent font-sans">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -45, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -45, x: '-50%' }}
              className="fixed top-4 left-1/2 z-[200] bg-[#0a1208] border border-cscm-gold/30 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-lg bg-cscm-gold/15 text-cscm-gold flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold">{toastText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top welcome banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1b381c] to-[#0a1208] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl border border-white/5">
          <div className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full bg-cscm-gold/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cscm-gold">
                <Users className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Administration Générale</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-black text-cscm-gold">
                Gestion des Utilisateurs accrédités
              </h1>
              <p className="text-white/70 text-xs font-medium max-w-2xl leading-relaxed">
                Configurez les comptes de connexion de la Chambre et paramétrez leurs niveaux d'accréditations réglementaires (Administrateur, Modérateur ou Membre).
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="bg-cscm-gold hover:bg-[#ebd078] text-cscm-dark font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2.5 transition-all duration-200 shadow-lg shrink-0 text-xs select-none cursor-pointer border border-[#ebd078]"
            >
              <UserPlus className="w-4 h-4" />
              Accréditer un utilisateur
            </button>
          </div>
        </div>

        {/* Row explaining roles privileges strictly as requested */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-rose-500/10">
              <Shield className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded uppercase">
                ADMIN (Tous les accès)
              </span>
            </div>
            <p className="text-[#132e15]/80 text-xs mb-3 font-semibold leading-relaxed">Niveau de contrôle total sur l'application.</p>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Tableau de bord complet & finances
              </li>
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Création / Modification d'entreprises
              </li>
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Suppression définitive d'entreprises
              </li>
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Gestion & Accréditations des comptes
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-amber-500/10">
              <Settings className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[10px] bg-amber-100 text-amber-700 font-extrabold px-2 py-0.5 rounded uppercase">
                MODÉRATEUR (Édition sans suppression)
              </span>
            </div>
            <p className="text-[#132e15]/80 text-xs mb-3 font-semibold leading-relaxed">Niveau de supervision et gestion opérationnelle locale.</p>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Consultation du tableau de bord
              </li>
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Ajout & Édition d'entreprises
              </li>
              <li className="flex items-center gap-2 text-red-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                INTERDIT : Suppression d'une entreprise
              </li>
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Exportation autorisée (.CSV, Rapports)
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-blue-500/10">
              <User className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded uppercase">
                MEMBRE (Consultation simple)
              </span>
            </div>
            <p className="text-[#132e15]/80 text-xs mb-3 font-semibold leading-relaxed">Niveau d'observation membre de l'annuaire bilatéral.</p>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Consultation de base du tableau de bord
              </li>
              <li className="flex items-center gap-2 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                Voir la liste complète des membres
              </li>
              <li className="flex items-center gap-2 text-amber-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Accès exclusif : Fiche technique uniquement
              </li>
              <li className="flex items-center gap-2 text-rose-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Bloqué : Ajout, Édition, Suppression, Export
              </li>
            </ul>
          </div>

        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-[#132e15]/20 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-[#132e15] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Saisissez un prénom, nom, ou email pour rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-cscm-green transition-all text-xs font-semibold text-[#132e15]"
            />
          </div>

          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-56 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-cscm-green transition-all text-xs text-gray-700 font-bold"
          >
            <option value="">Tous les Rôles ...</option>
            <option value="ADMIN">ADMINISTRATEUR</option>
            <option value="MODERATEUR">MODÉRATEUR</option>
            <option value="MEMBRE">MEMBRE</option>
          </select>
        </div>

        {/* Users list as high contrast table */}
        <div className="bg-white rounded-3xl border border-[#132e15]/20 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-[#132e15] text-[11px] font-black uppercase text-white tracking-wider">
                  <th className="p-5 border-b border-[#132e15]/20">Identité</th>
                  <th className="p-5 border-b border-[#132e15]/20">Email</th>
                  <th className="p-5 border-b border-[#132e15]/20">Niveau d'accréditation</th>
                  <th className="p-5 border-b border-[#132e15]/20 font-bold text-center">Statut</th>
                  <th className="p-5 border-b border-[#132e15]/20">Date de création</th>
                  <th className="p-5 border-b border-[#132e15]/20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#132e15]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#132e15]/60 font-bold text-xs">
                      Aucun utilisateur ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isSelf = currentUser && currentUser.email.toLowerCase() === u.email.toLowerCase();
                    const userPhoto = u.photo || (isSelf ? localStorage.getItem('profile_photo') : null);
                    return (
                      <tr key={`${u.id || idx}-${idx}`} className="hover:bg-[#FAF9F5]/50 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-cscm-gold/40 bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs ring-2 ring-cscm-green/5 overflow-hidden">
                              {userPhoto ? (
                                <img src={userPhoto} alt={`${u.prenom} ${u.nom}`} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-cscm-green/10 to-cscm-green/5 text-cscm-green flex items-center justify-center font-bold text-xs uppercase">
                                  {u.prenom[0]}{u.nom[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#132e15]">{u.prenom} {u.nom}</p>
                              {u.entreprise && (
                                <p className="text-[10px] text-[#132e15]/65 font-bold italic mt-0.5">
                                  {u.entreprise}
                                </p>
                              )}
                              {isSelf && (
                                <span className="inline-block text-[8px] bg-[#E1EADF] text-[#132e15] font-black uppercase rounded px-1.5 py-0.2 mt-0.5">
                                  Votre Compte Actif
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-5 font-mono text-xs text-[#132e15]/85 font-semibold">{u.email}</td>
                        <td className="p-5">
                          {u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-red-50 text-red-700 font-extrabold uppercase px-2.5 py-1 rounded-full border border-red-100">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Admin
                            </span>
                          ) : u.role === 'MODERATEUR' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 font-extrabold uppercase px-2.5 py-1 rounded-full border border-amber-100">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Modérateur
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-blue-50 text-blue-700 font-extrabold uppercase px-2.5 py-1 rounded-full border border-blue-100">
                              <User className="w-3.5 h-3.5" />
                              Membre
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          {u.status === 'Inactif' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 text-rose-700 font-extrabold uppercase px-2.5 py-1 rounded-full border border-rose-100">
                              Inactif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-100">
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-xs text-[#132e15]/80 font-bold">{u.dateCreation}</td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-1.5 align-center">
                            <button 
                              onClick={() => handleOpenEdit(u)}
                              className="p-2 text-[#132e15] hover:text-cscm-green hover:bg-[#FAF9F5] rounded-xl transition-all cursor-pointer border border-[#132e15]/10"
                              title="Modifier l'utilisateur"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                                isSelf 
                                  ? 'text-gray-200 border-transparent cursor-not-allowed' 
                                  : 'text-rose-700 border-rose-100 hover:text-red-600 hover:bg-rose-50'
                              }`}
                              title={isSelf ? "Vous ne pouvez pas vous supprimer" : "Supprimer définitivement"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add / Edit User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[120] backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden border border-gray-150 shadow-2xl"
            >
              <div className="p-6 bg-[#0a1208] text-white flex justify-between items-center border-b border-[#112310]">
                <div>
                  <h3 className="text-sm font-serif font-black text-cscm-gold tracking-wide">
                    {editingUser ? "Modifier l'Accréditation" : "Accréditer un collaborateur"}
                  </h3>
                  <p className="text-[9px] text-white/65 uppercase tracking-wider font-bold mt-0.5">
                    {editingUser ? "Éditer un compte existant" : "Enregistrer un nouveau compte"}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-xs text-center flex items-center gap-1.5 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider">Prénom *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Saisissez le prénom (Ex: Ibrahima)"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-cscm-green outline-none text-xs transition-colors font-semibold text-[#132e15]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider">Nom *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Saisissez le nom (Ex: Diop)"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-cscm-green outline-none text-xs transition-colors font-semibold text-[#132e15]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-cscm-gold" />
                    Adresse Email *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="Saisissez l'adresse email professionnelle (Ex: i.diop@cscm.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-cscm-green outline-none text-xs transition-colors font-semibold text-[#132e15]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-cscm-gold" />
                    Entreprise / Raison Sociale
                  </label>
                  <input 
                    type="text" 
                    placeholder="Saisissez le nom de l'entreprise (Optionnel)"
                    value={entreprise}
                    onChange={(e) => setEntreprise(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-cscm-green outline-none text-xs transition-colors font-semibold text-[#132e15]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-cscm-gold" />
                    Mot de passe *
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="Saisissez le mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-cscm-green outline-none text-xs transition-colors font-semibold text-[#132e15]"
                  />
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-cscm-gold" />
                    Rôle / Droits d'Utilisation *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-cscm-green outline-none text-xs font-bold text-[#132e15] transition-colors"
                  >
                    <option value="MEMBRE">Membre (Fiche technique uniquement)</option>
                    <option value="MODERATEUR">Modérateur (Éditer / Exporter, sans suppression)</option>
                    <option value="ADMIN">ADMINISTRATEUR (Tous les accès)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cscm-gold" />
                    Statut du Compte *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-cscm-green outline-none text-xs font-bold text-[#132e15] transition-colors"
                  >
                    <option value="Actif">Actif (Accès autorisé)</option>
                    <option value="Inactif">Inactif (Connexion bloquée)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 text-xs font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Fermer
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-xs font-black text-white bg-cscm-green hover:bg-[#132c14] rounded-xl transition-all cursor-pointer text-center shadow-md shadow-cscm-green/10"
                  >
                    {editingUser ? "Sauvegarder" : "Inscrire l'utilisateur"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={deleteTargetUser !== null}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={confirmDeleteUser}
        title={`Voulez-vous vraiment supprimer définitivement l'utilisateur ${deleteTargetUser?.prenom} ${deleteTargetUser?.nom} (${deleteTargetUser?.email}) ?`}
      />
    </SidebarLayout>
  );
};
