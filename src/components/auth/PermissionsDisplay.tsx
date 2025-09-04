import React, { useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

export const PermissionsDisplay: React.FC = () => {
  const { permissions, isLoading, isError, error, canWrite, isReadOnly } = usePermissions();
  
  // Permissions are now available via the hook
  // No need to log them
  
  if (isLoading) {
    return <div className="text-xs text-base-content/50">Loading permissions...</div>;
  }
  
  if (isError) {
    // Error is handled by React Query
    return null;
  }
  
  if (!permissions) {
    return null;
  }
  
  // Permissions display disabled - uncomment the block below to show in dev mode
  // if (import.meta.env.DEV) {
  //   return (
  //     <div className="fixed bottom-4 right-4 z-50 p-2 bg-base-200 rounded-lg shadow-lg text-xs">
  //       <div className="font-semibold mb-1">User Permissions:</div>
  //       <div className="grid grid-cols-2 gap-1 text-[10px]">
  //         {Object.entries(permissions).map(([key, value]) => (
  //           <div key={key} className="flex items-center gap-1">
  //             <span className={value ? 'text-success' : 'text-error'}>
  //               {value ? '✓' : '✗'}
  //             </span>
  //             <span className="opacity-70">{key}</span>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }
  
  return null;
};