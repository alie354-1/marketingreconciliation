import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAppSelector, useAppDispatch } from '../../hooks/index';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { 
  LayoutDashboard, 
  Target, 
  BarChart3, 
  Settings, 
  FileText, 
  ChevronLeft, 
  Brain,
  HeartPulse, 
  Globe,
  Database,
  Pill
} from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMini?: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  to, 
  icon, 
  label, 
  isActive, 
  isMini = false,
  onClick 
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
        'hover:bg-primary-50 hover:text-primary-600',
        isActive
          ? 'bg-primary-50 text-primary-600 font-medium'
          : 'text-gray-700',
        isMini ? 'justify-center' : 'justify-start'
      )}
    >
      <span className={cn('h-5 w-5', !isMini && 'mr-3')}>{icon}</span>
      {!isMini && <span>{label}</span>}
    </Link>
  );
};

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  isMini?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  children, 
  isMini = false
}) => {
  return (
    <div className="mb-6">
      {title && !isMini && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
};

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => {
    // Type assertion for state.ui until we fix our type structure
    const ui = state.ui as { sidebarOpen: boolean };
    return ui.sidebarOpen;
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleSidebarHandler = () => {
    dispatch(toggleSidebar());
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 h-full bg-white border-r border-gray-200 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        {sidebarOpen ? (
          <div className="flex items-center">
            <HeartPulse className="h-8 w-8 text-primary-500" />
            <span className="ml-2 text-xl font-semibold text-gray-900">HCP Targeter</span>
          </div>
        ) : (
          <HeartPulse className="h-8 w-8 mx-auto text-primary-500" />
        )}
        <button
          onClick={toggleSidebarHandler}
          className={cn(
            'p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500',
            !sidebarOpen && 'hidden'
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="py-6">
        <SidebarSection isMini={!sidebarOpen}>
          <SidebarLink
            to="/"
            icon={<LayoutDashboard />}
            label="Dashboard"
            isActive={isActive('/')}
            isMini={!sidebarOpen}
          />
          <SidebarLink
            to="/campaigns"
            icon={<Target />}
            label="Campaigns"
            isActive={isActive('/campaigns')}
            isMini={!sidebarOpen}
          />
          <SidebarLink
            to="/analytics"
            icon={<BarChart3 />}
            label="Analytics"
            isActive={isActive('/analytics')}
            isMini={!sidebarOpen}
          />
        </SidebarSection>

        <SidebarSection isMini={!sidebarOpen}>
          <SidebarLink
            to="/database"
            icon={<Database />}
            label="Audience Explorer"
            isActive={isActive('/database')}
            isMini={!sidebarOpen}
          />
          
          {/* Hidden resource items - keeping the code but not displaying in UI */}
          {false && (
            <>
              <div className="relative">
                <SidebarLink
                  to="/conditions"
                  icon={<Brain />}
                  label="Conditions"
                  isActive={isActive('/conditions')}
                  isMini={!sidebarOpen}
                />
                {!sidebarOpen ? (
                  <div className="absolute -right-1 -top-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Soon
                    </span>
                  </div>
                ) : (
                  <span className="absolute right-3 top-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <div className="relative">
                <SidebarLink
                  to="/medications"
                  icon={<Pill />}
                  label="Medications"
                  isActive={isActive('/medications')}
                  isMini={!sidebarOpen}
                />
                {!sidebarOpen ? (
                  <div className="absolute -right-1 -top-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Soon
                    </span>
                  </div>
                ) : (
                  <span className="absolute right-3 top-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <div className="relative">
                <SidebarLink
                  to="/regions"
                  icon={<Globe />}
                  label="Regions"
                  isActive={isActive('/regions')}
                  isMini={!sidebarOpen}
                />
                {!sidebarOpen ? (
                  <div className="absolute -right-1 -top-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Soon
                    </span>
                  </div>
                ) : (
                  <span className="absolute right-3 top-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Coming Soon
                  </span>
                )}
              </div>
            </>
          )}
        </SidebarSection>

        <SidebarSection isMini={!sidebarOpen}>
          <SidebarLink
            to="/settings"
            icon={<Settings />}
            label="Settings"
            isActive={isActive('/settings')}
            isMini={!sidebarOpen}
          />
        </SidebarSection>
      </div>
    </aside>
  );
};
