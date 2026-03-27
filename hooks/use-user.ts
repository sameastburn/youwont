import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '@/api/users';

export function useMe(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['me'],
        queryFn: () => usersApi.getMe(),
        enabled: options?.enabled ?? true,
    });
}

export function useSearchUsers(query: string) {
    return useQuery({
        queryKey: ['users', 'search', query],
        queryFn: () => usersApi.searchUsers(query),
        enabled: query.length >= 2,
        select: (data) => data.users,
    });
}

export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { first_name: string; last_name: string; username: string }) => usersApi.createUser(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['me'] });
        },
    });
}
