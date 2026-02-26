import { IconSymbol } from '@/components/ui/icon-symbol';
import { CURRENT_USER, MOCK_BETS, MOCK_GROUPS } from '@/data/mock';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error.message);
  };

  // Recent activity — settled bets the user was in
  const recentActivity = [
    {
      id: 'a1',
      title: 'Won "Sam won\'t hike the Y"',
      group: 'The Squad',
      amount: 150,
      type: 'win' as const,
      time: '2 hours ago',
    },
    {
      id: 'a2',
      title: 'Lost "Last one to Swig pays"',
      group: 'Work Rivals',
      amount: -25,
      type: 'loss' as const,
      time: '1 day ago',
    },
    {
      id: 'a3',
      title: 'Refund — "Creamery 5 days"',
      group: 'Work Rivals',
      amount: 40,
      type: 'refund' as const,
      time: '3 days ago',
    },
  ];

  const activityIcons: Record<string, { icon: string; color: string; bg: string }> = {
    win: { icon: 'trophy.fill', color: '#ffffff', bg: '#22c55e' },
    loss: { icon: 'arrow.down.right', color: '#ffffff', bg: '#ef4444' },
    refund: { icon: 'arrow.uturn.left', color: '#ffffff', bg: '#eab308' },
  };

  const openBetsCount = MOCK_BETS.filter((b) => b.status === 'OPEN').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>you<Text style={styles.greetingAccent}>wont</Text></Text>
            <Text style={styles.subGreeting}>Welcome back, User!</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <IconSymbol size={24} name="person.crop.circle" color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Point Balance</Text>
          <Text style={styles.cardAmount}>{CURRENT_USER.points.toLocaleString()} pts</Text>
          <View style={styles.cardRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{MOCK_GROUPS.length} groups · {openBetsCount} open bets</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/groups')}
          >
            <View style={styles.iconCircle}>
              <IconSymbol size={24} name="person.3.fill" color="#7c3aed" />
            </View>
            <Text style={styles.actionText}>My Groups</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconCircle, { backgroundColor: '#f5f3ff' }]}>
              <IconSymbol size={24} name="plus" color="#7c3aed" />
            </View>
            <Text style={styles.actionText}>New Bet</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {recentActivity.map((item) => {
          const config = activityIcons[item.type];
          return (
            <View key={item.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: config.bg }]}>
                <IconSymbol size={18} name={config.icon as any} color={config.color} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityDate}>{item.group} · {item.time}</Text>
              </View>
              <Text
                style={[
                  styles.activityAmount,
                  { color: item.amount >= 0 ? '#10b981' : '#ef4444' },
                ]}
              >
                {item.amount >= 0 ? '+' : ''}{item.amount} pts
              </Text>
            </View>
          );
        })}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    fontStyle: 'italic',
  },
  greetingAccent: {
    color: '#7c3aed',
    fontStyle: 'italic',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
  },
  profileButton: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  card: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardLabel: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  activityDate: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
});