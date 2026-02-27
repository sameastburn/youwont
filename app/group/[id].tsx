import { IconSymbol } from '@/components/ui/icon-symbol';
import { getBetsForGroup, getGroupById, getPoolInfo, type BetStatus } from '@/data/mock';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

type FilterOption = 'ALL' | BetStatus;

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

    const group = getGroupById(id);
    if (!group) return null;

    const allBets = getBetsForGroup(id);
    const filteredBets =
        activeFilter === 'ALL'
            ? allBets
            : allBets.filter((b) => b.status === activeFilter);

    const filters: { label: string; value: FilterOption }[] = [
        { label: 'All', value: 'ALL' },
        { label: 'Open', value: 'OPEN' },
        { label: 'Resolved', value: 'RESOLVED' },
        { label: 'Canceled', value: 'CANCELED' },
    ];

    const statusColors: Record<BetStatus, { bg: string; text: string; dot: string }> = {
        OPEN: { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' },
        RESOLVED: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
        CANCELED: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const avatarColors = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol size={20} name="chevron.left" color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {group.name}
                </Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <IconSymbol size={20} name="ellipsis" color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Group Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoCardIcon}>
                        <Text style={styles.infoCardIconText}>
                            {group.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.infoCardName}>{group.name}</Text>
                    <Text style={styles.infoCardDescription}>{group.description}</Text>

                    <View style={styles.infoStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{group.members.length}</Text>
                            <Text style={styles.statLabel}>Members</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {allBets.filter((b) => b.status === 'OPEN').length}
                            </Text>
                            <Text style={styles.statLabel}>Active Bets</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{allBets.length}</Text>
                            <Text style={styles.statLabel}>Total Bets</Text>
                        </View>
                    </View>

                    <View style={styles.inviteCodeRow}>
                        <IconSymbol size={14} name="link" color="#7c3aed" />
                        <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
                        <Text style={styles.inviteCode}>{group.invite_code}</Text>
                    </View>
                </View>

                {/* Members */}
                <Text style={styles.sectionTitle}>Members</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.membersRow}
                >
                    {group.members.map((member, index) => (
                        <View key={member.user.id} style={styles.memberItem}>
                            <View
                                style={[
                                    styles.memberAvatar,
                                    { backgroundColor: avatarColors[index % avatarColors.length] },
                                ]}
                            >
                                <Text style={styles.memberAvatarText}>
                                    {getInitials(member.user.name)}
                                </Text>
                            </View>
                            <Text style={styles.memberName} numberOfLines={1}>
                                {member.user.name === 'You' ? 'You' : member.user.name.split(' ')[0]}
                            </Text>
                            {member.role === 'ADMIN' && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminBadgeText}>Admin</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>

                {/* Bets Section */}
                <View style={styles.betsSectionHeader}>
                    <Text style={styles.sectionTitle}>Bets</Text>
                </View>

                {/* Filter Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                >
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.value}
                            style={[
                                styles.filterPill,
                                activeFilter === filter.value && styles.filterPillActive,
                            ]}
                            onPress={() => setActiveFilter(filter.value)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    activeFilter === filter.value && styles.filterTextActive,
                                ]}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Bet Cards */}
                {filteredBets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol size={40} name="tray" color="#cbd5e1" />
                        <Text style={styles.emptyStateText}>No bets match this filter</Text>
                    </View>
                ) : (
                    filteredBets.map((bet) => {
                        const pool = getPoolInfo(bet);
                        const forPercent =
                            pool.total > 0 ? (pool.forTotal / pool.total) * 100 : 50;
                        const sc = statusColors[bet.status];

                        return (
                            <TouchableOpacity
                                key={bet.id}
                                style={styles.betCard}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/bet/${bet.id}` as any)}
                            >
                                {/* Status & Pool */}
                                <View style={styles.betCardHeader}>
                                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                                        <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                                        <Text style={[styles.statusText, { color: sc.text }]}>
                                            {bet.status}
                                        </Text>
                                    </View>
                                    <Text style={styles.poolText}>{pool.total} pts</Text>
                                </View>

                                {/* Title & Description */}
                                <Text style={styles.betTitle}>{bet.title}</Text>
                                <Text style={styles.betDescription} numberOfLines={2}>
                                    {bet.description}
                                </Text>

                                {/* Pool Bar */}
                                <View style={styles.poolBarContainer}>
                                    <View style={styles.poolBarLabels}>
                                        <Text style={styles.poolBarFor}>
                                            FOR · {pool.forTotal} pts
                                        </Text>
                                        <Text style={styles.poolBarAgainst}>
                                            AGAINST · {pool.againstTotal} pts
                                        </Text>
                                    </View>
                                    <View style={styles.poolBar}>
                                        <View
                                            style={[
                                                styles.poolBarFor_fill,
                                                { width: `${forPercent}%` },
                                            ]}
                                        />
                                    </View>
                                </View>

                                {/* Footer */}
                                <View style={styles.betCardFooter}>
                                    <View style={styles.betMetaItem}>
                                        <IconSymbol size={13} name="person.2.fill" color="#94a3b8" />
                                        <Text style={styles.betMetaText}>
                                            {bet.wagers.length} wagers
                                        </Text>
                                    </View>
                                    <View style={styles.betMetaItem}>
                                        <IconSymbol size={13} name="clock" color="#94a3b8" />
                                        <Text style={styles.betMetaText}>
                                            {new Date(bet.end_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                <IconSymbol size={24} name="plus" color="#ffffff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        textAlign: 'center',
        marginHorizontal: 12,
    },
    settingsButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    // Info Card
    infoCard: {
        margin: 20,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    infoCardIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    infoCardIconText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
    },
    infoCardName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    infoCardDescription: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    infoStats: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
    },
    inviteCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f5f3ff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    inviteCodeLabel: {
        fontSize: 13,
        color: '#7c3aed',
        fontWeight: '500',
    },
    inviteCode: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7c3aed',
        letterSpacing: 1,
    },
    // Members
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        paddingHorizontal: 24,
        marginBottom: 14,
    },
    membersRow: {
        paddingHorizontal: 24,
        gap: 16,
        marginBottom: 28,
    },
    memberItem: {
        alignItems: 'center',
        width: 64,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    memberAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    memberName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
        textAlign: 'center',
    },
    adminBadge: {
        marginTop: 4,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    adminBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#d97706',
    },
    // Bets Section
    betsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
    },
    filterRow: {
        paddingHorizontal: 24,
        gap: 10,
        marginBottom: 20,
    },
    filterPill: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    filterPillActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    filterTextActive: {
        color: '#ffffff',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '500',
    },
    // Bet Cards
    betCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 24,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    betCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    poolText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#7c3aed',
    },
    betTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    betDescription: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 16,
    },
    // Pool Bar
    poolBarContainer: {
        marginBottom: 16,
    },
    poolBarLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    poolBarFor: {
        fontSize: 11,
        fontWeight: '600',
        color: '#16a34a',
    },
    poolBarAgainst: {
        fontSize: 11,
        fontWeight: '600',
        color: '#dc2626',
    },
    poolBar: {
        height: 6,
        backgroundColor: '#fee2e2',
        borderRadius: 3,
        overflow: 'hidden',
    },
    poolBarFor_fill: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 3,
    },
    // Footer
    betCardFooter: {
        flexDirection: 'row',
        gap: 16,
    },
    betMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    betMetaText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
});
