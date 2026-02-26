// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    points: number;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    invite_code: string;
    created_by: string;
    members: GroupMember[];
}

export interface GroupMember {
    user: User;
    role: 'ADMIN' | 'MEMBER';
    joined_at: string;
}

export type BetStatus = 'OPEN' | 'RESOLVED' | 'CANCELED';
export type BetSide = 'FOR' | 'AGAINST';

export interface Wager {
    id: string;
    user: User;
    side: BetSide;
    amount: number;
    placed_at: string;
}

export interface Bet {
    id: string;
    group_id: string;
    title: string;
    description: string;
    creator: User;
    decider: User;
    end_date: string;
    status: BetStatus;
    winning_side: BetSide | null;
    wagers: Wager[];
}

// Helper to compute pool info from wagers
export function getPoolInfo(bet: Bet) {
    const forWagers = bet.wagers.filter((w) => w.side === 'FOR');
    const againstWagers = bet.wagers.filter((w) => w.side === 'AGAINST');
    const forTotal = forWagers.reduce((sum, w) => sum + w.amount, 0);
    const againstTotal = againstWagers.reduce((sum, w) => sum + w.amount, 0);
    return {
        total: forTotal + againstTotal,
        forTotal,
        againstTotal,
        forCount: forWagers.length,
        againstCount: againstWagers.length,
    };
}

// ─── Mock Users ─────────────────────────────────────────────────────────────

export const CURRENT_USER: User = {
    id: 'u1',
    name: 'You',
    username: 'you',
    avatar_url: null,
    points: 1240,
};

const orion: User = {
    id: 'u2',
    name: 'Orion',
    username: 'orion',
    avatar_url: null,
    points: 980,
};

const paul: User = {
    id: 'u3',
    name: 'Paul',
    username: 'paul',
    avatar_url: null,
    points: 1500,
};

const sam: User = {
    id: 'u4',
    name: 'Sam',
    username: 'sam',
    avatar_url: null,
    points: 640,
};

const allison: User = {
    id: 'u5',
    name: 'Allison',
    username: 'allison',
    avatar_url: null,
    points: 2100,
};

const aaron: User = {
    id: 'u6',
    name: 'Aaron',
    username: 'aaron',
    avatar_url: null,
    points: 330,
};

const garrett: User = {
    id: 'u7',
    name: 'Garrett',
    username: 'garrett',
    avatar_url: null,
    points: 870,
};

// ─── Mock Groups ────────────────────────────────────────────────────────────

export const MOCK_GROUPS: Group[] = [
    {
        id: 'g1',
        name: 'The Squad',
        description: 'Our main friend group. No cap bets only. 🔥',
        invite_code: 'SQUAD2024',
        created_by: 'u1',
        members: [
            { user: CURRENT_USER, role: 'ADMIN', joined_at: '2024-12-01T10:00:00Z' },
            { user: orion, role: 'MEMBER', joined_at: '2024-12-02T14:30:00Z' },
            { user: paul, role: 'MEMBER', joined_at: '2024-12-03T09:15:00Z' },
            { user: sam, role: 'MEMBER', joined_at: '2024-12-05T18:00:00Z' },
            { user: allison, role: 'MEMBER', joined_at: '2024-12-06T11:45:00Z' },
        ],
    },
    {
        id: 'g2',
        name: 'Work Rivals',
        description: 'Friendly office competitions. Loser buys lunch vibes.',
        invite_code: 'WORK42',
        created_by: 'u2',
        members: [
            { user: orion, role: 'ADMIN', joined_at: '2025-01-10T08:00:00Z' },
            { user: CURRENT_USER, role: 'MEMBER', joined_at: '2025-01-11T12:00:00Z' },
            { user: aaron, role: 'MEMBER', joined_at: '2025-01-12T16:30:00Z' },
            { user: garrett, role: 'MEMBER', joined_at: '2025-01-15T10:00:00Z' },
        ],
    },
    {
        id: 'g3',
        name: 'Fantasy Legends',
        description: 'Side bets for our fantasy football league. Put your points where your mouth is.',
        invite_code: 'FNTSY99',
        created_by: 'u3',
        members: [
            { user: paul, role: 'ADMIN', joined_at: '2025-02-01T09:00:00Z' },
            { user: CURRENT_USER, role: 'MEMBER', joined_at: '2025-02-02T13:00:00Z' },
            { user: orion, role: 'MEMBER', joined_at: '2025-02-03T10:00:00Z' },
            { user: allison, role: 'MEMBER', joined_at: '2025-02-04T15:00:00Z' },
            { user: sam, role: 'MEMBER', joined_at: '2025-02-05T11:00:00Z' },
            { user: aaron, role: 'MEMBER', joined_at: '2025-02-06T14:00:00Z' },
        ],
    },
];

// ─── Mock Bets ──────────────────────────────────────────────────────────────

export const MOCK_BETS: Bet[] = [
    // ── The Squad (g1) ──
    {
        id: 'b1',
        group_id: 'g1',
        title: 'Orion won\'t get her number at the ward activity',
        description: 'Orion keeps saying he\'s gonna talk to that girl from 3rd ward at the next FHE. We\'ll see about that.',
        creator: CURRENT_USER,
        decider: paul,
        end_date: '2026-03-14T23:59:59Z',
        status: 'OPEN',
        winning_side: null,
        wagers: [
            { id: 'w1', user: CURRENT_USER, side: 'FOR', amount: 100, placed_at: '2026-02-15T10:00:00Z' },
            { id: 'w2', user: sam, side: 'FOR', amount: 75, placed_at: '2026-02-16T12:30:00Z' },
            { id: 'w3', user: allison, side: 'AGAINST', amount: 200, placed_at: '2026-02-17T08:00:00Z' },
            { id: 'w4', user: paul, side: 'FOR', amount: 50, placed_at: '2026-02-18T14:00:00Z' },
        ],
    },
    {
        id: 'b2',
        group_id: 'g1',
        title: 'Jazz win 5 straight this month',
        description: 'The Jazz are lowkey cooking right now. Lauri is hooping. 5 game win streak or it didn\'t happen.',
        creator: orion,
        decider: sam,
        end_date: '2026-03-31T23:59:59Z',
        status: 'OPEN',
        winning_side: null,
        wagers: [
            { id: 'w5', user: orion, side: 'FOR', amount: 60, placed_at: '2026-02-20T09:00:00Z' },
            { id: 'w6', user: CURRENT_USER, side: 'AGAINST', amount: 80, placed_at: '2026-02-21T11:00:00Z' },
            { id: 'w7', user: sam, side: 'FOR', amount: 40, placed_at: '2026-02-22T16:00:00Z' },
        ],
    },
    {
        id: 'b3',
        group_id: 'g1',
        title: 'Sam won\'t hike the Y before spring',
        description: 'Sam has lived in Provo for 2 years and still hasn\'t hiked the Y. Classic. Bet he won\'t do it before April.',
        creator: allison,
        decider: CURRENT_USER,
        end_date: '2026-04-01T23:59:59Z',
        status: 'RESOLVED',
        winning_side: 'FOR',
        wagers: [
            { id: 'w8', user: allison, side: 'FOR', amount: 150, placed_at: '2026-01-05T10:00:00Z' },
            { id: 'w9', user: orion, side: 'FOR', amount: 100, placed_at: '2026-01-06T14:00:00Z' },
            { id: 'w10', user: paul, side: 'AGAINST', amount: 120, placed_at: '2026-01-07T09:30:00Z' },
        ],
    },

    // ── Work Rivals (g2) ──
    {
        id: 'b4',
        group_id: 'g2',
        title: 'Garrett won\'t hit his sales goal this quarter',
        description: 'Garrett is 20% behind on Q1 numbers with 3 weeks left. He says he\'s "locked in." Sure bro.',
        creator: orion,
        decider: aaron,
        end_date: '2026-03-31T23:59:59Z',
        status: 'OPEN',
        winning_side: null,
        wagers: [
            { id: 'w11', user: orion, side: 'FOR', amount: 50, placed_at: '2026-03-01T08:00:00Z' },
            { id: 'w12', user: CURRENT_USER, side: 'AGAINST', amount: 75, placed_at: '2026-03-02T12:00:00Z' },
            { id: 'w13', user: garrett, side: 'AGAINST', amount: 30, placed_at: '2026-03-03T16:00:00Z' },
        ],
    },
    {
        id: 'b5',
        group_id: 'g2',
        title: 'Last one to Swig pays for everyone',
        description: 'Friday Swig run. Whoever shows up last covers the whole order. Dirty sodas aren\'t cheap.',
        creator: aaron,
        decider: orion,
        end_date: '2026-02-28T17:00:00Z',
        status: 'RESOLVED',
        winning_side: 'AGAINST',
        wagers: [
            { id: 'w14', user: aaron, side: 'AGAINST', amount: 25, placed_at: '2026-02-28T12:00:00Z' },
            { id: 'w15', user: CURRENT_USER, side: 'FOR', amount: 25, placed_at: '2026-02-28T12:15:00Z' },
            { id: 'w16', user: garrett, side: 'AGAINST', amount: 25, placed_at: '2026-02-28T12:30:00Z' },
        ],
    },
    {
        id: 'b6',
        group_id: 'g2',
        title: 'Garrett eats at the Creamery 5 days straight',
        description: 'Garrett says the BYU Creamery on 9th is underrated and he\'ll eat there every day this week. Canceled because he got food poisoning day 3 💀',
        creator: CURRENT_USER,
        decider: aaron,
        end_date: '2026-02-21T23:59:59Z',
        status: 'CANCELED',
        winning_side: null,
        wagers: [
            { id: 'w17', user: CURRENT_USER, side: 'FOR', amount: 40, placed_at: '2026-02-17T10:00:00Z' },
            { id: 'w18', user: orion, side: 'AGAINST', amount: 40, placed_at: '2026-02-17T14:00:00Z' },
        ],
    },

    // ── Fantasy Legends (g3) ──
    {
        id: 'b7',
        group_id: 'g3',
        title: 'BYU beats Utah in the rivalry game',
        description: 'The Holy War is back. BYU is looking solid this year. Utah fans in shambles or nah?',
        creator: paul,
        decider: allison,
        end_date: '2026-11-29T23:59:59Z',
        status: 'OPEN',
        winning_side: null,
        wagers: [
            { id: 'w19', user: paul, side: 'FOR', amount: 200, placed_at: '2026-08-20T10:00:00Z' },
            { id: 'w20', user: CURRENT_USER, side: 'FOR', amount: 150, placed_at: '2026-08-21T14:00:00Z' },
            { id: 'w21', user: orion, side: 'FOR', amount: 100, placed_at: '2026-08-22T09:00:00Z' },
            { id: 'w22', user: sam, side: 'AGAINST', amount: 50, placed_at: '2026-08-23T11:00:00Z' },
            { id: 'w23', user: aaron, side: 'AGAINST', amount: 75, placed_at: '2026-08-24T16:00:00Z' },
        ],
    },
    {
        id: 'b8',
        group_id: 'g3',
        title: 'Jazz make the playoffs this season',
        description: 'The rebuild is over (maybe). Jazz playoff push or another tank year? I\'m saying playoffs.',
        creator: CURRENT_USER,
        decider: paul,
        end_date: '2026-04-15T23:59:59Z',
        status: 'OPEN',
        winning_side: null,
        wagers: [
            { id: 'w24', user: CURRENT_USER, side: 'FOR', amount: 300, placed_at: '2026-01-01T10:00:00Z' },
            { id: 'w25', user: allison, side: 'AGAINST', amount: 250, placed_at: '2026-01-02T12:00:00Z' },
            { id: 'w26', user: sam, side: 'AGAINST', amount: 100, placed_at: '2026-01-03T08:00:00Z' },
        ],
    },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getBetsForGroup(groupId: string): Bet[] {
    return MOCK_BETS.filter((b) => b.group_id === groupId);
}

export function getBetById(betId: string): Bet | undefined {
    return MOCK_BETS.find((b) => b.id === betId);
}

export function getGroupById(groupId: string): Group | undefined {
    return MOCK_GROUPS.find((g) => g.id === groupId);
}
