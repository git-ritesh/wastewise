import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, TrendingUp, TrendingDown } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../utils/constants';

const RewardScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await client.get('/rewards/history');
        if (res.data.success) {
          setHistory(res.data.data.history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: item.amount > 0 ? '#F0FDF4' : '#FEF2F2' }]}>
        {item.amount > 0 ? <TrendingUp size={20} color="#10B981" /> : <TrendingDown size={20} color="#EF4444" />}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.points, { color: item.amount > 0 ? '#10B981' : '#EF4444' }]}>
        {item.amount > 0 ? '+' : ''}{item.amount}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summaryCard}>
        <Award size={40} color="#fff" />
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryValue}>
            {history.reduce((acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0), 0)} pts
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>No transactions yet</Text>
              <Text style={styles.emptySub}>Your reward history will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: COLORS.text },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { margin: 20, backgroundColor: COLORS.primary, padding: 25, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 20, elevation: 8, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 15 },
  summaryInfo: { flex: 1 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Inter_400Regular' },
  summaryValue: { color: '#fff', fontSize: 28, fontFamily: 'Outfit_700Bold' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  desc: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: COLORS.text },
  date: { color: '#94A3B8', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  points: { fontSize: 18, fontFamily: 'Outfit_700Bold' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  empty: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#64748B' },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 5 }
});

export default RewardScreen;
