import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupsApi from '@/api/groups';

export function useGroups() {
    return useQuery({
        queryKey: ['groups'],
        queryFn: () => groupsApi.getGroups(),
        select: (data) => data.groups,
    });
}

export function useGroup(groupId: string) {
    return useQuery({
        queryKey: ['group', groupId],
        queryFn: () => groupsApi.getGroup(groupId),
        enabled: !!groupId,
    });
}

export function useCreateGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description: string }) => groupsApi.createGroup(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}

export function useJoinByCode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (inviteCode: string) => groupsApi.joinByCode(inviteCode),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
