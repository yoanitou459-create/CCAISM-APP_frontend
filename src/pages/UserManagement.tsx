import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarLayout } from '../components/SidebarLayout';
import { getStoredUsers, saveStoredUsers, AppUser } from '../utils/userStorage';
import { isLocalEnvironment } from '../lib/localEnvironment';
import { seedFirestoreDatabase } from '../lib/seedFirestore';
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
  Database
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
  const [formError, setFormError] = useState('');

  // Current logged in user to avoid self-deletion
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Toast
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);

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

  const handleSyncFirestore = async () => {
    if (!window.confirm('Envoyer toutes les données (utilisateurs, entreprises, règles) vers Firebase Firestore ?')) {
      return;
    }
    setIsSyncingFirestore(true);
    try {
      const result = await seedFirestoreDatabase();
      if (result.errors.length > 0) {
        triggerToast(`Sync partielle : ${result.users} users, ${result.enterprises} entreprises. Vérifiez la console.`);
        console.error('Erreurs sync Firestore:', result.errors);
      } else {
        triggerToast(`Firebase OK : ${result.users} utilisateurs, ${result.enterprises} entreprises synchronisés.`);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Échec sync Firebase. Activez l\'auth anonyme dans Firebase Console.');
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setNom('');
    setPrenom('');
    setEmail('');
    setPassword('');
    setRole('MEMBRE');
    setStatus('Actif');
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
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (currentUser && currentUser.email.toLowerCase() === userEmail.toLowerCase()) {
      alert("Invalide: Vous ne pouvez pas supprimer votre propre compte administrateur en cours d'utilisation.");
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${userEmail} ?`)) {
      const updated = users.filter(u => u.id !== userId);
      await saveStoredUsers(updated);
      triggerToast('Utilisateur supprimé avec succès.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
            password: password || (isLocalEnvironment() ? '12345' : 'password'),
            status // Include status!
          };
        }
        return u;
      });
      await saveStoredUsers(updated);
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
        password: password || (isLocalEnvironment() ? '12345' : 'password'),
        status, // Include status!
        dateCreation: new Date().toISOString().split('T')[0]
      };
      await saveStoredUsers([...users, newUser]);
      setIsModalOpen(false);
      triggerToast("Nouvel utilisateur créé avec succès.");
    }
  };

  const filteredUsers = users.filter(u => {
    const term = search.toLowerCase();
    const matchSearch = u.nom.toLowerCase().includes(term) || 
                        u.prenom.toLowerCase().includes(term) || 
                        u.email.toLowerCase().includes(term);
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
              className="fixed top-4 left-1/2 z-[200] bg-white border border-cscm-green/15 text-[#274420] rounded-2xl px-6 py-4 shadow-[0_20px_50px_-16px_rgba(62,123,50,0.35)] ring-1 ring-black/5 flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-lg bg-cscm-green-soft text-cscm-green flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold">{toastText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top welcome banner */}
        <div className="hero-banner">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cscm-green">
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Administration Générale</span>
              </div>
              <h1 className="page-title">
                Gestion des Utilisateurs accrédités
              </h1>
              <p className="text-[#22301C]/60 text-xs font-medium max-w-2xl leading-relaxed">
                Configurez les comptes de connexion de la Chambre et paramétrez leurs niveaux d'accréditations réglementaires (Administrateur, Modérateur ou Membre).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="button"
                onClick={handleSyncFirestore}
                disabled={isSyncingFirestore}
                className="px-6 py-3.5 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider rounded-2xl border-2 border-cscm-green/30 text-cscm-green bg-white hover:bg-cscm-green-soft transition-all disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                {isSyncingFirestore ? 'Synchronisation...' : 'Sync Firebase'}
              </button>
              <button
              onClick={handleOpenAdd}
              className="btn-submit px-6 py-3.5 flex items-center gap-2.5 shrink-0 text-xs select-none"
            >
              <UserPlus className="w-4 h-4" />
              Accréditer un utilisateur
            </button>
            </div>
          </div>
        </div>

        {/* Row explaining roles privileges strictly as requested */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="card-elevated p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-rose-500/10">
              <Shield className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2.5 py-0.5 rounded-full uppercase">
                ADMIN (Tous les accès)
              </span>
            </div>
            <p className="text-[#22301C]/55 text-xs mb-3 font-semibold leading-relaxed">Niveau de contrôle total sur l'application.</p>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Tableau de bord complet & finances
              </li>
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Création / Modification d'entreprises
              </li>
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Suppression définitive d'entreprises
              </li>
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Gestion & Accréditations des comptes
              </li>
            </ul>
          </div>

          <div className="card-elevated p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-amber-500/10">
              <Settings className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 font-bold px-2.5 py-0.5 rounded-full uppercase">
                MODÉRATEUR (Édition sans suppression)
              </span>
            </div>
            <p className="text-[#22301C]/55 text-xs mb-3 font-semibold leading-relaxed">Niveau de supervision et gestion opérationnelle locale.</p>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Consultation du tableau de bord
              </li>
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Ajout & Édition d'entreprises
              </li>
              <li className="flex items-center gap-2 text-rose-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                INTERDIT : Suppression d'une entreprise
              </li>
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Exportation autorisée (.CSV, Rapports)
              </li>
            </ul>
          </div>

          <div className="card-elevated p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-blue-500/10">
              <User className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[10px] bg-cscm-green-soft text-cscm-green border border-cscm-green/15 font-bold px-2.5 py-0.5 rounded-full uppercase">
                MEMBRE (Consultation simple)
              </span>
            </div>
            <p className="text-[#22301C]/55 text-xs mb-3 font-semibold leading-relaxed">Niveau d'observation membre de l'annuaire bilatéral.</p>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Consultation de base du tableau de bord
              </li>
              <li className="flex items-center gap-2 text-[#22301C]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Voir la liste complète des membres
              </li>
              <li className="flex items-center gap-2 text-amber-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Accès exclusif : Fiche technique uniquement
              </li>
              <li className="flex items-center gap-2 text-rose-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Bloqué : Ajout, Édition, Suppression, Export
              </li>
            </ul>
          </div>

        </div>

        {/* Filter Bar */}
        <div className="card-elevated p-5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher par prénom, nom, ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs font-semibold text-gray-800 placeholder:text-gray-300 transition-all"
            />
          </div>

          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-56 px-4 py-3 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs text-gray-800 font-bold transition-all"
          >
            <option value="">Tous les Rôles ...</option>
            <option value="ADMIN">ADMINISTRATEUR</option>
            <option value="MODERATEUR">MODÉRATEUR</option>
            <option value="MEMBRE">MEMBRE</option>
          </select>
        </div>

        {/* Users list as high contrast table */}
        <div className="table-shell">
            <table className="table-base min-w-[850px]">
              <thead className="table-head">
                <tr className="table-head-row">
                  <th className="table-th">Identité</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Niveau d'accréditation</th>
                  <th className="table-th text-center">Statut</th>
                  <th className="table-th">Date de création</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-td p-10 text-center text-cscm-dark/55 font-bold text-xs">
                      Aucun utilisateur ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isSelf = currentUser && currentUser.email.toLowerCase() === u.email.toLowerCase();
                    return (
                      <tr key={`${u.id || idx}-${idx}`} className="table-row">
                        <td className="table-td">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cscm-green-soft text-cscm-green flex items-center justify-center font-bold text-xs border border-cscm-green/15">
                              {u.prenom[0]}{u.nom[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#274420]">{u.prenom} {u.nom}</p>
                              {isSelf && (
                                <span className="inline-block text-[8px] bg-cscm-green-soft text-cscm-green border border-cscm-green/15 font-bold uppercase rounded-full px-1.5 py-0.2 mt-0.5">
                                  Votre Compte Actif
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="table-td font-mono text-xs text-cscm-dark/70 font-semibold">{u.email}</td>
                        <td className="table-td">
                          {u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 text-rose-600 font-bold uppercase px-2.5 py-1 rounded-full border border-rose-100">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Admin
                            </span>
                          ) : u.role === 'MODERATEUR' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-600 font-bold uppercase px-2.5 py-1 rounded-full border border-amber-100">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Modérateur
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-cscm-green-soft text-cscm-green font-bold uppercase px-2.5 py-1 rounded-full border border-cscm-green/15">
                              <User className="w-3.5 h-3.5" />
                              Membre
                            </span>
                          )}
                        </td>
                        <td className="table-td text-center">
                          {u.status === 'Inactif' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 text-rose-600 font-bold uppercase px-2.5 py-1 rounded-full border border-rose-100">
                              Inactif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-cscm-green-soft text-cscm-green font-bold uppercase px-2.5 py-1 rounded-full border border-cscm-green/15">
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="table-td text-xs text-cscm-dark/55 font-semibold">{u.dateCreation}</td>
                        <td className="table-td text-right">
                          <div className="flex justify-end gap-1.5 align-center">
                            <button 
                              onClick={() => handleOpenEdit(u)}
                              className="p-2 text-gray-500 hover:text-cscm-green hover:bg-cscm-green-soft/60 rounded-2xl transition-all duration-300 cursor-pointer bg-white border border-gray-200 hover:border-cscm-green/30 shadow-sm hover:shadow-md"
                              title="Modifier l'utilisateur"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              disabled={isSelf}
                              className={`p-2 rounded-2xl transition-all duration-300 cursor-pointer border ${
                                isSelf 
                                  ? 'text-gray-200 border-transparent cursor-not-allowed' 
                                  : 'text-rose-500 bg-white border-rose-100 hover:text-rose-600 hover:bg-rose-50 shadow-sm hover:shadow-md'
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

      {/* Add / Edit User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-[120] backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden ring-1 ring-black/5 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)]"
            >
              <div className="modal-header">
                <div>
                  <h3 className="text-sm font-sans font-bold text-[#274420] tracking-wide">
                    {editingUser ? "Modifier l'Accréditation" : "Accréditer un collaborateur"}
                  </h3>
                  <p className="text-[9px] text-[#22301C]/55 uppercase tracking-wider font-bold mt-0.5">
                    {editingUser ? "Éditer un compte existant" : "Enregistrer un nouveau compte"}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors duration-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold text-xs text-center flex items-center gap-1.5 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-[#274420] tracking-wider">Prénom *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Ibrahima"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs transition-all font-semibold text-gray-800 placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-[#274420] tracking-wider">Nom *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Diop"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs transition-all font-semibold text-gray-800 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-[#274420] tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    Adresse Email *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="Ex: i.diop@cscm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs transition-all font-semibold text-gray-800 placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-[#274420] tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    Mot de passe *
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="Saisissez le mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs transition-all font-semibold text-gray-800 placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-[10px] font-bold uppercase text-[#274420] tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    Rôle / Droits d'Utilisation *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs font-bold text-gray-800 transition-all"
                  >
                    <option value="MEMBRE">Membre (Fiche technique uniquement)</option>
                    <option value="MODERATEUR">Modérateur (Éditer / Exporter, sans suppression)</option>
                    <option value="ADMIN">ADMINISTRATEUR (Tous les accès)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-[10px] font-bold uppercase text-[#274420] tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Statut du Compte *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white text-xs font-bold text-gray-800 transition-all"
                  >
                    <option value="Actif">Actif (Accès autorisé)</option>
                    <option value="Inactif">Inactif (Connexion bloquée)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 text-xs font-bold bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-600 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center"
                  >
                    Fermer
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-xs font-bold text-white btn-sheen bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] rounded-2xl shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer text-center"
                  >
                    {editingUser ? "Sauvegarder" : "Inscrire l'utilisateur"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
};
