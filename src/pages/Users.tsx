import React, { useState, useEffect } from 'react';
import { useAuth, useToast, toJalaliFull } from '../lib/auth';
import { db, type User, getAllPermissions, getRolePermissions, getRolePages, getAllPages, hashPassword } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, X, UserCog, Shield, Eye, EyeOff } from 'lucide-react';

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
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">مدیریت کاربران</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowSessions(!showSessions)} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm flex items-center gap-1">
            <Eye size={14} /> Sessionها ({sessions.length})
          </button>
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus size={16} /> کاربر جدید
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      {showSessions && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-sm mb-3">Sessionهای فعال</h3>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs">
                <div>
                  <p className="font-medium">{s.username} ({s.role})</p>
                  <p className="text-slate-500">ورود: {toJalaliFull(s.loginTime)}</p>
                </div>
                <button onClick={() => { db.endSession(s.id); showToast('success', 'Session خاتمه یافت'); }}
                  className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs">خروج اجباری</button>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm text-slate-500 text-center py-2">Session فعالی وجود ندارد</p>}
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{u.fullName}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {u.active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">@{u.username} | {roleLabels[u.role]}</p>
                {u.lastLogin && <p className="text-xs text-slate-400">آخرین ورود: {toJalaliFull(u.lastLogin)}</p>}
                <p className="text-xs text-slate-400">{u.permissions.length} دسترسی | {u.visiblePages.length} صفحه</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={14} /></button>
                {u.id !== currentUser?.id && (
                  <button onClick={() => toggleActive(u)} className={`p-1.5 rounded ${u.active ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'}`}>
                    {u.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="font-bold">{editUser ? 'ویرایش کاربر' : 'کاربر جدید'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">نام کاربری *</label>
                  <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">{editUser ? 'رمز جدید (خالی = بدون تغییر)' : 'رمز عبور *'}</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">نام کامل</label>
                  <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">نقش</label>
                  <select value={form.role} onChange={e => {
                    const role = e.target.value as User['role'];
                    setForm({ ...form, role, permissions: getRolePermissions(role), visiblePages: getRolePages(role) });
                  }}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                    <option value="admin">مدیر کل</option>
                    <option value="manager">مدیر فروشگاه</option>
                    <option value="seller">فروشنده</option>
                    <option value="technician">تعمیرکار</option>
                    <option value="warehouse">انباردار</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500">حداکثر تخفیف (%)</label>
                <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>

              {/* Permissions */}
              <div>
                <label className="text-xs text-slate-500 flex items-center gap-1"><Shield size={12} /> دسترسی‌ها</label>
                <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-2 space-y-1">
                  {getAllPermissions().map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={form.permissions.includes(perm)}
                        onChange={e => {
                          const perms = e.target.checked ? [...form.permissions, perm] : form.permissions.filter(p => p !== perm);
                          setForm({ ...form, permissions: perms });
                        }} className="rounded" />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>

              {/* Visible Pages */}
              <div>
                <label className="text-xs text-slate-500">صفحات قابل مشاهده</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getAllPages().map(page => (
                    <label key={page} className="flex items-center gap-1 text-xs bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded">
                      <input type="checkbox" checked={form.visiblePages.includes(page)}
                        onChange={e => {
                          const pages = e.target.checked ? [...form.visiblePages, page] : form.visiblePages.filter(p => p !== page);
                          setForm({ ...form, visiblePages: pages });
                        }} className="rounded" />
                      {page}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" />
                فعال
              </label>

              <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                {editUser ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
