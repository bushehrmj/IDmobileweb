import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { 
  ShoppingCart, Wrench, Users, Package, 
  ArrowDownToLine, ArrowUpFromLine, Receipt, Plus, X
} from 'lucide-react';

interface QuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, action?: string) => void;
}

export default function QuickActions({ isOpen, onClose, onNavigate }: QuickActionsProps) {
  const { hasPermission } = useAuth();

  if (!isOpen) return null;

  const actions = [
    {
      id: 'new-sale',
      label: 'فروش جدید',
      icon: ShoppingCart,
      page: 'sales',
      action: 'new',
      permission: 'sales.create',
      color: 'bg-blue-500',
    },
    {
      id: 'new-repair',
      label: 'پذیرش تعمیر',
      icon: Wrench,
      page: 'repairs',
      action: 'new',
      permission: 'repairs.create',
      color: 'bg-purple-500',
    },
    {
      id: 'new-customer',
      label: 'مشتری جدید',
      icon: Users,
      page: 'customers',
      action: 'new',
      permission: 'customers.create',
      color: 'bg-green-500',
    },
    {
      id: 'new-product',
      label: 'محصول جدید',
      icon: Package,
      page: 'products',
      action: 'new',
      permission: 'products.create',
      color: 'bg-amber-500',
    },
    {
      id: 'new-purchase',
      label: 'خرید جدید',
      icon: ArrowDownToLine,
      page: 'purchases',
      action: 'new',
      permission: 'purchases.create',
      color: 'bg-indigo-500',
    },
    {
      id: 'receive-payment',
      label: 'دریافت پرداخت',
      icon: ArrowUpFromLine,
      page: 'payments',
      action: 'receive',
      permission: 'financial.expenses',
      color: 'bg-emerald-500',
    },
    {
      id: 'new-expense',
      label: 'ثبت هزینه',
      icon: Receipt,
      page: 'expenses',
      action: 'new',
      permission: 'financial.expenses',
      color: 'bg-rose-500',
    },
  ];

  const filteredActions = actions.filter(a => hasPermission(a.permission));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Actions Modal */}
      <div className="relative w-full max-w-md card animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-lg">دسترسی سریع</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {filteredActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                onNavigate(action.page, action.action);
                onClose();
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 group"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon size={24} className="text-white" />
              </div>
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 text-center">
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">N</kbd> برای باز کردن
        </div>
      </div>
    </div>
  );
}
