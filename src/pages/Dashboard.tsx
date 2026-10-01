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
      color: 'bg-blue-500'
    },
    {
      title: 'سود خالص',
      value: '۳,۲۰۰,۰۰۰',
      unit: 'تومان',
      change: '+۸٪',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'مشتریان فعال',
      value: '۲۴۸',
      unit: 'نفر',
      change: '+۵',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'تعمیرات در انتظار',
      value: '۱۲',
      unit: 'دستگاه',
      change: '-۳',
      trend: 'down',
      icon: Wrench,
      color: 'bg-amber-500'
    },
  ];

  const recentActivities = [
    { type: 'sale', title: 'فروش جدید', description: 'iPhone 13 Pro', time: '۵ دقیقه پیش', icon: ShoppingCart, color: 'bg-blue-500' },
    { type: 'repair', title: 'تعمیر تکمیل شد', description: 'Samsung S21', time: '۱۵ دقیقه پیش', icon: Wrench, color: 'bg-green-500' },
    { type: 'customer', title: 'مشتری جدید', description: 'علی رضایی', time: '۳۰ دقیقه پیش', icon: Users, color: 'bg-purple-500' },
    { type: 'stock', title: 'موجودی کم', description: 'گلس iPhone 12', time: '۱ ساعت پیش', icon: AlertTriangle, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="card p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h1 className="text-2xl font-bold mb-2">
          خوش آمدید، {user?.fullName} 👋
        </h1>
        <p className="text-white/90">
          امروز روز خوبی برای فروش است!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                stat.trend === 'up' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                <span className="text-xs text-slate-500">{stat.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            فعالیت‌های اخیر
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center`}>
                  <activity.icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{activity.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{activity.description}</p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            دسترسی سریع
          </h2>
          <div className="space-y-3">
            <button className="btn btn-primary w-full">
              <ShoppingCart size={18} />
              <span>فروش جدید</span>
            </button>
            <button className="btn btn-success w-full">
              <Wrench size={18} />
              <span>پذیرش تعمیر</span>
            </button>
            <button className="btn btn-secondary w-full">
              <Users size={18} />
              <span>مشتری جدید</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
