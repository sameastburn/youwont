import { get, post } from './client';
import type { Notification } from './types';

export function getNotifications(page = 0, limit = 20) {
    return get<{ notifications: Notification[]; has_more: boolean }>(`/notifications?page=${page}&limit=${limit}`);
}

export function getUnreadCount() {
    return get<{ count: number }>('/notifications/unread-count');
}

export function markRead(id: string) {
    return post<{ id: string; read: boolean }>(`/notifications/${id}/read`);
}

export function markAllRead() {
    return post<{ updated: number }>('/notifications/read-all');
}
