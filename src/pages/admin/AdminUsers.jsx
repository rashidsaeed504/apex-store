import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Mail, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Users,
  Edit3,
  Clock,
  Crown,
  Shield,
  Search,
  Check,
  AlertTriangle
} from 'lucide-react';
import { 
  fetchAdminUsers, 
  addAdminUser, 
  updateAdminUser, 
  removeAdminUser, 
  checkIsAdmin 
} from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Authorize Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('admin');
  const [editEmail, setEditEmail] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Revoke Modal State
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokingAdmin, setRevokingAdmin] = useState(null);
  const [submittingRevoke, setSubmittingRevoke] = useState(false);
  const [revokeError, setRevokeError] = useState('');

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const authStatus = await checkIsAdmin(user.id, user.email);
        setCurrentAdmin({
          id: user.id,
          email: user.email,
          role: authStatus.role || 'admin',
          isSuperAdmin: authStatus.isSuperAdmin
        });
      }
      const list = await fetchAdminUsers();
      setAdmins(list);
    } catch (err) {
      console.warn('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ADD ADMIN HANDLER ---
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddError('');

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAddError('Please enter a valid email address.');
      return;
    }

    setSubmittingAdd(true);
    try {
      const created = await addAdminUser({ 
        email: cleanEmail, 
        role: newRole,
        fullName: newFullName.trim()
      });
      
      const isPending = !created.user_id;
      if (isPending) {
        success(`Admin access authorized for "${cleanEmail}". It will activate upon their first sign-in.`);
      } else {
        success(`Administrator "${cleanEmail}" is now active!`);
      }

      setNewEmail('');
      setNewFullName('');
      setNewRole('admin');
      setIsAddModalOpen(false);
      await loadData();
    } catch (err) {
      setAddError(err.message || 'Failed to authorize administrator.');
      toastError(err.message || 'Failed to authorize administrator.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // --- OPEN EDIT MODAL ---
  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditFullName(admin.full_name || '');
    setEditRole(admin.role || 'admin');
    setEditEmail(admin.email || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  // --- SAVE EDIT HANDLER ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setEditError('');

    setSubmittingEdit(true);
    try {
      await updateAdminUser({
        id: editingAdmin.id,
        role: editRole,
        fullName: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        currentAdminEmail: currentAdmin?.email
      });

      success(`Administrator "${editingAdmin.email}" updated successfully.`);
      setIsEditModalOpen(false);
      setEditingAdmin(null);
      await loadData();
    } catch (err) {
      setEditError(err.message || 'Failed to update administrator.');
      toastError(err.message || 'Failed to update administrator.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // --- OPEN REVOKE MODAL ---
  const openRevokeModal = (admin) => {
    setRevokingAdmin(admin);
    setRevokeError('');
    setIsRevokeModalOpen(true);
  };

  // --- EXECUTE REVOKE HANDLER ---
  const handleConfirmRevoke = async () => {
    if (!revokingAdmin) return;
    setRevokeError('');

    setSubmittingRevoke(true);
    try {
      await removeAdminUser(revokingAdmin.id, currentAdmin?.email);
      success(`Admin privileges for "${revokingAdmin.email}" have been revoked.`);
      setIsRevokeModalOpen(false);
      setRevokingAdmin(null);
      await loadData();
    } catch (err) {
      setRevokeError(err.message || 'Failed to revoke administrator.');
      toastError(err.message || 'Failed to revoke administrator.');
    } finally {
      setSubmittingRevoke(false);
    }
  };

  // Filtered List
  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.full_name && a.full_name.toLowerCase().includes(q)) ||
      (a.role && a.role.toLowerCase().includes(q))
    );
  });

  const superAdminCount = admins.filter((a) => a.role === 'superadmin' || a.role === 'super_admin').length;
  const pendingCount = admins.filter((a) => !a.user_id).length;
  const isCallerSuperAdmin = currentAdmin?.isSuperAdmin || currentAdmin?.role === 'superadmin';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <span>Admin</span> <span className="text-apex-red">Team & Access</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage authorized administrators, role permissions, and access privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentAdmin && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Signed in as: <strong className="text-white font-mono">{currentAdmin.email}</strong></span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isCallerSuperAdmin 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-apex-red/20 text-apex-red border border-apex-red/30'
              }`}>
                {isCallerSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => {
              setAddError('');
              setIsAddModalOpen(true);
            }}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Authorize New Admin</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-gray-400">Total Admins</span>
            <Users className="w-4 h-4 text-apex-red" />
          </div>
          <p className="text-2xl font-black text-white">{admins.length}</p>
        </div>

        <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-gray-400">Super Admins</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{superAdminCount}</p>
        </div>

        <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-gray-400">Standard Admins</span>
            <Shield className="w-4 h-4 text-apex-red" />
          </div>
          <p className="text-2xl font-black text-white">{admins.length - superAdminCount}</p>
        </div>

        <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-gray-400">Pending Invites</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
        </div>
      </div>

      {/* Search & Notice Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a0a0a] border border-white/5 rounded-2xl p-3 sm:p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search admins by name, email, or role..."
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:border-apex-red outline-none transition-colors"
          />
        </div>
        <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 self-start sm:self-center">
          <KeyRound size={13} className="text-apex-red shrink-0" />
          <span>Source of Truth: <code className="text-white bg-white/5 px-1 py-0.5 rounded">public.admin_users</code></span>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-apex-red" />
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
              Authorized Administrators ({filteredAdmins.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-apex-red animate-spin mx-auto mb-4" />
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400">Loading Authorized Team...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-16 text-center text-gray-500 text-sm">
            {searchQuery ? `No administrators matched "${searchQuery}".` : 'No administrators found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-gray-300">
              <thead className="bg-[#121212] text-[11px] font-mono uppercase tracking-wider text-gray-400 border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Administrator</th>
                  <th className="py-3.5 px-4 sm:px-6">Email</th>
                  <th className="py-3.5 px-4 sm:px-6">Role</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Authorized Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAdmins.map((admin) => {
                  const isCurrent = admin.email?.toLowerCase() === currentAdmin?.email?.toLowerCase();
                  const isSuperAdmin = admin.role === 'superadmin' || admin.role === 'super_admin';
                  const isActive = Boolean(admin.user_id);

                  return (
                    <tr key={admin.id || admin.email} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name / Avatar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            isSuperAdmin 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                              : 'bg-white/5 border-white/10 text-gray-300'
                          }`}>
                            {admin.full_name ? admin.full_name.charAt(0).toUpperCase() : admin.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {admin.full_name || 'Admin'}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                                <Check size={10} /> Current Session
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 sm:px-6 font-mono text-xs text-gray-300">
                        {admin.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          isSuperAdmin
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                            : 'bg-apex-red/10 text-apex-red border border-apex-red/20'
                        }`}>
                          {isSuperAdmin ? <Crown size={12} /> : <Shield size={12} />}
                          <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 sm:px-6">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : (
                          <span 
                            title="Pre-authorized email: will activate on first sign-in"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help"
                          >
                            <Clock size={11} /> Pending
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-gray-400 font-mono">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'Initial'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => openEditModal(admin)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Role & Details"
                          >
                            <Edit3 size={15} />
                          </motion.button>

                          {/* Revoke Button */}
                          {(!isCurrent || superAdminCount > 1) && (
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => openRevokeModal(admin)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Revoke Admin Access"
                            >
                              <Trash2 size={15} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. AUTHORIZE NEW ADMIN MODAL */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-apex-red/10 border border-apex-red/20 text-apex-red flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Authorize New Admin</h3>
                    <p className="text-xs text-gray-400">Grant admin portal permissions by email</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {addError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Administrator Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="newadmin@gmail.com"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Full Name / Alias (Optional)
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Role Privilege
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors cursor-pointer"
                  >
                    <option value="admin">Administrator (Products, Orders, Reviews, CMS)</option>
                    <option value="superadmin">Superadmin (Full Team Management & System Control)</option>
                  </select>
                </div>

                {/* Pending Invite Notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
                  <strong>Pending Invites Supported:</strong> If this user does not have a Supabase account yet, their status will show as <strong>PENDING</strong> and activate automatically when they sign in.
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submittingAdd}
                    className="flex-1 btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer disabled:opacity-50"
                  >
                    {submittingAdd ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Authorize Admin</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* 2. EDIT ADMIN MODAL */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isEditModalOpen && editingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Edit Administrator</h3>
                    <p className="text-xs text-gray-400">{editingAdmin.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Role Privilege
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors cursor-pointer"
                  >
                    <option value="admin">Administrator (Products, Orders, CMS)</option>
                    <option value="superadmin">Superadmin (Full Privileges)</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submittingEdit}
                    className="flex-1 btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer disabled:opacity-50"
                  >
                    {submittingEdit ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* 3. REVOKE CONFIRMATION MODAL */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isRevokeModalOpen && revokingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-red-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Revoke Admin Access?</h3>
                  <p className="text-xs text-gray-400">This action will remove admin permissions.</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 mb-4 text-xs text-gray-300">
                <p>
                  <strong>Target Admin:</strong> <span className="font-mono text-white">{revokingAdmin.email}</span>
                </p>
                <p>
                  <strong>Role:</strong> <span className="uppercase text-amber-400 font-bold">{revokingAdmin.role}</span>
                </p>
                <p className="text-gray-400 text-[11px] pt-1">
                  Note: The user's Supabase customer account and customer orders will <strong>NOT</strong> be deleted. Only portal access will be revoked.
                </p>
              </div>

              {revokeError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{revokeError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRevokeModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmRevoke}
                  disabled={submittingRevoke}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer disabled:opacity-50"
                >
                  {submittingRevoke ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Revoke Access</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
