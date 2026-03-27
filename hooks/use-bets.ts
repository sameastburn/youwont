import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as betsApi from '@/api/bets';
import type { CreateBetInput } from '@/api/bets';

export function useBets(groupId: string, status?: string) {
    return useQuery({
        queryKey: ['bets', groupId, status],
        queryFn: () => betsApi.getBetsByGroup(groupId, status),
        select: (data) => data.bets,
        enabled: !!groupId,
    });
}

export function useBet(betId: string) {
    return useQuery({
        queryKey: ['bet', betId],
        queryFn: () => betsApi.getBet(betId),
        enabled: !!betId,
    });
}

export function useCreateBet(groupId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBetInput) => betsApi.createBet(groupId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bets', groupId] });
            qc.invalidateQueries({ queryKey: ['me'] });
        },
    });
}

export function usePlaceWager(betId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { side: string; amount: number }) => betsApi.placeWager(betId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bet', betId] });
            qc.invalidateQueries({ queryKey: ['bets'] });
            qc.invalidateQueries({ queryKey: ['me'] });
        },
    });
}

export function useResolveBet(betId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (winningSide: string) => betsApi.resolveBet(betId, winningSide),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bet', betId] });
            qc.invalidateQueries({ queryKey: ['bets'] });
            qc.invalidateQueries({ queryKey: ['me'] });
        },
    });
}
