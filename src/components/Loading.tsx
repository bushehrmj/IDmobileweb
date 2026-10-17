import React from 'react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
