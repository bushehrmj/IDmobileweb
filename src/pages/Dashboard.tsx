import React from 'react';
import { useAuth } from '../lib/auth';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, Wrench, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'فروش امروز',
      value: '۱۲,۵۰۰,۰۰۰',
      unit: 'تومان',
      change: '+۱۲٪',
      trend: 'up',
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30'
    },
    {
      title: 'سود خالص',
      value: '۳,۲۰۰,۰۰۰',
      unit: 'تومان',
      change: '+۸٪',
      trend: 'up',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/30'
    },
    {
      title: 'مشتریان فعال',
      value: '۲۴۸',
      unit: 'نفر',
      change: '+۵',
      trend: 'up',
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/30'
    },
    {
      title: 'تعمیرات در انتظار',
      value: '۱۲',
      unit: 'دستگاه',
      change: '-۳',
      trend: 'down',
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/30'
    },
  ];

  const recentActivities = [
    { type: 'sale', title: 'فروش جدید', description: 'iPhone 13 Pro', time: '۵ دقیقه پیش', icon: ShoppingCart, color: 'blue' },
    { type: 'repair', title: 'تعمیر تکمیل شد', description: 'Samsung S21', time: '۱۵ دقیقه پیش', icon: Wrench, color: 'green' },
    { type: 'customer', title: 'مشتری جدید', description: 'علی رضایی', time: '۳۰ دقیقه پیش', icon: Users, color: 'purple' },
    { type: 'stock', title: 'موجودی کم', description: 'گلس iPhone 12', time: '۱ ساعت پیش', icon: AlertTriangle, color: 'amber' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="card-gradient p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              خوش آمدید، {user?.fullName} 👋
            </h1>
            <p className="text-white/80">
              امروز روز خوبی برای فروش است!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center animate-float">
              <TrendingUp size={48} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="card-modern p-6 animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <stat.icon size={28} className="text-white" />
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                stat.trend === 'up' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                <span className="text-sm text-slate-500">{stat.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 card-modern p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">فعالیت‌های اخیر</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              مشاهده همه
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 animate-slideInRight"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br from-${activity.color}-500 to-${activity.color}-600 rounded-xl flex items-center justify-center shadow-lg`}>
                  <activity.icon size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{activity.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{activity.description}</p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-modern p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">دسترسی سریع</h2>
          <div className="space-y-3">
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <ShoppingCart size={20} />
              <span>فروش جدید</span>
            </button>
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <Wrench size={20} />
              <span>پذیرش تعمیر</span>
            </button>
            <button className="btn-success w-full flex items-center justify-center gap-2">
              <Users size={20} />
              <span>مشتری جدید</span>
            </button>
            <button className="btn-outline w-full flex items-center justify-center gap-2">
              <Package size={20} />
              <span>افزودن محصول</span>
            </button>
          </div>

          {/* Alert */}
          <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-1">هشدار موجودی</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ۳ محصول موجودی کم دارند
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">عملکرد هفتگی</h2>
          <select className="input-modern w-auto">
            <option>این هفته</option>
            <option>ماه گذشته</option>
            <option>۳ ماه گذشته</option>
          </select>
        </div>
        <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <BarChart3 size={48} className="text-blue-500 mx-auto mb-3 animate-float" />
            <p className="text-slate-600 dark:text-slate-400">نمودار عملکرد</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart3({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}
