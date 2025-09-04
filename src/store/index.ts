import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import systemResourcesSlice from './slices/systemResourcesSlice';
import networkStatusSlice from './slices/networkStatusSlice';
import toastSlice from './slices/toastSlice';
import healthSlice from './slices/healthSlice';
import capabilitiesSlice from './slices/capabilitiesSlice';
// RTK Query removed - using TanStack Query instead

export const store = configureStore({
  reducer: {
    auth: authSlice,
    systemResources: systemResourcesSlice,
    networkStatus: networkStatusSlice,
    toast: toastSlice,
    health: healthSlice,
    capabilities: capabilitiesSlice,
    // RTK Query reducer removed - using TanStack Query instead
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'auth/checkAuth/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp', 'payload.api'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.api', 'systemResources.pollingIntervalId', 'systemResources.trafficPollingId'],
      },
    }),
    // RTK Query middleware removed - using TanStack Query instead
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;