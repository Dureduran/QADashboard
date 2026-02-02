import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel
} from '@tanstack/react-table';
import { api } from '../../services/mockData';
import { Flight } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Search, MoreHorizontal, Edit, AlertCircle, Download, Loader2 } from 'lucide-react';
import { formatPercent } from '../../lib/utils';
import { EditFlightModal } from './EditFlightModal';
import { useToast } from '../ui/Toast';

const columnHelper = createColumnHelper<Flight>();

export const FlightTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const { data: flights, isLoading, isError } = useQuery({
    queryKey: ['flights'],
    queryFn: api.getFlights,
  });

  const handleExport = () => {
    setExporting(true);
    // Simulate export delay
    setTimeout(() => {
      setExporting(false);
      // In a real app, this would trigger a download
      toast.success(`Exported ${flights?.length || 0} flights to CSV`);
    }, 1000);
  };

  const columns = [
    columnHelper.accessor('flightNumber', {
      header: 'Flight',
      cell: info => <span className="font-semibold text-slate-100">{info.getValue()}</span>,
    }),
    columnHelper.accessor('origin', {
      header: 'Origin',
      cell: info => <span className="text-slate-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('destination', {
      header: 'Dest',
      cell: info => <span className="text-slate-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('departureDate', {
      header: 'Date',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor('currentLoadFactor', {
      header: 'Load Factor',
      cell: info => {
        const val = info.getValue();
        return (
          <div className="flex items-center gap-2">
            <span className={val > 95 ? "text-amber-400" : "text-slate-200"}>{formatPercent(val)}</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${val > 90 ? 'bg-amber-500' : val < 70 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(val, 100)}%` }}
              />
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('rask', {
      header: 'RASK (¢)',
      cell: info => info.getValue().toFixed(1),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const variant =
          status === 'On Track' ? 'success' :
            status === 'Critical' ? 'destructive' :
              status === 'Overbooked' ? 'warning' : 'outline';
        return <Badge variant={variant}>{status}</Badge>;
      }
    }),
    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingFlight(row.original)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4 text-slate-400" />
        </Button>
      )
    })
  ];

  const table = useReactTable({
    data: flights || [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <Card className="h-96 bg-slate-900 border-slate-800 animate-pulse" />;
  if (isError) return <div className="text-red-500">Error loading flights</div>;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-slate-200">Flight Performance Monitor</CardTitle>
          {globalFilter && (
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
              Showing {table.getFilteredRowModel().rows.length} of {flights?.length || 0}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search flights..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-64 rounded-md border border-slate-700 bg-slate-950 pl-9 px-3 py-1 text-sm shadow-sm transition-colors text-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            {exporting ? (
              <><Loader2 className="h-3 w-3 animate-spin" />Exporting...</>
            ) : (
              <>
                <Download className="h-3 w-3" />
                Export
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 font-medium">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-4 py-3 border-b border-slate-800 cursor-pointer hover:text-slate-200" onClick={header.column.getToggleSortingHandler()}>
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-slate-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {editingFlight && (
        <EditFlightModal
          flight={editingFlight}
          isOpen={!!editingFlight}
          onClose={() => setEditingFlight(null)}
        />
      )}
    </Card>
  );
};
