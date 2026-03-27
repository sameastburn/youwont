import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '@/api/notifications';

export function useNotifications(page = 0) {
    return useQuery({
        queryKey: ['notifications', page],
        queryFn: () => notificationsApi.getNotifications(page),
    });
}

export function useUnreadCount() {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationsApi.getUnreadCount(),
        refetchInterval: 30000,
        select: (data) => data.count,
    });
}

export function useMarkRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationsApi.markRead(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] });
            qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
}

export function useMarkAllRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => notificationsApi.markAllRead(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] });
            qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
}
