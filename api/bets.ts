import { get, post, put } from './client';
import type { Bet, BetSummary, ResolveResponse } from './types';

export interface CreateBetInput {
    title: string;
    description: string;
    end_date: string;
    decider_id: string;
    opening_wager: {
        side: 'FOR' | 'AGAINST';
        amount: number;
    };
}

export function getBetsByGroup(groupId: string, status?: string) {
    const params = status ? `?status=${status}` : '';
    return get<{ bets: BetSummary[] }>(`/groups/${groupId}/bets${params}`);
}

export function createBet(groupId: string, data: CreateBetInput) {
    return post<Bet>(`/groups/${groupId}/bets`, data);
}

export function getBet(id: string) {
    return get<Bet>(`/bets/${id}`);
}

export function placeWager(betId: string, data: { side: string; amount: number }) {
    return post<Bet>(`/bets/${betId}/wagers`, data);
}

export function changeDecider(betId: string, deciderId: string) {
    return put<Bet>(`/bets/${betId}/decider`, { decider_id: deciderId });
}

export function resolveBet(betId: string, winningSide: string) {
    return post<ResolveResponse>(`/bets/${betId}/resolve`, { winning_side: winningSide });
}
