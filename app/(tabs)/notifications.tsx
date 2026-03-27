import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import { useAcceptInvite, useDeclineInvite } from '@/hooks/use-invites';
import { useRouter } from 'expo-router';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NotificationsScreen() {
    const router = useRouter();
    const { data, isLoading, error, refetch } = useNotifications();
    const markRead = useMarkRead();
    const markAllRead = useMarkAllRead();
    const acceptInvite = useAcceptInvite();
    const declineInvite = useDeclineInvite();

    const notifications = data?.notifications ?? [];

    const notifIcons: Record<string, { icon: string; bg: string }> = {
        bet_resolved: { icon: 'trophy.fill', bg: '#22c55e' },
        bet_created: { icon: 'plus.circle.fill', bg: '#7c3aed' },
        wager_placed: { icon: 'arrow.right.circle.fill', bg: '#2563eb' },
        invite_received: { icon: 'envelope.fill', bg: '#0891b2' },
        invite_accepted: { icon: 'checkmark.circle.fill', bg: '#22c55e' },
        group_joined: { icon: 'person.badge.plus', bg: '#059669' },
    };

    const defaultIcon = { icon: 'bell.fill', bg: '#94a3b8' };

    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    function handleTap(notif: typeof notifications[0]) {
        if (!notif.read) {
            markRead.mutate(notif.id);
        }
        if (notif.ref_type === 'bet') {
            router.push(`/bet/${notif.ref_id}` as any);
        } else if (notif.ref_type === 'group') {
            router.push(`/group/${notif.ref_id}` as any);
        }
    }

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error.message} onRetry={refetch} />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={() => markAllRead.mutate()}>
                        <Text style={styles.markAllText}>Mark All Read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {notifications.length === 0 ? (
                <EmptyState message="No notifications yet" />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const config = notifIcons[item.type] ?? defaultIcon;
                        const isInvite = item.ref_type === 'invite' && item.type === 'invite_received';
                        return (
                            <TouchableOpacity
                                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                                activeOpacity={isInvite ? 1 : 0.7}
                                onPress={() => !isInvite && handleTap(item)}
                            >
                                <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                                    <IconSymbol size={18} name={config.icon as any} color="#ffffff" />
                                </View>
                                <View style={styles.notifInfo}>
                                    <Text style={styles.notifMessage}>{item.message}</Text>
                                    <Text style={styles.notifTime}>{formatTime(item.created_at)}</Text>
                                    {isInvite && !item.read && (
                                        <View style={styles.inviteActions}>
                                            <TouchableOpacity
                                                style={styles.acceptButton}
                                                onPress={() => {
                                                    acceptInvite.mutate(item.ref_id, {
                                                        onSuccess: () => {
                                                            markRead.mutate(item.id);
                                                        },
                                                        onError: (err) => Alert.alert('Error', err.message),
                                                    });
                                                }}
                                                disabled={acceptInvite.isPending}
                                            >
                                                <Text style={styles.acceptButtonText}>Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.declineButton}
                                                onPress={() => {
                                                    declineInvite.mutate(item.ref_id, {
                                                        onSuccess: () => {
                                                            markRead.mutate(item.id);
                                                        },
                                                        onError: (err) => Alert.alert('Error', err.message),
                                                    });
                                                }}
                                                disabled={declineInvite.isPending}
                                            >
                                                <Text style={styles.declineButtonText}>Decline</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                                {!item.read && !isInvite && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
    },
    markAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7c3aed',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    notifCardUnread: {
        backgroundColor: '#faf5ff',
        borderColor: '#e9d5ff',
    },
    notifIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    notifInfo: {
        flex: 1,
    },
    notifMessage: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 2,
    },
    notifTime: {
        fontSize: 12,
        color: '#94a3b8',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#7c3aed',
        marginLeft: 8,
    },
    inviteActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    acceptButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#22c55e',
        borderRadius: 10,
    },
    acceptButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    declineButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
    },
    declineButtonText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '700',
    },
});
