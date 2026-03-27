import { IconSymbol } from '@/components/ui/icon-symbol';
import { useMe } from '@/hooks/use-user';
import { fullName, getInitials } from '@/lib/user';
import { useRouter } from 'expo-router';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
    const router = useRouter();
    const { data: me } = useMe();

    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) console.error(error.message);
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {me ? getInitials(me) : '?'}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{me ? fullName(me) : 'User'}</Text>
                        <Text style={styles.profileUsername}>@{me?.username ?? 'unknown'}</Text>
                    </View>
                </View>

                {/* Account Section */}
                <Text style={styles.sectionLabel}>Account</Text>
                <View style={styles.sectionCard}>
                    <View style={styles.row}>
                        <View style={[styles.rowIcon, { backgroundColor: '#f0fdf4' }]}>
                            <IconSymbol size={16} name="star.fill" color="#22c55e" />
                        </View>
                        <Text style={styles.rowLabel}>Points</Text>
                        <Text style={styles.rowValue}>{(me?.points ?? 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={[styles.rowIcon, { backgroundColor: '#eff6ff' }]}>
                            <IconSymbol size={16} name="calendar" color="#2563eb" />
                        </View>
                        <Text style={styles.rowLabel}>Joined</Text>
                        <Text style={styles.rowValue}>
                            {me?.created_at
                                ? new Date(me.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                  })
                                : '—'}
                        </Text>
                    </View>
                </View>

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <IconSymbol size={18} name="rectangle.portrait.and.arrow.right" color="#dc2626" />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>youwont v1.0.0</Text>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
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
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 2,
    },
    profileUsername: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    sectionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rowLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    rowValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 16,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: '#fef2f2',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    signOutText: {
        color: '#dc2626',
        fontWeight: '600',
        fontSize: 16,
    },
    versionText: {
        textAlign: 'center',
        color: '#cbd5e1',
        fontSize: 12,
        marginTop: 24,
    },
});
