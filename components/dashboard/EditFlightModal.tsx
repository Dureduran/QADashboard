import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Flight } from '../../types';
import { api } from '../../services/mockData';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';

const schema = z.object({
  booked: z.number().min(0, "Booked count cannot be negative"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});

type FormData = z.infer<typeof schema>;

interface EditFlightModalProps {
  flight: Flight;
  isOpen: boolean;
  onClose: () => void;
}

export const EditFlightModal = ({ flight, isOpen, onClose }: EditFlightModalProps) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      booked: flight.booked,
      capacity: flight.capacity,
    }
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.updateFlight(flight.id, data),
    onMutate: async (newData) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['flights'] });
      const previousFlights = queryClient.getQueryData<Flight[]>(['flights']);

      if (previousFlights) {
         queryClient.setQueryData<Flight[]>(['flights'], (old) => {
            return old?.map(f => f.id === flight.id ? { ...f, ...newData, currentLoadFactor: (newData.booked / newData.capacity) * 100 } : f) || [];
         });
      }
      return { previousFlights };
    },
    onError: (err, newTodo, context) => {
       // Rollback
       if (context?.previousFlights) {
         queryClient.setQueryData(['flights'], context.previousFlights);
       }
       alert("Failed to update flight");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
    },
    onSuccess: () => {
        setSuccessMsg("Flight updated successfully.");
        setTimeout(() => {
            setSuccessMsg(null);
            onClose();
        }, 1500);
    }
  });

  const onSubmit = (data: FormData) => {
    setIsSaving(true);
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Adjust Capacity: {flight.flightNumber}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Booked Seats</label>
            <Input 
              type="number" 
              {...register("booked", { valueAsNumber: true })} 
              className={errors.booked ? "border-red-500" : ""}
            />
            {errors.booked && <span className="text-xs text-red-500">{errors.booked.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Aircraft Capacity</label>
            <Input 
              type="number" 
              {...register("capacity", { valueAsNumber: true })}
               className={errors.capacity ? "border-red-500" : ""}
            />
            {errors.capacity && <span className="text-xs text-red-500">{errors.capacity.message}</span>}
          </div>

          {successMsg && (
             <div className="p-3 bg-emerald-900/30 text-emerald-400 text-sm rounded border border-emerald-800">
                {successMsg}
             </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
             <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
             <Button type="submit" disabled={isSaving || mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
