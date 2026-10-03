import React, { useState } from 'react';
import { useAuth, useToast, toJalaliFull } from '../lib/auth';
import { db } from '../lib/db';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Lock, Mail, Phone, Calendar, Shield, Save } from 'lucide-react';

export default function Profile() {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPassChange, setShowPassChange] = useState(false);

  const handleChangePassword = () => {
    if (!oldPass || !newPass || !confirmPass) {
      showToast('error', 'لطفاً تمام فیلدها را پر کنید');
      return;
    }
    if (newPass !== confirmPass) {
      showToast('error', 'رمز جدید و تکرار آن یکسان نیستند');
      return;
    }
    if (newPass.length < 6) {
      showToast('error', 'رمز عبور باید حداقل 6 کاراکتر باشد');
      return;
    }

    const result = changePassword(oldPass, newPass);
    if (result.success) {
      showToast('success', result.message);
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setShowPassChange(false);
    } else {
      showToast('error', result.message);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'مدیر کل',
    manager: 'مدیر فروشگاه',
    seller: 'فروشنده',
    technician: 'تعمیرکار',
    warehouse: 'انباردار',
    accountant: 'حسابدار',
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">پروفایل کاربری</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت اطلاعات حساب کاربری</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.fullName}</h3>
            <p className="text-slate-500 dark:text-slate-400">@{user?.username}</p>
            <span className="badge badge-info mt-2">{roleLabels[user?.role || ''] || user?.role}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">نام کاربری</span>
            </div>
            <p className="font-medium text-slate-900 dark:text-white">{user?.username}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">نقش</span>
            </div>
            <p className="font-medium text-slate-900 dark:text-white">{roleLabels[user?.role || ''] || user?.role}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">آخرین ورود</span>
            </div>
            <p className="font-medium text-slate-900 dark:text-white">
              {user?.lastLogin ? toJalaliFull(user.lastLogin) : 'اولین ورود'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">دسترسی‌ها</span>
            </div>
            <p className="font-medium text-slate-900 dark:text-white">
              {user?.permissions?.length || 0} دسترسی فعال
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-blue-500" />
            تغییر رمز عبور
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPassChange(!showPassChange)}
          >
            {showPassChange ? 'انصراف' : 'تغییر رمز'}
          </Button>
        </div>

        {showPassChange && (
          <div className="space-y-4 animate-fadeIn">
            <Input
              label="رمز عبور فعلی"
              type="password"
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              placeholder="رمز عبور فعلی را وارد کنید"
            />
            <Input
              label="رمز عبور جدید"
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="رمز عبور جدید (حداقل 6 کاراکتر)"
            />
            <Input
              label="تکرار رمز عبور جدید"
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="رمز عبور جدید را دوباره وارد کنید"
            />
            <Button variant="primary" onClick={handleChangePassword}>
              <Save size={18} />
              ذخیره رمز جدید
            </Button>
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-purple-500" />
          دسترسی‌های شما
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {user?.permissions?.map((perm, index) => (
            <div 
              key={index}
              className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400"
            >
              {perm}
            </div>
          ))}
        </div>
      </div>

      {/* Pages */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-green-500" />
          صفحات قابل دسترسی
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {user?.visiblePages?.map((page, index) => (
            <div 
              key={index}
              className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {page}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
