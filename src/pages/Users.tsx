import React, { useState, useEffect } from 'react';
import { useAuth, useToast, toJalaliFull } from '../lib/auth';
import { db, type User, getAllPermissions, getRolePermissions, getRolePages, getAllPages, hashPassword } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, Edit, X, UserCog, Shield, Eye, EyeOff, Users as UsersIcon,
  CheckCircle, XCircle
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [form, setForm] = useState({
    username: '', password: '', fullName: '', role: 'seller' as User['role'],
    permissions: [] as string[], visiblePages: [] as string[], active: true, maxDiscount: 5,
  });

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = () => setUsers(db.getUsers());

  const openNew = () => {
    setEditUser(null);
    const role = 'seller' as User['role'];
    setForm({ username: '', password: '', fullName: '', role, permissions: getRolePermissions(role), visiblePages: getRolePages(role), active: true, maxDiscount: 5 });
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, role: u.role, permissions: [...u.permissions], visiblePages: [...u.visiblePages], active: u.active, maxDiscount: u.maxDiscount || 5 });
    setShowForm(true);
  };

  const save = () => {
    if (!form.username.trim()) { showToast('error', 'نام کاربری الزامی است'); return; }
    if (!editUser && !form.password) { showToast('error', 'رمز عبور الزامی است'); return; }

    const now = new Date().toISOString();
    const userObj: User = {
      id: editUser?.id || uuidv4(),
      username: form.username,
      passwordHash: form.password ? hashPassword(form.password) : (editUser?.passwordHash || ''),
      fullName: form.fullName,
      role: form.role,
      permissions: form.permissions,
      visiblePages: form.visiblePages,
      active: form.active,
      maxDiscount: form.maxDiscount,
      createdAt: editUser?.createdAt || now,
      lastLogin: editUser?.lastLogin,
    };

    db.saveUser(userObj);
    db.addAuditLog({
      id: uuidv4(), userId: currentUser?.id || '', userName: currentUser?.fullName || '',
      action: editUser ? 'edit_user' : 'create_user', entity: 'user', entityId: userObj.id,
      newValue: userObj.username, ip: '127.0.0.1', date: now,
    });

    showToast('success', editUser ? 'کاربر ویرایش شد' : 'کاربر ایجاد شد');
    setShowForm(false);
    loadUsers();
  };

  const toggleActive = (u: User) => {
    if (u.id === currentUser?.id) { showToast('error', 'نمی‌توانید خود را غیرفعال کنید'); return; }
    if (!confirm(`${u.active ? 'غیرفعال' : 'فعال'} کردن ${u.fullName}؟`)) return;
    db.saveUser({ ...u, active: !u.active });
    showToast('success', `کاربر ${u.active ? 'غیرفعال' : 'فعال'} شد`);
    loadUsers();
  };

  const roleLabels: Record<string, string> = {
    admin: 'مدیر کل', manager: 'مدیر فروشگاه', seller: 'فروشنده', technician: 'تعمیرکار', warehouse: 'انباردار',
  };

  const sessions = db.getActiveSessions();

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">مدیریت کاربران</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت کاربران و دسترسی‌ها</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSessions(!showSessions)}>
            <Eye size={18} />
            Sessionها ({sessions.length})
          </Button>
          <Button variant="primary" onClick={openNew}>
            <Plus size={18} />
            کاربر جدید
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <UsersIcon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل کاربران</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">فعال</p>
              <p className="text-xl font-bold text-green-600">{users.filter(u => u.active).length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <XCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">غیرفعال</p>
              <p className="text-xl font-bold text-red-600">{users.filter(u => !u.active).length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Session فعال</p>
              <p className="text-xl font-bold text-purple-600">{sessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      {showSessions && (
        <div className="card p-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Sessionهای فعال</h3>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{s.username} ({s.role})</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ورود: {toJalaliFull(s.loginTime)}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => { db.endSession(s.id); showToast('success', 'Session خاتمه یافت'); }}>
                  خروج اجباری
                </Button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Session فعالی وجود ندارد</p>
            )}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-bold text-lg text-slate-900 dark:text-white">{u.fullName}</p>
                  <span className={`badge ${u.active ? 'badge-success' : 'badge-error'}`}>
                    {u.active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  @{u.username} | {roleLabels[u.role]}
                </p>
                {u.lastLogin && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    آخرین ورود: {toJalaliFull(u.lastLogin)}
                  </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {u.permissions.length} دسترسی | {u.visiblePages.length} صفحه
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                  <Edit size={16} className="text-blue-500" />
                </Button>
                {u.id !== currentUser?.id && (
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(u)}>
                    {u.active ? <EyeOff size={16} className="text-red-500" /> : <Eye size={16} className="text-green-500" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editUser ? 'ویرایش کاربر' : 'کاربر جدید'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="نام کاربری *"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
                <Input
                  label={editUser ? 'رمز جدید (خالی = بدون تغییر)' : 'رمز عبور *'}
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <Input
                  label="نام کامل"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                />
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نقش</label>
                  <select 
                    value={form.role} 
                    onChange={e => {
                      const role = e.target.value as User['role'];
                      setForm({ ...form, role, permissions: getRolePermissions(role), visiblePages: getRolePages(role) });
                    }}
                    className="input"
                  >
                    <option value="admin">مدیر کل</option>
                    <option value="manager">مدیر فروشگاه</option>
                    <option value="seller">فروشنده</option>
                    <option value="technician">تعمیرکار</option>
                    <option value="warehouse">انباردار</option>
                  </select>
                </div>
              </div>

              <Input
                label="حداکثر تخفیف (%)"
                type="number"
                value={form.maxDiscount}
                onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
              />

              {/* Permissions */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
                  <Shield size={16} />
                  دسترسی‌ها
                </label>
                <div className="max-h-48 overflow-y-auto border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 space-y-2">
                  {getAllPermissions().map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg">
                      <input 
                        type="checkbox" 
                        checked={form.permissions.includes(perm)}
                        onChange={e => {
                          const perms = e.target.checked ? [...form.permissions, perm] : form.permissions.filter(p => p !== perm);
                          setForm({ ...form, permissions: perms });
                        }} 
                        className="w-4 h-4 rounded" 
                      />
                      <span className="text-xs font-mono">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Visible Pages */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">صفحات قابل مشاهده</label>
                <div className="flex flex-wrap gap-2">
                  {getAllPages().map(page => (
                    <label key={page} className="flex items-center gap-1 text-xs bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
                      <input 
                        type="checkbox" 
                        checked={form.visiblePages.includes(page)}
                        onChange={e => {
                          const pages = e.target.checked ? [...form.visiblePages, page] : form.visiblePages.filter(p => p !== page);
                          setForm({ ...form, visiblePages: pages });
                        }} 
                        className="w-4 h-4 rounded" 
                      />
                      <span>{page}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.active} 
                  onChange={e => setForm({ ...form, active: e.target.checked })} 
                  className="w-5 h-5 rounded" 
                />
                <span className="text-sm font-medium">فعال</span>
              </label>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={save}>
                  {editUser ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
