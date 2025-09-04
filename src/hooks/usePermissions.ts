import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGetUserPermissions, UserPermissions } from './useMikrotikQuery';

/**
 * Hook to get and cache current user's permissions
 * Automatically fetches permissions on mount and caches them
 */
export const usePermissions = () => {
  const mutation = useGetUserPermissions();
  
  // Use React Query to cache the permissions result
  const { data: permissions, isLoading } = useQuery<UserPermissions>({
    queryKey: ['userPermissions'],
    queryFn: async () => {
      // If mutation has cached data, return it
      if (mutation.data) {
        return mutation.data;
      }
      // Otherwise fetch it
      const result = await mutation.mutateAsync();
      return result;
    },
    staleTime: Infinity, // Never stale
    gcTime: Infinity,    // Cache forever until logout
    retry: 1,
  });
  
  return {
    permissions: permissions || null,
    isLoading,
    isError: mutation.isError,
    error: mutation.error,
    // Helper functions for common permission checks
    canWrite: () => permissions?.write === true,
    canRead: () => permissions?.read === true,
    canReboot: () => permissions?.reboot === true,
    canManageUsers: () => permissions?.password === true && permissions?.policy === true,
    canAccessAPI: () => permissions?.api === true && permissions?.rest_api === true,
    isReadOnly: () => permissions?.write === false && permissions?.read === true,
  };
};

/**
 * Hook to check a specific permission
 */
export const useHasPermission = (permission: keyof UserPermissions): boolean => {
  const { permissions } = usePermissions();
  return permissions?.[permission] === true;
};