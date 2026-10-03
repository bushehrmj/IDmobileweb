import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db, hashPassword, verifyPassword, User, Session, type Settings, getRolePermissions, getRolePages, getAllPages } from './db';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  hasPermission: (permission: string) => boolean;
  canViewPage: (page: string) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    mustChangePassword: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setupTimeout = useCallback((sessionTimeout: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAuthState(prev => {
        if (prev.session) {
          db.endSession(prev.session.id);
        }
        return { user: null, session: null, isAuthenticated: false, mustChangePassword: false };
      });
    }, sessionTimeout * 60 * 1000);
  }, []);

  const resetTimeout = useCallback(() => {
    if (authState.session) {
      const settings = db.getSettings();
      setupTimeout(settings.sessionTimeout);
      const session = { ...authState.session, lastActivity: new Date().toISOString() };
      db.saveSession(session);
      setAuthState(prev => ({ ...prev, session }));
    }
  }, [authState.session, setupTimeout]);

  useEffect(() => {
    const savedSessionId = sessionStorage.getItem('idmobile_session');
    if (savedSessionId) {
      const sessions = db.getActiveSessions();
      const session = sessions.find(s => s.id === savedSessionId);
      if (session) {
        const user = db.getUser(session.userId);
        if (user && user.active) {
          const settings = db.getSettings();
          setupTimeout(settings.sessionTimeout);
          setAuthState({
            user,
            session,
            isAuthenticated: true,
            mustChangePassword: user.username === 'admin' && verifyPassword('ChangeMe123!', user.passwordHash),
          });
        }
      }
    }

    const handleActivity = () => resetTimeout();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Auto-refresh user data on mount to get latest permissions
  useEffect(() => {
    if (authState.user) {
      const freshUser = db.getUser(authState.user.id);
      if (freshUser && freshUser.active) {
        setAuthState(prev => ({ ...prev, user: freshUser }));
      }
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // Try Backend API first
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store token
        sessionStorage.setItem('idmobile_token', data.token);
        
        const session: Session = {
          id: uuidv4(),
          userId: data.user.id,
          username: data.user.username,
          role: data.user.role,
          loginTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          device: navigator.userAgent,
          ip: '127.0.0.1',
          active: true,
        };
        
        sessionStorage.setItem('idmobile_session', session.id);
        
        const settings = db.getSettings();
        setupTimeout(settings.sessionTimeout);
        
        const mustChange = data.user.username === 'admin' && password === 'admin123';
        
        setAuthState({
          user: {
            id: data.user.id,
            username: data.user.username,
            passwordHash: '', // Not needed when using backend
            fullName: data.user.fullName,
            role: data.user.role,
            permissions: data.user.permissions,
            visiblePages: data.user.visiblePages,
            active: true,
            createdAt: new Date().toISOString(),
          },
          session,
          isAuthenticated: true,
          mustChangePassword: mustChange,
        });
        
        return { success: true, message: 'ورود موفق' };
      }
    } catch (error) {
      // Backend not available, fallback to localStorage
      console.log('Backend not available, using localStorage fallback');
    }

    // Fallback to localStorage authentication
    // Check lock
    const attempt = db.getLoginAttempt(username);
    if (attempt && attempt.locked) {
      if (attempt.lockUntil && new Date(attempt.lockUntil) > new Date()) {
        return { success: false, message: 'حساب موقتاً قفل شده است. لطفاً بعداً تلاش کنید.' };
      }
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      recordFailedAttempt(username);
      return { success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    if (!user.active) {
      return { success: false, message: 'این حساب غیرفعال شده است.' };
    }

    if (!verifyPassword(password, user.passwordHash)) {
      recordFailedAttempt(username);
      const attempts = db.getLoginAttempt(username);
      if (attempts && attempts.attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.saveLoginAttempt({ ...attempts, locked: true, lockUntil });
        return { success: false, message: 'تعداد تلاش‌ها بیش از حد مجاز. حساب ۱۵ دقیقه قفل شد.' };
      }
      return { success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    // Success
    db.saveLoginAttempt({ username, attempts: 0, lastAttempt: new Date().toISOString(), locked: false });

    const session: Session = {
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      role: user.role,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      device: navigator.userAgent,
      ip: '127.0.0.1',
      active: true,
    };
    db.saveSession(session);
    sessionStorage.setItem('idmobile_session', session.id);

    // Update user permissions based on role (migration)
    user.permissions = getRolePermissions(user.role);
    user.visiblePages = getRolePages(user.role);
    user.lastLogin = new Date().toISOString();
    db.saveUser(user);

    const settings = db.getSettings();
    setupTimeout(settings.sessionTimeout);

    const mustChange = user.username === 'admin' && verifyPassword('ChangeMe123!', user.passwordHash);

    setAuthState({ user, session, isAuthenticated: true, mustChangePassword: mustChange });

    db.addAuditLog({
      id: uuidv4(), userId: user.id, userName: user.fullName,
      action: 'login', entity: 'auth', entityId: user.id,
      ip: '127.0.0.1', date: new Date().toISOString(),
    });

    return { success: true, message: 'ورود موفق' };
  }, [setupTimeout]);

  const recordFailedAttempt = (username: string) => {
    const attempt = db.getLoginAttempt(username);
    const newAttempt: typeof attempt extends undefined ? never : NonNullable<typeof attempt> = {
      username,
      attempts: (attempt?.attempts || 0) + 1,
      lastAttempt: new Date().toISOString(),
      locked: false,
    };
    db.saveLoginAttempt(newAttempt);
  };

  const logout = useCallback(() => {
    if (authState.session) {
      db.endSession(authState.session.id);
      db.addAuditLog({
        id: uuidv4(), userId: authState.user?.id || '', userName: authState.user?.fullName || '',
        action: 'logout', entity: 'auth', entityId: authState.user?.id || '',
        ip: '127.0.0.1', date: new Date().toISOString(),
      });
    }
    sessionStorage.removeItem('idmobile_session');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAuthState({ user: null, session: null, isAuthenticated: false, mustChangePassword: false });
  }, [authState.session, authState.user]);

  const changePassword = useCallback((oldPass: string, newPass: string) => {
    if (!authState.user) return { success: false, message: 'کاربر یافت نشد' };
    if (!verifyPassword(oldPass, authState.user.passwordHash)) {
      return { success: false, message: 'رمز فعلی اشتباه است' };
    }
    if (newPass.length < 6) return { success: false, message: 'رمز جدید حداقل ۶ کاراکتر باشد' };
    const user = { ...authState.user, passwordHash: hashPassword(newPass) };
    db.saveUser(user);
    setAuthState(prev => ({ ...prev, user, mustChangePassword: false }));
    return { success: true, message: 'رمز با موفقیت تغییر کرد' };
  }, [authState.user]);

  const hasPermission = useCallback((permission: string) => {
    if (!authState.user) return false;
    return authState.user.permissions.includes(permission);
  }, [authState.user]);

  const canViewPage = useCallback((page: string) => {
    if (!authState.user) return false;
    return authState.user.visiblePages.includes(page);
  }, [authState.user]);

  const refreshUser = useCallback(() => {
    if (authState.user) {
      const user = db.getUser(authState.user.id);
      if (user) {
        // Ensure user has all latest pages
        const allPages = getAllPages();
        const missingPages = allPages.filter(p => !user.visiblePages.includes(p));
        if (missingPages.length > 0) {
          user.visiblePages = allPages;
          db.saveUser(user);
        }
        setAuthState(prev => ({ ...prev, user }));
      }
    }
  }, [authState.user]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, changePassword, hasPermission, canViewPage, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Toast context
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`animate-slide-in px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 cursor-pointer ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' :
            t.type === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
          }`} onClick={() => removeToast(t.id)}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span className="text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Format helpers
export function formatNumber(n: number): string {
  return n.toLocaleString('fa-IR');
}

export function formatCurrency(n: number, currency = 'تومان'): string {
  return `${n.toLocaleString('fa-IR')} ${currency}`;
}

export function toJalali(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return d.toLocaleDateString('fa-IR');
  }
}

export function toJalaliFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    return d.toLocaleString('fa-IR');
  }
}

export function getTimeStr(): string {
  return new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}
