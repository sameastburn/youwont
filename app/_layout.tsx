import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useSession } from '../ctx';
import { useColorScheme } from '../hooks/use-color-scheme';

function RootLayoutNav() {
    const { session, isLoading } = useSession();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [session, isLoading, segments]);

    if (isLoading) {
        return null;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
                name="group/[id]"
                options={{
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="bet/[id]"
                options={{
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="modal"
                options={{
                    presentation: 'modal',
                }}
            />
        </Stack>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
                <RootLayoutNav />
            </AuthProvider>
        </ThemeProvider>
    );
}