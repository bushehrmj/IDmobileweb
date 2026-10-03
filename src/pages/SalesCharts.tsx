import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../lib/db';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Calendar, Filter } from 'lucide-react';

export default function SalesCharts() {
  const { hasPermission } = useAuth();
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = () => {
    const sales = db.getSales().filter(s => s.status === 'completed');
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredSales = sales.filter(s => new Date(s.date) >= startDate);

    // Sales by date
    const salesByDate: Record<string, { date: string; sales: number; profit: number }> = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('fa-IR');
      if (!salesByDate[date]) {
        salesByDate[date] = { date, sales: 0, profit: 0 };
      }
      salesByDate[date].sales += sale.total;
      salesByDate[date].profit += sale.items.reduce((sum, item) => {
        return sum + ((item.sellPrice - item.buyPrice) * item.quantity);
      }, 0);
    });

    setSalesData(Object.values(salesByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));

    // Sales by category
    const salesByCategory: Record<string, number> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = db.getProduct(item.productId);
        const category = product?.category || 'سایر';
        salesByCategory[category] = (salesByCategory[category] || 0) + item.total;
      });
    });

    setCategoryData(
      Object.entries(salesByCategory).map(([name, value]) => ({ name, value }))
    );

    // Sales by payment method
    const salesByPayment: Record<string, number> = {
      'نقدی': 0,
      'کارتخوان': 0,
      'نسیه': 0,
      'ترکیبی': 0,
    };

    filteredSales.forEach(sale => {
      switch (sale.paymentMethod) {
        case 'cash':
          salesByPayment['نقدی'] += sale.total;
          break;
        case 'card':
          salesByPayment['کارتخوان'] += sale.total;
          break;
        case 'credit':
          salesByPayment['نسیه'] += sale.total;
          break;
        case 'mixed':
          salesByPayment['ترکیبی'] += sale.total;
          break;
      }
    });

    setPaymentData(
      Object.entries(salesByPayment)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
    );
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
  const totalProfit = salesData.reduce((sum, d) => sum + d.profit, 0);
  const avgDailySales = salesData.length > 0 ? totalSales / salesData.length : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={28} className="text-blue-500" />
            نمودارهای فروش
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تحلیل بصری عملکرد فروش
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-500" />
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as typeof period)}
            className="input w-auto"
          >
            <option value="7days">7 روز گذشته</option>
            <option value="30days">30 روز گذشته</option>
            <option value="90days">90 روز گذشته</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">جمع فروش</p>
          <p className="text-2xl font-bold text-blue-600">
            {totalSales.toLocaleString()} تومان
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">جمع سود</p>
          <p className="text-2xl font-bold text-green-600">
            {totalProfit.toLocaleString()} تومان
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">میانگین روزانه</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(avgDailySales).toLocaleString()} تومان
          </p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          روند فروش و سود
        </h3>
        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => value.toLocaleString() + ' تومان'}
                contentStyle={{ direction: 'rtl' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="فروش"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={2}
                name="سود"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            داده‌ای برای نمایش وجود ندارد
          </div>
        )}
      </div>

      {/* Category and Payment Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            توزیع فروش بر اساس دسته‌بندی
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString() + ' تومان'}
                  contentStyle={{ direction: 'rtl' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </div>

        {/* Payment Method Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            توزیع فروش بر اساس روش پرداخت
          </h3>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString() + ' تومان'}
                  contentStyle={{ direction: 'rtl' }}
                />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="مبلغ فروش">
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
