import React from 'react';
import { Bell, Search, UserCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useQueryClient } from '@tanstack/react-query';

export const Header = () => {
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await queryClient.refetchQueries();
        setTimeout(() => setRefreshing(false), 500);
    };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center gap-4 border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur">
      <div className="flex-1">
         <h1 className="text-lg font-semibold text-slate-100">Dashboard Overview</h1>
         <p className="text-xs text-slate-500">Global Network Performance • {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="flex items-center gap-4">
         <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            System Operational
         </div>

         <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            className={refreshing ? "animate-spin" : ""}
            title="Refresh Data"
         >
            <RefreshCw className="h-5 w-5 text-slate-400" />
         </Button>

         <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-slate-400" />
         </Button>
         
         <div className="h-8 w-px bg-slate-800 mx-2"></div>
         
         <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-slate-200">Asad Durrani</div>
                <div className="text-xs text-slate-500">Manager, Data Science</div>
            </div>
            <UserCircle className="h-8 w-8 text-slate-400" />
         </div>
      </div>
    </header>
  );
};