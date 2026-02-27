import { IconSymbol } from '@/components/ui/icon-symbol';
import { CURRENT_USER, getBetById, getPoolInfo, type BetSide, type BetStatus } from '@/data/mock';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BetDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const bet = getBetById(id);
    if (!bet) return null;

    const pool = getPoolInfo(bet);
    const forPercent = pool.total > 0 ? (pool.forTotal / pool.total) * 100 : 50;
    const isDecider = bet.decider.id === CURRENT_USER.id;
    const hasWagered = bet.wagers.some((w) => w.user.id === CURRENT_USER.id);

    const statusColors: Record<BetStatus, { bg: string; text: string; dot: string }> = {
        OPEN: { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' },
        RESOLVED: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
        CANCELED: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
    };

    const sideColors: Record<BetSide, { bg: string; text: string }> = {
        FOR: { bg: '#f0fdf4', text: '#16a34a' },
        AGAINST: { bg: '#fef2f2', text: '#dc2626' },
    };

    const sc = statusColors[bet.status];

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const avatarColors = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol size={20} name="chevron.left" color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bet Details</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status & Title */}
                <View style={styles.topSection}>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                        <Text style={[styles.statusText, { color: sc.text }]}>{bet.status}</Text>
                    </View>

                    {bet.status === 'RESOLVED' && bet.winning_side && (
                        <View style={styles.winnerBadge}>
                            <IconSymbol size={14} name="trophy.fill" color="#d97706" />
                            <Text style={styles.winnerText}>{bet.winning_side} wins!</Text>
                        </View>
                    )}

                    <Text style={styles.betTitle}>{bet.title}</Text>
                    <Text style={styles.betDescription}>{bet.description}</Text>
                </View>

                {/* Pool Breakdown Card */}
                <View style={styles.poolCard}>
                    <Text style={styles.poolCardTitle}>Pool Breakdown</Text>

                    <View style={styles.poolTotalRow}>
                        <Text style={styles.poolTotalLabel}>Total Pool</Text>
                        <Text style={styles.poolTotalValue}>{pool.total} pts</Text>
                    </View>

                    {/* Visual Bar */}
                    <View style={styles.poolBarContainer}>
                        <View style={styles.poolBar}>
                            <View style={[styles.poolBarForFill, { width: `${forPercent}%` }]} />
                        </View>
                        <View style={styles.poolBarLabels}>
                            <View style={styles.poolSideInfo}>
                                <View style={[styles.sideIndicator, { backgroundColor: '#22c55e' }]} />
                                <Text style={styles.poolSideLabel}>FOR</Text>
                                <Text style={styles.poolSideValue}>{pool.forTotal} pts</Text>
                                <Text style={styles.poolSideCount}>({pool.forCount})</Text>
                            </View>
                            <View style={styles.poolSideInfo}>
                                <View style={[styles.sideIndicator, { backgroundColor: '#ef4444' }]} />
                                <Text style={styles.poolSideLabel}>AGAINST</Text>
                                <Text style={styles.poolSideValue}>{pool.againstTotal} pts</Text>
                                <Text style={styles.poolSideCount}>({pool.againstCount})</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <IconSymbol size={16} name="person.fill" color="#7c3aed" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Created by</Text>
                            <Text style={styles.detailValue}>{bet.creator.name}</Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <IconSymbol size={16} name="star.fill" color="#d97706" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Decider</Text>
                            <Text style={styles.detailValue}>{bet.decider.name}</Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <IconSymbol size={16} name="clock" color="#2563eb" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>End Date</Text>
                            <Text style={styles.detailValue}>
                                {new Date(bet.end_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Wagers */}
                <Text style={styles.sectionTitle}>
                    Wagers ({bet.wagers.length})
                </Text>

                {bet.wagers.map((wager, index) => {
                    const sideSc = sideColors[wager.side];
                    return (
                        <View key={wager.id} style={styles.wagerCard}>
                            <View
                                style={[
                                    styles.wagerAvatar,
                                    { backgroundColor: avatarColors[index % avatarColors.length] },
                                ]}
                            >
                                <Text style={styles.wagerAvatarText}>
                                    {getInitials(wager.user.name)}
                                </Text>
                            </View>
                            <View style={styles.wagerInfo}>
                                <Text style={styles.wagerName}>
                                    {wager.user.id === CURRENT_USER.id ? 'You' : wager.user.name}
                                </Text>
                                <Text style={styles.wagerDate}>
                                    {new Date(wager.placed_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Text>
                            </View>
                            <View style={[styles.wagerSideBadge, { backgroundColor: sideSc.bg }]}>
                                <Text style={[styles.wagerSideText, { color: sideSc.text }]}>
                                    {wager.side}
                                </Text>
                            </View>
                            <Text style={styles.wagerAmount}>{wager.amount} pts</Text>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Bottom Actions */}
            {bet.status === 'OPEN' && (
                <View style={styles.bottomActions}>
                    {!hasWagered && (
                        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
                            <Text style={styles.primaryButtonText}>Place a Wager</Text>
                        </TouchableOpacity>
                    )}
                    {isDecider && (
                        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
                            <Text style={styles.secondaryButtonText}>Resolve Bet</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
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
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    // Top Section
    topSection: {
        marginBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 6,
        marginBottom: 12,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    winnerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 6,
        marginBottom: 12,
    },
    winnerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#d97706',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    betTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    betDescription: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
    },
    // Pool Card
    poolCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    poolCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 14,
    },
    poolTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    poolTotalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    poolTotalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#7c3aed',
    },
    poolBarContainer: {
        gap: 10,
    },
    poolBar: {
        height: 10,
        backgroundColor: '#fee2e2',
        borderRadius: 5,
        overflow: 'hidden',
    },
    poolBarForFill: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 5,
    },
    poolBarLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    poolSideInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    sideIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    poolSideLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    poolSideValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    poolSideCount: {
        fontSize: 11,
        color: '#94a3b8',
    },
    // Details Card
    detailsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 4,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
        marginTop: 1,
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    // Wagers
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 14,
    },
    wagerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    wagerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    wagerAvatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
    wagerInfo: {
        flex: 1,
    },
    wagerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    wagerDate: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 1,
    },
    wagerSideBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    wagerSideText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    wagerAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
    // Bottom Actions
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 36,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#7c3aed',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#f5f3ff',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9d5ff',
    },
    secondaryButtonText: {
        color: '#7c3aed',
        fontSize: 16,
        fontWeight: '700',
    },
});
