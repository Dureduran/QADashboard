import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
    animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Skeleton loader component for displaying placeholder content during loading states.
 * Provides visual feedback that content is being loaded, improving perceived performance.
 */
export function Skeleton({
    className,
    variant = 'rectangular',
    animation = 'shimmer'
}: SkeletonProps) {
    const baseStyles = 'bg-slate-700/50';

    const variantStyles = {
        rectangular: 'rounded-md',
        circular: 'rounded-full',
        text: 'rounded h-4 w-full',
    };

    const animationStyles = {
        pulse: 'animate-pulse',
        shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-600/30 before:to-transparent',
        none: '',
    };

    return (
        <div
            className={cn(
                baseStyles,
                variantStyles[variant],
                animationStyles[animation],
                className
            )}
            aria-hidden="true"
            role="presentation"
        />
    );
}

// Pre-configured skeleton variants for common use cases
export function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
                />
            ))}
        </div>
    );
}

export function SkeletonKPI({ className }: { className?: string }) {
    return (
        <div className={cn('space-y-2', className)}>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-16" />
        </div>
    );
}

export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn('p-4 space-y-3', className)}>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <SkeletonText lines={2} />
        </div>
    );
}

export default Skeleton;
