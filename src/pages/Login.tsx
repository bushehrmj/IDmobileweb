import React, { useState } from 'react';
import { useAuth, useToast } from '../lib/auth';
import { db } from '../lib/db';
import { Eye, EyeOff, Lock, User, Wifi, Smartphone } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const settings = db.getSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('نام کاربری و رمز عبور الزامی است');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) {
        setError(result.message);
        showToast('error', result.message);
      } else {
        showToast('success', 'ورود موفق');
      }
      setLoading(false);
    }, 300);
  };

  const getLocalIP = () => {
    return window.location.origin || 'http://localhost:3000';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg mb-4">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">ID</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{settings.storeName}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ID Mobile Manager Pro</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نام کاربری</label>
              <div className="relative">
                <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="نام کاربری"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رمز عبور</label>
              <div className="relative">
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="رمز عبور"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  ورود به سیستم
                </>
              )}
            </button>
          </form>
        </div>

        {/* Server info */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
            <Wifi size={14} className="text-green-500" />
            <span>اتصال محلی فعال</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Smartphone size={12} />
            <span>آدرس شبکه: {getLocalIP()}</span>
          </div>
        </div>

        {/* Default credentials hint */}
        <div className="mt-4 text-center text-xs text-slate-400">
          <p>نسخه ۱.۰.۰ | سیستم مدیریت فروشگاه موبایل</p>
          <p className="mt-1">کاربر پیش‌فرض: admin | رمز: ChangeMe123!</p>
        </div>
      </div>
    </div>
  );
}
