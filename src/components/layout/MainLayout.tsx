import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { Toaster } from 'sonner';
import { cn } from '../../utils/cn';

interface MainLayoutProps {
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => {
    // Type assertion for state.ui until we fix our type structure
    const ui = state.ui as { sidebarOpen: boolean };
    return ui.sidebarOpen;
  });
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className={cn(
        'flex-1 transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-16',
        className
      )}>
        <Header toggleSidebar={handleToggleSidebar} />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};
