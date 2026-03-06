import { get, post } from './client';
import type { User, UserSummary } from './types';

export function createUser(data: { name: string; username: string }) {
    return post<User>('/users', data);
}

export function getMe() {
    return get<User>('/users/me');
}

export function searchUsers(query: string) {
    return get<{ users: UserSummary[] }>(`/users/search?q=${encodeURIComponent(query)}`);
}
