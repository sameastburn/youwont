import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    View,
    TextInput,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateUser } from '@/hooks/use-user';

export default function CreateProfile() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const createUser = useCreateUser();
    const router = useRouter();

    function handleSubmit() {
        if (!firstName.trim()) {
            Alert.alert('Error', 'First name is required');
            return;
        }
        if (!username.trim()) {
            Alert.alert('Error', 'Username is required');
            return;
        }
        createUser.mutate(
            { first_name: firstName.trim(), last_name: lastName.trim(), username: username.trim().toLowerCase() },
            {
                onError: (err) => {
                    Alert.alert('Error', err.message);
                },
            },
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.contentContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Create Your Profile</Text>
                    <Text style={styles.headerSubtitle}>Pick a name and username to get started.</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setFirstName}
                        value={firstName}
                        placeholder="John"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setLastName}
                        value={lastName}
                        placeholder="Doe"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setUsername}
                        value={username}
                        placeholder="yourname"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleSubmit}
                    disabled={createUser.isPending}
                >
                    <Text style={styles.primaryButtonText}>
                        {createUser.isPending ? 'Creating...' : 'Get Started'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.skipButton]}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    headerContainer: {
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        height: 50,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    button: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: '#7c3aed',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        backgroundColor: 'transparent',
    },
    skipButtonText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
});
