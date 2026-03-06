import { get, post } from './client';
import type { Invite } from './types';

export function sendInvite(groupId: string, userId: string) {
    return post<Invite>(`/groups/${groupId}/invites`, { user_id: userId });
}

export function getMyInvites() {
    return get<{ invites: Invite[] }>('/invites');
}

export function acceptInvite(id: string) {
    return post<{ id: string; status: string; group_id: string }>(`/invites/${id}/accept`);
}

export function declineInvite(id: string) {
    return post<{ id: string; status: string }>(`/invites/${id}/decline`);
}
