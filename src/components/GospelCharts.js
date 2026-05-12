import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CATEGORIES = [
  { label: 'Simple', color: '#26f7ff', key: 'simple', target: 300 },
  { label: 'Valid', color: '#26f7ff', key: 'valid', target: 50 },
  { label: 'Fruit', color: '#26f7ff', key: 'fruit', target: 50 },
  { label: 'EduLMS', color: '#A020F0', key: 'edulms', target: 50 },
  { label: 'Online Mission', color: '#2ecc71', key: 'online', target: 50 },
  { label: 'Prayer', color: '#ffffff', key: 'prayer', target: 50 },
  { label: 'Zion Activity', color: '#87CEEB', key: 'zion', target: 50 },
  { label: 'Sermon', color: '#FFFF00', key: 'sermon', target: 50 },
];

const DOT_COLORS = {
  preaching: '#26f7ff',
  edulms: '#A020F0',
  online: '#2ecc71',
  prayer: '#ffffff',
  zion: '#87CEEB',
  sermon: '#FFFF00',
};

export default function GospelCharts({ type }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState({});
  const [activityData, setActivityData] = useState({});

  const fetchZionData = async () => {
    try {
      // FULL SYNC: Kinukuha ang lahat ng data mula sa bawat form
      const [s, c, f, e, o, p, z, sm] = await Promise.all([
        AsyncStorage.getItem('@zion_simple_logs'),
        AsyncStorage.getItem('@zion_connection_logs'),
        AsyncStorage.getItem('@zion_fruit_logs'),
        AsyncStorage.getItem('@zion_edulms_logs'),
        AsyncStorage.getItem('@zion_online_logs'),
        AsyncStorage.getItem('@zion_prayer_logs'),
        AsyncStorage.getItem('@zion_activity_logs'), // Bago
        AsyncStorage.getItem('@zion_sermon_logs')    // Bago
      ]);

      const sLogs = s ? JSON.parse(s) : [];
      const cLogs = c ? JSON.parse(c) : [];
      const fLogs = f ? JSON.parse(f) : [];
      const eLogs = e ? JSON.parse(e) : [];
      const oLogs = o ? JSON.parse(o) : [];
      const pLogs = p ? JSON.parse(p) : [];
      const zLogs = z ? JSON.parse(z) : [];
      const smLogs = sm ? JSON.parse(sm) : [];

      // Pag-calculate ng Stats para sa Progress Bars
      setStats({
        simple: sLogs.reduce((acc, curr) => acc + (curr.total || 0), 0),
        valid: cLogs.filter(l => l.status === 'VALID').length,
        fruit: fLogs.length,
        edulms: eLogs.length,
        online: oLogs.length,
        prayer: pLogs.length,
        zion: zLogs.length, 
        sermon: smLogs.length
      });

      // Map para sa Dots sa Calendar
      const dotMap = {};

      const processDots = (logs, color) => {
        if (!logs) return;
        logs.forEach(log => {
          // Flexible date handling para sa webDate (M/D/YYYY)
          const logDate = new Date(log.date);
          if(logDate.getMonth() === currentDate.getMonth() && logDate.getFullYear() === currentDate.getFullYear()) {
            const day = logDate.getDate();
            if (!dotMap[day]) dotMap[day] = [];
            if (!dotMap[day].includes(color)) dotMap[day].push(color);
          }
        });
      };

      // I-assign ang bawat kulay sa tamang logs sa calendar
      processDots(sLogs, DOT_COLORS.preaching);
      processDots(cLogs, DOT_COLORS.preaching);
      processDots(fLogs, DOT_COLORS.preaching);
      processDots(eLogs, DOT_COLORS.edulms);
      processDots(oLogs, DOT_COLORS.online);
      processDots(pLogs, DOT_COLORS.prayer);
      processDots(zLogs, DOT_COLORS.zion);
      processDots(smLogs, DOT_COLORS.sermon);

      setActivityData(dotMap);
    } catch (e) { console.error("Sync Error:", e); }
  };

  useEffect(() => {
    fetchZionData();
    // 5 seconds interval para laging updated ang dashboard kahit kaka-submit lang ng form
    const interval = setInterval(fetchZionData, 5000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // --- RENDER WEEKLY MONITORING ---
  if (type === 'weekly') {
    return (
      <View style={styles.contentBody}>
        {CATEGORIES.map((cat) => {
          const val = stats[cat.key] || 0;
          const progress = Math.min((val / cat.target) * 100, 100);
          return (
            <View key={cat.key} style={styles.monitorRow}>
              <View style={styles.rowInfo}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catVal}>{val}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: cat.color }]} />
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // --- RENDER CALENDAR ---
  if (type === 'calendar') {
    return (
      <View style={styles.contentBody}>
        <View style={styles.calendarNavContainer}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <MaterialCommunityIcons name="chevron-left" color="#fff" size={20} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <MaterialCommunityIcons name="chevron-right" color="#fff" size={20} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarGrid}>
          {daysArray.map((day) => (
            <View key={day} style={styles.dayCell}>
              <Text style={styles.dayNumber}>{day}</Text>
              <View style={styles.dotWrap}>
                {(activityData[day] || []).map((color, idx) => (
                  <View key={idx} style={[styles.dot, { backgroundColor: color }]} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  contentBody: { paddingVertical: 10 },
  monitorRow: { marginBottom: 12 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  catLabel: { color: '#888', fontSize: 10, fontWeight: '600' },
  catVal: { color: '#fff', fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 3, backgroundColor: '#1A1D23', borderRadius: 2 },
  progressBar: { height: '100%', borderRadius: 2 },
  calendarNavContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  monthText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginHorizontal: 15, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 50, borderBottomWidth: 0.2, borderColor: '#222', padding: 2, alignItems: 'center' },
  dayNumber: { color: '#444', fontSize: 9, fontWeight: 'bold', marginBottom: 3 },
  dotWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 },
  dot: { width: 5, height: 5, borderRadius: 2.5 }
});