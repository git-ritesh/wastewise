import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ArrowLeft, MoreVertical } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../utils/constants';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await client.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.data.notifications);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifs();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.item, !item.isRead && styles.unread]}>
      <View style={styles.iconContainer}>
        <Bell size={20} color={!item.isRead ? COLORS.primary : COLORS.gray} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.backBtn}>
          <MoreVertical size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={60} color="#E2E8F0" />
            <Text style={styles.empty}>All caught up!</Text>
            <Text style={styles.emptySub}>No new notifications found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: COLORS.text },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  item: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  unread: { backgroundColor: '#F0FDF4' },
  iconContainer: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  content: { flex: 1 },
  title: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: COLORS.text, marginBottom: 4 },
  body: { fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.gray, lineHeight: 20 },
  time: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  empty: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#64748B', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 5 }
});

export default NotificationScreen;
