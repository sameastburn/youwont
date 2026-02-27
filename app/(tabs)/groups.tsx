import { IconSymbol } from '@/components/ui/icon-symbol';
import { MOCK_GROUPS, getBetsForGroup } from '@/data/mock';
import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function GroupsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>My Groups</Text>
                <TouchableOpacity style={styles.addButton}>
                    <IconSymbol size={22} name="plus" color="#ffffff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {MOCK_GROUPS.map((group) => {
                    const bets = getBetsForGroup(group.id);
                    const openBets = bets.filter((b) => b.status === 'OPEN').length;

                    return (
                        <TouchableOpacity
                            key={group.id}
                            style={styles.groupCard}
                            activeOpacity={0.7}
                            onPress={() => router.push(`/group/${group.id}` as any)}
                        >
                            {/* Group Icon */}
                            <View style={styles.groupIconContainer}>
                                <Text style={styles.groupIconText}>
                                    {group.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            {/* Group Info */}
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
                                    {openBets > 0 && (
                                        <View style={styles.openBetsBadge}>
                                            <Text style={styles.openBetsText}>
                                                {openBets} open
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Arrow */}
                            <IconSymbol size={16} name="chevron.right" color="#cbd5e1" />
                        </TouchableOpacity>
                    );
                })}

                {/* Join Group Card */}
                <TouchableOpacity style={styles.joinCard} activeOpacity={0.7}>
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
    openBetsBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    openBetsText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#16a34a',
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
});
