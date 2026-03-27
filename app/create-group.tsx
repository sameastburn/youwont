import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCreateGroup } from '@/hooks/use-groups';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateGroupScreen() {
    const router = useRouter();
    const createGroup = useCreateGroup();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    function handleSubmit() {
        if (!name.trim()) {
            Alert.alert('Error', 'Group name is required');
            return;
        }
        createGroup.mutate(
            { name: name.trim(), description: description.trim() },
            {
                onSuccess: (group) => {
                    router.replace(`/group/${group.id}` as any);
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
                <Text style={styles.headerTitle}>Create Group</Text>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Group Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. The Squad"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Description (optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What's this group about?"
                            placeholderTextColor="#94a3b8"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={createGroup.isPending}
                    >
                        <Text style={styles.submitButtonText}>
                            {createGroup.isPending ? 'Creating...' : 'Create Group'}
                        </Text>
                    </TouchableOpacity>
                </View>
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
