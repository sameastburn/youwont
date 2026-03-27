// Types matching hydrated backend responses

export interface User {
    id: string;
    supabase_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url: string | null;
    points: number;
    created_at: string;
}

export interface UserSummary {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url: string | null;
}

export interface HydratedMember {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url: string | null;
    role: 'ADMIN' | 'MEMBER';
    joined_at: string;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    invite_code: string;
    created_by: string;
    members: HydratedMember[];
    created_at: string;
}

export interface Pool {
    total: number;
    for_total: number;
    against_total: number;
    for_count: number;
    against_count: number;
}

export interface Wager {
    id: string;
    user: UserSummary;
    side: 'FOR' | 'AGAINST';
    amount: number;
    placed_at: string;
}

export interface Bet {
    id: string;
    group_id: string;
    title: string;
    description: string;
    creator: UserSummary;
    decider: UserSummary;
    end_date: string;
    status: 'OPEN' | 'RESOLVED' | 'CANCELED';
    winning_side: 'FOR' | 'AGAINST' | null;
    wagers: Wager[];
    pool: Pool;
    resolved_at: string | null;
    created_at: string;
}

export interface BetSummary {
    id: string;
    group_id: string;
    title: string;
    description: string;
    creator: UserSummary;
    status: 'OPEN' | 'RESOLVED' | 'CANCELED';
    winning_side: 'FOR' | 'AGAINST' | null;
    end_date: string;
    wager_count: number;
    pool: Pool;
    created_at: string;
}

export interface Invite {
    id: string;
    group_id: string;
    group_name: string;
    invited_by: string;
    invited_by_name: string;
    invitee_id: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    ref_type: 'invite' | 'bet' | 'group';
    ref_id: string;
    message: string;
    read: boolean;
    created_at: string;
}

export interface Payout {
    user_id: string;
    name: string;
    amount: number;
    net: number;
}

export interface ResolveResponse {
    id: string;
    status: string;
    winning_side: string;
    resolved_at: string;
    payouts: Payout[];
}
