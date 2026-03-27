import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { useGroup } from '@/hooks/use-groups';
import { useBets } from '@/hooks/use-bets';
import { useSendInvite } from '@/hooks/use-invites';
import { useSearchUsers } from '@/hooks/use-user';
import type { BetSummary } from '@/api/types';
import { fullName, getInitials } from '@/lib/user';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type BetStatus = 'OPEN' | 'RESOLVED' | 'CANCELED';
type FilterOption = 'ALL' | BetStatus;

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
    const [showMenu, setShowMenu] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: group, isLoading: groupLoading, error: groupError, refetch: refetchGroup } = useGroup(id);
    const statusFilter = activeFilter === 'ALL' ? undefined : activeFilter;
    const { data: allBets } = useBets(id, statusFilter);
    const sendInvite = useSendInvite(id);
    const { data: searchResults } = useSearchUsers(searchQuery);

    if (groupLoading) return <LoadingState />;
    if (groupError) return <ErrorState message={groupError.message} onRetry={refetchGroup} />;
    if (!group) return null;

    const memberIds = new Set(group.members.map((m) => m.user_id));
    const filteredSearchResults = (searchResults ?? []).filter((u) => !memberIds.has(u.id));

    async function handleCopyCode() {
        await Clipboard.setStringAsync(group!.invite_code);
        setShowMenu(false);
        Alert.alert('Copied!', `Invite code "${group!.invite_code}" copied to clipboard`);
    }

    function handleSendInvite(userId: string) {
        sendInvite.mutate(userId, {
            onSuccess: () => {
                setShowInviteModal(false);
                setSearchQuery('');
                Alert.alert('Invite Sent!', 'They\'ll see it in their notifications.');
            },
            onError: (err) => Alert.alert('Error', err.message),
        });
    }

    const filteredBets = allBets ?? [];

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
                <TouchableOpacity style={styles.settingsButton} onPress={() => setShowMenu(true)}>
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
                            <Text style={styles.statValue}>{filteredBets.length}</Text>
                            <Text style={styles.statLabel}>Bets</Text>
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
                        <View key={member.user_id} style={styles.memberItem}>
                            <View
                                style={[
                                    styles.memberAvatar,
                                    { backgroundColor: avatarColors[index % avatarColors.length] },
                                ]}
                            >
                                <Text style={styles.memberAvatarText}>
                                    {getInitials(member)}
                                </Text>
                            </View>
                            <Text style={styles.memberName} numberOfLines={1}>
                                {member.first_name}
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
                    filteredBets.map((bet: BetSummary) => {
                        const pool = bet.pool;
                        const forPercent =
                            pool.total > 0 ? (pool.for_total / pool.total) * 100 : 50;
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
                                            FOR · {pool.for_total} pts
                                        </Text>
                                        <Text style={styles.poolBarAgainst}>
                                            AGAINST · {pool.against_total} pts
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
                                            {bet.wager_count} wagers
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
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => router.push(`/create-bet/${id}` as any)}
            >
                <IconSymbol size={24} name="plus" color="#ffffff" />
            </TouchableOpacity>
            {/* Menu Modal */}
            <Modal visible={showMenu} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View style={styles.menuContent}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMenu(false);
                                setShowInviteModal(true);
                            }}
                        >
                            <IconSymbol size={18} name="person.badge.plus" color="#7c3aed" />
                            <Text style={styles.menuItemText}>Invite Member</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={handleCopyCode}>
                            <IconSymbol size={18} name="doc.on.doc" color="#7c3aed" />
                            <Text style={styles.menuItemText}>Copy Invite Code</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Invite Member Modal */}
            <Modal visible={showInviteModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setShowInviteModal(false);
                        setSearchQuery('');
                    }}
                >
                    <View style={styles.inviteContent}>
                        <Text style={styles.inviteTitle}>Invite Member</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by username..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus
                        />
                        {filteredSearchResults.map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                style={styles.searchResultRow}
                                onPress={() => handleSendInvite(user.id)}
                                disabled={sendInvite.isPending}
                            >
                                <View style={styles.searchResultAvatar}>
                                    <Text style={styles.searchResultAvatarText}>
                                        {getInitials(user)}
                                    </Text>
                                </View>
                                <View style={styles.searchResultInfo}>
                                    <Text style={styles.searchResultName}>{fullName(user)}</Text>
                                    <Text style={styles.searchResultUsername}>@{user.username}</Text>
                                </View>
                                <IconSymbol size={16} name="plus.circle.fill" color="#7c3aed" />
                            </TouchableOpacity>
                        ))}
                        {searchQuery.length >= 2 && filteredSearchResults.length === 0 && (
                            <Text style={styles.noResultsText}>No users found</Text>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
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
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 8,
        width: '70%',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 16,
    },
    inviteContent: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxHeight: '60%',
    },
    inviteTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
    },
    searchInput: {
        height: 48,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
    },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    searchResultAvatar: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    searchResultAvatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    searchResultUsername: {
        fontSize: 13,
        color: '#94a3b8',
    },
    noResultsText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
        paddingVertical: 16,
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
