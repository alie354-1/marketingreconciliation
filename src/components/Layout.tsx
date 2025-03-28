import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
        <Toaster position="top-right" richColors />
      </div>
    </div>
  );
}