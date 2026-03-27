import { get, post } from './client';
import type { Group } from './types';

export function createGroup(data: { name: string; description: string }) {
    return post<Group>('/groups', data);
}

export function getGroups() {
    return get<{ groups: Group[] }>('/groups');
}

export function getGroup(id: string) {
    return get<Group>(`/groups/${id}`);
}

export function joinByCode(inviteCode: string) {
    return post<Group>('/groups/join', { invite_code: inviteCode });
}
