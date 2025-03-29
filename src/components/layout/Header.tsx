import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Bell, Search, Menu, ChevronRight, User, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { signOut } from '../../store/slices/authSlice';

interface HeaderProps {
  toggleSidebar: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, className }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  
  // State for user dropdown menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle sign out
  const handleSignOut = async () => {
    await dispatch(signOut());
    navigate('/');
  };
  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6',
        className
      )}
    >
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-2 text-gray-500 rounded-md lg:hidden hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden md:flex md:items-center relative max-w-md w-full">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center text-sm text-gray-500">
          <span className="sr-only">Current path:</span>
          <Link to="/" className="hover:text-gray-900">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-gray-900 font-medium">Campaigns</span>
        </div>
        
        <button className="p-2 text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-100 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center relative" ref={dropdownRef}>
          <button 
            className="relative flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
          </button>
          
          {/* User dropdown menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-10 w-48 py-1 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              {user && (
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium truncate">{user.email}</div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                <div className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
