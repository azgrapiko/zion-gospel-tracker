import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configuration para sa hitsura ng notification habang bukas ang app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ACTIVITIES = [
  { id: 'preaching', label: 'Preaching', icon: 'bullhorn-variant', color: '#ff6b6b' },
  { id: 'sermon', label: 'Sermon', icon: 'book-open-page-variant', color: '#ffd43b' },
  { id: 'zion', label: 'Zion Activity', icon: 'office-building', color: '#339af0' },
  { id: 'edulms', label: 'EduLMS', icon: 'school', color: '#da77f2' },
  { id: 'online', label: 'Online Mission', icon: 'earth', color: '#51cf66' },
  { id: 'prayer', label: 'Prayer', icon: 'hands-pray', color: '#ffffff' },
];

export default function NotificationSetup() {
  const [settings, setSettings] = useState({});
  const [times, setTimes] = useState({});
  const notificationListener = useRef();

  useEffect(() => {
    loadSettings();
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notif Received:", notification);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove(); 
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('@notif_settings');
      const savedTimes = await AsyncStorage.getItem('@notif_times');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedTimes) setTimes(JSON.parse(savedTimes));
      else {
        let defaultTimes = {};
        ACTIVITIES.forEach(a => defaultTimes[a.id] = "20:00"); // Default 8 PM
        setTimes(defaultTimes);
      }
    } catch (e) { console.error("Load Settings Error:", e); }
  };

  // Helper function para sa 12-hour format display
  const formatTo12Hr = (timeStr) => {
    if (!timeStr) return "8:00 PM";
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const showSyncReminder = () => {
    if (Platform.OS === 'web') {
      console.log("System Notice: Pindutin ang SYNC & SCHEDULE button sa ibaba upang mag-activate ang bagong oras.");
    } else {
      Alert.alert(
        "System Paalala 📢", 
        "Huwag kalimutang pindutin ang 'SYNC & SCHEDULE NOTIFICATIONS' button sa ibaba upang mag-activate ang bagong setup sa iyong system."
      );
    }
  };

  // --- SCHEDULING ENGINE ---
  const scheduleAllNotifications = async () => {
    // Pag-check kung nasa real device o browser interface simulation
    if (!Device.isDevice && Platform.OS !== 'web') {
      Alert.alert('Zion System', 'Physical device ang kailangan para sa actual push internal background tasks.');
      return;
    }

    try {
      // 1. I-clear ang lahat ng lumang schedules
      if (Platform.OS !== 'web') {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      // 2. I-schedule ang bawat "ON" na activity
      const keys = Object.keys(settings);
      let count = 0;

      for (const id of keys) {
        if (settings[id]) {
          const activity = ACTIVITIES.find(a => a.id === id);
          const [hour, minute] = (times[id] || "20:00").split(':').map(Number);

          if (Platform.OS !== 'web') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Zion Reminder: ${activity.label} 📢`,
                body: `Kapatid, huwag kalimutang i-update ang iyong ${activity.label} activity para sa araw na ito!`,
                data: { screen: 'Gospel' },
                sound: true,
              },
              trigger: {
                hour: hour,
                minute: minute,
                repeats: true,
              },
            });
          }
          count++;
        }
      }

      // Cross-platform dialogue window deployment (Gumagana na sa Mobile at Web Interface View)
      const successTitle = "Success ✨";
      const successMessage = `Nai-set at matagumpay na na-sync ang iyong ${count} Smart Reminders ayon sa pinili mong oras.`;

      if (Platform.OS === 'web') {
        window.alert(`${successTitle}\n\n${successMessage}`);
      } else {
        Alert.alert(successTitle, successMessage);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert("System Error: Hindi ma-sync ang notifications. Pakisubukang muli.");
      } else {
        Alert.alert("System Error", "Hindi ma-sync ang notifications. Pakisubukang muli.");
      }
    }
  };

  const toggleSwitch = async (id) => {
    const newValue = !settings[id];
    const newSettings = { ...settings, [id]: newValue };
    setSettings(newSettings);
    await AsyncStorage.setItem('@notif_settings', JSON.stringify(newSettings));
    
    showSyncReminder(); // Nagpapakita na ng paalala sa tuwing binabago ang switch state
  };

  const handleTimePress = (id) => {
    const current = times[id] || "20:00";
    const msg = `Format: HH:MM (24-hour style)\nNgayon: ${formatTo12Hr(current)}\n\nHalimbawa:\n08:00 (8 AM)\n20:00 (8 PM)`;
    
    if (Platform.OS === 'web') {
      const newTime = window.prompt(msg, current);
      if (newTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) {
        updateTime(id, newTime);
      } else if (newTime) {
        window.alert("Maling format! Gamitin ang tamang HH:MM rules (e.g. 07:30)");
      }
    } else {
      Alert.prompt(
        "I-set ang Oras (24-Hour)",
        msg,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Save", 
            onPress: (val) => {
              if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(val)) updateTime(id, val);
              else Alert.alert("Error", "Maling format (HH:MM). Halimbawa: 19:30");
            } 
          }
        ],
        "plain-text",
        current
      );
    }
  };

  const updateTime = async (id, newTime) => {
    const newTimes = { ...times, [id]: newTime };
    setTimes(newTimes);
    await AsyncStorage.setItem('@notif_times', JSON.stringify(newTimes));
    showSyncReminder(); // Trigger feedback alert card tuwing magbabago ang oras
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="bell-ring" size={24} color="#26f7ff" />
        <Text style={styles.sectionTitle}>DAILY SMART NOTIFICATION</Text>
      </View>
      
      <Text style={styles.description}>
        I-schedule ang iyong reminders para sa bawat activity. Siguraduhing naka-ON ang switch para ma-sync ang oras.
      </Text>

      <View style={styles.listContainer}>
        {ACTIVITIES.map((act) => (
          <View key={act.id} style={styles.notifRow}>
            <View style={styles.leftGroup}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons 
                  name={act.icon} 
                  size={24} 
                  color={settings[act.id] ? act.color : "#8a8f9e"} 
                />
              </View>
              <View style={styles.labelGroup}>
                <Text style={[styles.actLabel, settings[act.id] && styles.activeLabel]}>
                  {act.label}
                </Text>
                {settings[act.id] && (
                  <TouchableOpacity onPress={() => handleTimePress(act.id)} activeOpacity={0.6}>
                    <Text style={styles.timeLink}>Remind at: {formatTo12Hr(times[act.id])}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Switch
              trackColor={{ false: "#232329", true: "rgba(38, 247, 255, 0.4)" }}
              thumbColor={settings[act.id] ? "#26f7ff" : "#8a8f9e"}
              onValueChange={() => toggleSwitch(act.id)}
              value={settings[act.id] || false}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.syncBtn} onPress={scheduleAllNotifications} activeOpacity={0.8}>
        <Text style={styles.syncText}>SYNC & SCHEDULE NOTIFICATIONS</Text>
      </TouchableOpacity>
    </View>
  );
}

// Helper function para sa Permissions engine verification
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#26f7ff',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  }
}

const styles = StyleSheet.create({
  // Premium Material Dark (High Contrast Base Layer Settings)
  container: { 
    backgroundColor: '#121214', 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#2c303b', 
    marginBottom: 20, 
    width: '100%', 
    alignSelf: 'center' 
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#26f7ff', fontSize: 13, fontWeight: '900', marginLeft: 12, letterSpacing: 1.5 },
  description: { color: '#a2a8b6', fontSize: 12, lineHeight: 18, marginBottom: 20, fontWeight: '500' },
  listContainer: { marginBottom: 10 },
  
  notifRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1e2026' 
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 30, alignItems: 'center', justifyContent: 'center' },
  labelGroup: { marginLeft: 12, flex: 1 },
  
  actLabel: { color: '#8a8f9e', fontSize: 15, fontWeight: '700' },
  activeLabel: { color: '#ffffff', fontWeight: '900' },
  timeLink: { color: '#26f7ff', fontSize: 12, marginTop: 5, fontWeight: '900', textDecorationLine: 'underline' },
  
  syncBtn: { 
    backgroundColor: '#26f7ff', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#26f7ff',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  syncText: { color: '#000000', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});