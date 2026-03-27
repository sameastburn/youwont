import { supabase } from '@/lib/supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options?.headers,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Request failed' } }));
        throw new ApiError(res.status, body.error?.code ?? 'UNKNOWN', body.error?.message ?? 'Request failed');
    }

    return res.json();
}

export function get<T>(path: string): Promise<T> {
    return request<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });
}
