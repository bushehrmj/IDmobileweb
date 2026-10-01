import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Eye, EyeOff, Lock, User, Smartphone, Shield } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('خطا در ورود به سیستم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background - Teal/Emerald Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-600">
        {/* Floating Circles */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-scaleIn">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[32px] shadow-2xl p-10 border-4 border-white/30">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 rounded-[32px] shadow-2xl mb-6 animate-float animate-glow">
              <span className="text-5xl font-black text-white">ID</span>
            </div>
            <h1 className="text-4xl font-black text-gradient mb-3">ID Mobile</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">سیستم مدیریت حرفه‌ای فروشگاه</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-3">
                نام کاربری
              </label>
              <div className="relative">
                <User className="absolute right-5 top-1/2 -translate-y-1/2 text-teal-500" size={24} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pr-14"
                  placeholder="نام کاربری خود را وارد کنید"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-3">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-teal-500" size={24} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-14 pl-14"
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-l from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 animate-scaleIn">
                <p className="text-base text-red-600 dark:text-red-400 font-bold">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>در حال ورود...</span>
                </>
              ) : (
                <>
                  <Shield size={24} />
                  <span>ورود به سیستم</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center gap-3 text-base text-slate-500 dark:text-slate-400">
              <Smartphone size={20} className="text-teal-500" />
              <span className="font-medium">نسخه 2.0.0 | سیستم مدیریت حرفه‌ای</span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 border-4 border-white/30 shadow-2xl animate-fadeInUp">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
              <Lock size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2">اطلاعات ورود اولیه</h3>
              <div className="space-y-1">
                <p className="text-base text-slate-600 dark:text-slate-400">
                  نام کاربری: <span className="font-mono font-black text-teal-600 dark:text-teal-400">admin</span>
                </p>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  رمز عبور: <span className="font-mono font-black text-teal-600 dark:text-teal-400">admin123</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
