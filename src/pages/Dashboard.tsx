import React from 'react';
import { useAuth } from '../lib/auth';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, Wrench, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Zap, Target, Award
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
      gradient: 'card-gradient-teal',
      iconBg: 'bg-white/20'
    },
    {
      title: 'سود خالص',
      value: '۳,۲۰۰,۰۰۰',
      unit: 'تومان',
      change: '+۸٪',
      trend: 'up',
      icon: TrendingUp,
      gradient: 'card-gradient-purple',
      iconBg: 'bg-white/20'
    },
    {
      title: 'مشتریان فعال',
      value: '۲۴۸',
      unit: 'نفر',
      change: '+۵',
      trend: 'up',
      icon: Users,
      gradient: 'card-gradient-orange',
      iconBg: 'bg-white/20'
    },
    {
      title: 'تعمیرات در انتظار',
      value: '۱۲',
      unit: 'دستگاه',
      change: '-۳',
      trend: 'down',
      icon: Wrench,
      gradient: 'card-gradient-pink',
      iconBg: 'bg-white/20'
    },
  ];

  const recentActivities = [
    { type: 'sale', title: 'فروش جدید', description: 'iPhone 13 Pro', time: '۵ دقیقه پیش', icon: ShoppingCart, color: 'teal' },
    { type: 'repair', title: 'تعمیر تکمیل شد', description: 'Samsung S21', time: '۱۵ دقیقه پیش', icon: Wrench, color: 'purple' },
    { type: 'customer', title: 'مشتری جدید', description: 'علی رضایی', time: '۳۰ دقیقه پیش', icon: Users, color: 'orange' },
    { type: 'stock', title: 'موجودی کم', description: 'گلس iPhone 12', time: '۱ ساعت پیش', icon: AlertTriangle, color: 'pink' },
  ];

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Welcome Section */}
      <div className="card-gradient-teal p-10 text-white rounded-[32px] shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-3">
              خوش آمدید، {user?.fullName} 👋
            </h1>
            <p className="text-xl text-white/90 font-medium">
              امروز روز خوبی برای فروش است!
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                <Target size={20} />
                <span className="font-bold">هدف امروز: ۱۵,۰۰۰,۰۰۰ تومان</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                <Award size={20} />
                <span className="font-bold">پیشرفت: ۸۳٪</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-[32px] flex items-center justify-center animate-float shadow-2xl">
              <TrendingUp size={64} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.gradient} p-7 rounded-[28px] shadow-2xl animate-fadeInUp`}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className={`w-16 h-16 ${stat.iconBg} backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl`}>
                <stat.icon size={32} />
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black ${
                stat.trend === 'up' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/20 text-white'
              } backdrop-blur-sm`}>
                {stat.trend === 'up' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-base text-white/80 mb-2 font-medium">{stat.title}</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-black">{stat.value}</h3>
                <span className="text-base text-white/70 font-medium">{stat.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 card p-8 rounded-[28px] shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Zap size={28} className="text-teal-500" />
              فعالیت‌های اخیر
            </h2>
            <button className="btn-outline text-sm">
              مشاهده همه
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center gap-5 p-5 bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl hover:from-teal-100 hover:to-cyan-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-400 animate-slideInRight shadow-md hover:shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br from-${activity.color}-500 to-${activity.color}-600 rounded-2xl flex items-center justify-center shadow-xl`}>
                  <activity.icon size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">{activity.title}</h3>
                  <p className="text-base text-slate-600 dark:text-slate-400 font-medium">{activity.description}</p>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-8 rounded-[28px] shadow-2xl">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <Zap size={28} className="text-purple-500" />
            دسترسی سریع
          </h2>
          <div className="space-y-4">
            <button className="btn-primary w-full text-base">
              <ShoppingCart size={22} />
              <span>فروش جدید</span>
            </button>
            <button className="btn-success w-full text-base">
              <Wrench size={22} />
              <span>پذیرش تعمیر</span>
            </button>
            <button className="btn-warning w-full text-base">
              <Users size={22} />
              <span>مشتری جدید</span>
            </button>
            <button className="btn-outline w-full text-base">
              <Package size={22} />
              <span>افزودن محصول</span>
            </button>
          </div>

          {/* Alert */}
          <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg text-amber-900 dark:text-amber-300 mb-2">هشدار موجودی</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  ۳ محصول موجودی کم دارند
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card p-8 rounded-[28px] shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <TrendingUp size={28} className="text-emerald-500" />
            عملکرد هفتگی
          </h2>
          <select className="input w-auto">
            <option>این هفته</option>
            <option>ماه گذشته</option>
            <option>۳ ماه گذشته</option>
          </select>
        </div>
        <div className="h-80 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center shadow-inner">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-float shadow-2xl">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">نمودار عملکرد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
