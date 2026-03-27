import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingState } from '@/components/loading-state';
import { useGroup } from '@/hooks/use-groups';
import { useCreateBet } from '@/hooks/use-bets';
import { useMe } from '@/hooks/use-user';
import { fullName } from '@/lib/user';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type BetSide = 'FOR' | 'AGAINST';

export default function CreateBetScreen() {
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    const router = useRouter();
    const { data: group, isLoading } = useGroup(groupId);
    const { data: me } = useMe();
    const createBet = useCreateBet(groupId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deciderId, setDeciderId] = useState('');
    const [endDate, setEndDate] = useState('');
    const [wagerSide, setWagerSide] = useState<BetSide>('FOR');
    const [wagerAmount, setWagerAmount] = useState('');

    if (isLoading) return <LoadingState />;

    const members = group?.members ?? [];
    const otherMembers = members.filter((m) => m.user_id !== me?.id);

    function handleSubmit() {
        if (!title.trim()) {
            Alert.alert('Error', 'Title is required');
            return;
        }
        if (!deciderId) {
            Alert.alert('Error', 'Select a decider');
            return;
        }
        const amount = parseInt(wagerAmount, 10);
        if (!amount || amount <= 0) {
            Alert.alert('Error', 'Enter a valid wager amount');
            return;
        }
        if (me && amount > me.points) {
            Alert.alert('Error', 'Insufficient points');
            return;
        }

        // Default end date to 7 days from now if not provided
        let parsedEnd = endDate.trim();
        if (!parsedEnd) {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            parsedEnd = d.toISOString();
        } else {
            // Try to parse the user input as a date
            const d = new Date(parsedEnd);
            if (isNaN(d.getTime())) {
                Alert.alert('Error', 'Invalid date format');
                return;
            }
            parsedEnd = d.toISOString();
        }

        createBet.mutate(
            {
                title: title.trim(),
                description: description.trim(),
                decider_id: deciderId,
                end_date: parsedEnd,
                opening_wager: { side: wagerSide, amount },
            },
            {
                onSuccess: (bet) => {
                    router.replace(`/bet/${bet.id}` as any);
                },
                onError: (err) => Alert.alert('Error', err.message),
            },
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol size={20} name="chevron.left" color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Bet</Text>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView contentContainerStyle={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Sam won't hike the Y"
                            placeholderTextColor="#94a3b8"
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Description (optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="More details about the bet..."
                            placeholderTextColor="#94a3b8"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Decider</Text>
                        <Text style={styles.inputHint}>Who will determine the outcome?</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
                            {otherMembers.map((member) => (
                                <TouchableOpacity
                                    key={member.user_id}
                                    style={[
                                        styles.memberChip,
                                        deciderId === member.user_id && styles.memberChipActive,
                                    ]}
                                    onPress={() => setDeciderId(member.user_id)}
                                >
                                    <Text
                                        style={[
                                            styles.memberChipText,
                                            deciderId === member.user_id && styles.memberChipTextActive,
                                        ]}
                                    >
                                        {fullName(member)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>End Date (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD (default: 7 days)"
                            placeholderTextColor="#94a3b8"
                            value={endDate}
                            onChangeText={setEndDate}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Your Opening Wager</Text>
                        <View style={styles.sideToggle}>
                            <TouchableOpacity
                                style={[
                                    styles.sideOption,
                                    wagerSide === 'FOR' && styles.sideOptionActiveFor,
                                ]}
                                onPress={() => setWagerSide('FOR')}
                            >
                                <Text
                                    style={[
                                        styles.sideOptionText,
                                        wagerSide === 'FOR' && styles.sideOptionTextActiveFor,
                                    ]}
                                >
                                    FOR
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.sideOption,
                                    wagerSide === 'AGAINST' && styles.sideOptionActiveAgainst,
                                ]}
                                onPress={() => setWagerSide('AGAINST')}
                            >
                                <Text
                                    style={[
                                        styles.sideOptionText,
                                        wagerSide === 'AGAINST' && styles.sideOptionTextActiveAgainst,
                                    ]}
                                >
                                    AGAINST
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter points"
                            placeholderTextColor="#94a3b8"
                            value={wagerAmount}
                            onChangeText={setWagerAmount}
                            keyboardType="number-pad"
                        />
                        {me && (
                            <Text style={styles.balanceText}>Balance: {me.points} pts</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={createBet.isPending}
                    >
                        <Text style={styles.submitButtonText}>
                            {createBet.isPending ? 'Creating...' : 'Create Bet'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
    content: {
        flex: 1,
    },
    form: {
        padding: 24,
        paddingBottom: 100,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    inputHint: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 10,
    },
    input: {
        height: 50,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    textArea: {
        height: 100,
        paddingTop: 14,
    },
    memberScroll: {
        flexDirection: 'row',
    },
    memberChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        marginRight: 10,
    },
    memberChipActive: {
        borderColor: '#7c3aed',
        backgroundColor: '#f5f3ff',
    },
    memberChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    memberChipTextActive: {
        color: '#7c3aed',
    },
    sideToggle: {
        flexDirection: 'row',
        gap: 10,
    },
    sideOption: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    sideOptionActiveFor: {
        backgroundColor: '#f0fdf4',
        borderColor: '#22c55e',
    },
    sideOptionActiveAgainst: {
        backgroundColor: '#fef2f2',
        borderColor: '#ef4444',
    },
    sideOptionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
    },
    sideOptionTextActiveFor: {
        color: '#16a34a',
    },
    sideOptionTextActiveAgainst: {
        color: '#dc2626',
    },
    balanceText: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 6,
    },
    submitButton: {
        height: 52,
        backgroundColor: '#7c3aed',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
