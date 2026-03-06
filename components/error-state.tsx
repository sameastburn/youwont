import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    message: string;
    onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>!</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 24,
    },
    icon: {
        fontSize: 40,
        fontWeight: '700',
        color: '#ef4444',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#7c3aed',
        borderRadius: 12,
    },
    retryText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
