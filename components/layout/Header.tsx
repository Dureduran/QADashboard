import React from 'react';
import { Bell, RefreshCw, UserCircle, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
   const queryClient = useQueryClient();
   const toast = useToast();
   const [refreshing, setRefreshing] = React.useState(false);

   const handleRefresh = async () => {
      setRefreshing(true);
      try {
         await queryClient.refetchQueries();
         toast.success('Data refreshed successfully');
      } catch (error) {
         toast.error('Refresh failed. Please try again.');
      } finally {
         setTimeout(() => setRefreshing(false), 500);
      }
   };

   return (
      <header className="sticky top-0 z-10 flex h-14 w-full items-center gap-4 border-b border-slate-800/30 bg-slate-950/80 px-4 md:px-6 backdrop-blur-sm">
         <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-8 w-8 md:hidden"
            title="Open navigation"
            aria-label="Open navigation"
         >
            <Menu className="h-5 w-5 text-slate-400" />
         </Button>
         <div className="flex-1 min-w-0">
            <h1 className="text-base font-medium text-slate-200 truncate">Dashboard Overview</h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">Global Network Performance</p>
         </div>

         <div className="flex items-center gap-3">
            <Button
               variant="ghost"
               size="icon"
               onClick={handleRefresh}
               className={cn("h-8 w-8", refreshing ? "animate-spin" : "")}
               title="Refresh Data"
            >
               <RefreshCw className="h-4 w-4 text-slate-500" />
            </Button>

            <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8"
               onClick={() => toast.info('No unresolved RM alerts in this demo snapshot')}
               title="View Alerts"
            >
               <Bell className="h-4 w-4 text-slate-500" />
            </Button>

            <div className="h-6 w-px bg-slate-800/50 mx-1"></div>

            <div className="flex items-center gap-2">
               <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-slate-300">Asad Durrani</div>
                  <div className="text-[10px] text-slate-500">Data Science</div>
               </div>
               <UserCircle className="h-7 w-7 text-slate-500" />
            </div>
         </div>
      </header>
   );
};
