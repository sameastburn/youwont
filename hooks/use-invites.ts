import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invitesApi from '@/api/invites';

export function useMyInvites() {
    return useQuery({
        queryKey: ['invites'],
        queryFn: () => invitesApi.getMyInvites(),
        select: (data) => data.invites,
    });
}

export function useSendInvite(groupId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => invitesApi.sendInvite(groupId, userId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['group', groupId] });
        },
    });
}

export function useAcceptInvite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invitesApi.acceptInvite(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['invites'] });
            qc.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}

export function useDeclineInvite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invitesApi.declineInvite(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['invites'] });
        },
    });
}
