import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * route() yang aman untuk route yang belum dibuat: kembali ke fallback (mis. anchor section).
 */
export function safeRoute(name, fallback = '#', params = undefined) {
    return route().has(name) ? route(name, params) : fallback;
}
