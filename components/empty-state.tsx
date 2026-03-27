import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.message}>{message}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
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
    message: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 20,
    },
    actionButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#7c3aed',
        borderRadius: 12,
    },
    actionText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
