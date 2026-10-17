import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md animate-scaleIn">
        <div className="card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
              ID
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ID Mobile
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              سیستم مدیریت فروشگاه موبایل
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="relative">
              <User className="absolute right-4 top-12 text-slate-400" size={20} />
              <Input
                label="نام کاربری"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری خود را وارد کنید"
                className="pr-12"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute right-4 top-12 text-slate-400" size={20} />
              <Input
                label="رمز عبور"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور خود را وارد کنید"
                className="pr-12 pl-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-fadeIn">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>در حال ورود...</span>
                </>
              ) : (
                <>
                  <Lock size={20} />
                  <span>ورود به سیستم</span>
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <p>نسخه 2.0.0 | سیستم مدیریت حرفه‌ای</p>
              <p className="mt-2">
                نام کاربری: <span className="font-mono font-bold">admin</span>
              </p>
              <p>
                رمز عبور: <span className="font-mono font-bold">admin123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
