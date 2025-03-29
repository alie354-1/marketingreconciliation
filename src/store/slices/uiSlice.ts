import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { AlertNotification } from '../../types';

interface UiState {
  sidebarOpen: boolean;
  currentTheme: 'light' | 'dark';
  notifications: AlertNotification[];
  isLoading: boolean;
  currentView: string;
}

const initialState: UiState = {
  sidebarOpen: true,
  currentTheme: 'light',
  notifications: [],
  isLoading: false,
  currentView: 'dashboard',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.currentTheme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<AlertNotification, 'id'>>) => {
      const notification = {
        ...action.payload,
        id: uuidv4(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentView: (state, action: PayloadAction<string>) => {
      state.currentView = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setCurrentView,
} = uiSlice.actions;

export default uiSlice.reducer;
