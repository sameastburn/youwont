import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { useGroups, useJoinByCode } from '@/hooks/use-groups';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function GroupsScreen() {
    const router = useRouter();
    const { data: groups, isLoading, error, refetch } = useGroups();
    const joinByCode = useJoinByCode();
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    function handleJoin() {
        if (!inviteCode.trim()) return;
        joinByCode.mutate(inviteCode.trim(), {
            onSuccess: (group) => {
                setShowJoinModal(false);
                setInviteCode('');
                router.push(`/group/${group.id}` as any);
            },
            onError: (err) => Alert.alert('Error', err.message),
        });
    }

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error.message} onRetry={refetch} />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>My Groups</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/create-group' as any)}
                >
                    <IconSymbol size={22} name="plus" color="#ffffff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {(!groups || groups.length === 0) ? (
                    <EmptyState
                        message="No groups yet. Create one or join with an invite code!"
                        actionLabel="Create Group"
                        onAction={() => router.push('/create-group' as any)}
                    />
                ) : (
                    groups.map((group) => (
                        <TouchableOpacity
                            key={group.id}
                            style={styles.groupCard}
                            activeOpacity={0.7}
                            onPress={() => router.push(`/group/${group.id}` as any)}
                        >
                            <View style={styles.groupIconContainer}>
                                <Text style={styles.groupIconText}>
                                    {group.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.groupInfo}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                <Text style={styles.groupDescription} numberOfLines={1}>
                                    {group.description}
                                </Text>
                                <View style={styles.groupMeta}>
                                    <View style={styles.metaItem}>
                                        <IconSymbol size={14} name="person.2.fill" color="#94a3b8" />
                                        <Text style={styles.metaText}>
                                            {group.members.length} members
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <IconSymbol size={16} name="chevron.right" color="#cbd5e1" />
                        </TouchableOpacity>
                    ))
                )}

                <TouchableOpacity
                    style={styles.joinCard}
                    activeOpacity={0.7}
                    onPress={() => setShowJoinModal(true)}
                >
                    <View style={styles.joinIconContainer}>
                        <IconSymbol size={24} name="link" color="#7c3aed" />
                    </View>
                    <View style={styles.groupInfo}>
                        <Text style={styles.joinTitle}>Join a Group</Text>
                        <Text style={styles.joinSubtitle}>
                            Enter an invite code to join friends
                        </Text>
                    </View>
                    <IconSymbol size={16} name="chevron.right" color="#cbd5e1" />
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={showJoinModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowJoinModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Join a Group</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter invite code"
                            placeholderTextColor="#94a3b8"
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            autoCapitalize="characters"
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleJoin}
                            disabled={joinByCode.isPending}
                        >
                            <Text style={styles.modalButtonText}>
                                {joinByCode.isPending ? 'Joining...' : 'Join'}
                            </Text>
                        </TouchableOpacity>
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
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    groupIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    groupIconText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 2,
    },
    groupDescription: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 8,
    },
    groupMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    joinCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    joinIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#f5f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    joinTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#7c3aed',
        marginBottom: 2,
    },
    joinSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        width: '85%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
    },
    modalInput: {
        height: 50,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        color: '#0f172a',
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 16,
    },
    modalButton: {
        height: 48,
        backgroundColor: '#7c3aed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
