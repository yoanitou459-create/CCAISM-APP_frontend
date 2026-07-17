import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ModalPortal } from '../components/ModalPortal';
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
      triggerToast("Impossible de supprimer votre propre compte.");
      return;
    }
    setDeleteTargetUser(user);
  };

  const confirmDeleteUser = () => {
    if (!deleteTargetUser) return;
    const updated = users.filter(u => u.id !== deleteTargetUser.id);
    saveStoredUsers(updated);
    triggerToast('Utilisateur supprimé.');
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
      triggerToast('Utilisateur mis à jour.');
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
      triggerToast('Nouvel utilisateur créé.');
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
    <>
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 font-sans bg-transparent">
        
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

        {/* En-tête page + CTA principal */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#12210E]/10 pb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-cscm-green mb-1.5">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Administration</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-[#12210E] tracking-tight">
              Gestion des utilisateurs
            </h1>
            <p className="text-sm font-semibold text-[#1A3D18]/65 mt-1 max-w-xl leading-relaxed">
              Créez et gérez les comptes (Admin, Modérateur, Membre) de la Chambre.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary shrink-0 w-full sm:w-auto px-6 py-3 text-sm shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un utilisateur
          </button>
        </div>

        {/* Rôles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="surface-card surface-card-hover p-5 relative overflow-hidden">
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

          <div className="surface-card surface-card-hover p-5 relative overflow-hidden">
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

          <div className="surface-card surface-card-hover p-5 relative overflow-hidden">
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

        {/* Barre filtres + action */}
        <div className="surface-card p-4 md:p-5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-cscm-green/60 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <input 
              type="text" 
              placeholder="Rechercher un prénom, nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input pl-10"
            />
          </div>

          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="field-select w-full lg:w-52 shrink-0"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="MODERATEUR">Modérateur</option>
            <option value="MEMBRE">Membre</option>
          </select>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary shrink-0 w-full lg:w-auto px-5 py-3"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Users list as high contrast table */}
        <div className="table-wrap shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
          <table className="data-table min-w-[850px]">
              <thead>
                <tr>
                  <th>Identité</th>
                  <th>Email</th>
                  <th>Niveau d'accréditation</th>
                  <th className="text-center">Statut</th>
                  <th>Date de création</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#132e15]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#132e15]/60 font-bold text-xs">
                      <p className="mb-4">Aucun utilisateur ne correspond à votre recherche.</p>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="btn-primary mx-auto"
                      >
                        <UserPlus className="w-4 h-4" />
                        Ajouter un utilisateur
                      </button>
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
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-xs font-semibold text-[#132e15]/80">{u.email}</td>
                        <td className="p-5">
                          <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${
                            u.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' :
                            u.role === 'MODERATEUR' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            u.status === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.status === 'Actif' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            {u.status || 'Actif'}
                          </span>
                        </td>
                        <td className="p-5 text-xs font-semibold text-[#132e15]/70">{u.dateCreation || '—'}</td>
                        <td className="p-5">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEdit(u)}
                              className="btn-icon"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className="btn-icon-danger disabled:hover:bg-white disabled:hover:border-rose-100"
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
      <ModalPortal>
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="modal-shell-md overflow-hidden"
            >
              <div className="modal-header-dark items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cscm-gold/15 text-cscm-gold flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-black text-cscm-gold tracking-wide">
                      {editingUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
                    </h3>
                    <p className="text-[9px] text-white/65 uppercase tracking-wider font-bold mt-0.5">
                      {editingUser ? "Éditer un compte existant" : "Créer un nouveau compte"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="modal-body space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-xs text-center flex items-center gap-1.5 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">
                      <User />
                      Prénom *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Ibrahima"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">
                      <User />
                      Nom *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Diop"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="field-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">
                    <Mail />
                    Adresse Email *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="ex: utilisateur@cscm.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">
                    <Lock />
                    Mot de passe {editingUser ? '(laisser vide = inchangé)' : '*'}
                  </label>
                  <input 
                    type="text" 
                    required={!editingUser}
                    placeholder={editingUser ? '••••••••' : 'Définir un mot de passe'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">
                    <Building2 />
                    Entreprise (optionnel)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Raison sociale liée"
                    value={entreprise}
                    onChange={(e) => setEntreprise(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">
                    <Shield />
                    Rôle *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="field-select"
                  >
                    <option value="MEMBRE">MEMBRE (Consultation)</option>
                    <option value="MODERATEUR">MODÉRATEUR (Édition)</option>
                    <option value="ADMIN">ADMINISTRATEUR (Tous les accès)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">
                    <CheckCircle2 />
                    Statut du compte *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="field-select"
                  >
                    <option value="Actif">Actif (Accès autorisé)</option>
                    <option value="Inactif">Inactif (Connexion bloquée)</option>
                  </select>
                </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingUser ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Enregistrer
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Créer l'utilisateur
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </ModalPortal>

      <ConfirmationModal
        isOpen={deleteTargetUser !== null}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={confirmDeleteUser}
        variant="danger"
        title="Supprimer cet utilisateur ?"
        highlight={
          deleteTargetUser
            ? `${deleteTargetUser.prenom} ${deleteTargetUser.nom} · ${deleteTargetUser.email}`
            : undefined
        }
        description="Son compte sera retiré définitivement. Cette personne ne pourra plus se connecter à l'application."
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
      />
    </>
  );
};
