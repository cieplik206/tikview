import { useEffect } from 'react';
import { useSystemUsers, useSystemUserGroups } from '../../hooks/useMikrotikQuery';

export const UserDataPrefetch: React.FC = () => {
  // Fetch users and groups - they will be cached forever until logout
  const { data: users, isLoading: usersLoading, error: usersError } = useSystemUsers();
  const { data: groups, isLoading: groupsLoading, error: groupsError } = useSystemUserGroups();
  
  useEffect(() => {
    // Data is now cached in React Query
  }, [users, groups]);
  
  // Error handling is done by React Query
  // Errors will be shown in the UI if needed
  
  // This component doesn't render anything visible
  return null;
};