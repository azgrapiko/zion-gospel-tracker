import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase'; 

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

  // --- SYNC LOGIC PARA SA RANKING CARD ---
  const syncToSupabase = async (newStats) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) return;

      // Kalkulahin ang percentages base sa targets (Simple, Valid, Fruit para sa Preach)
      const preachScore = ((newStats.simple / 300) + (newStats.valid / 50) + (newStats.fruit / 50)) / 3 * 100;
      
      // Kalkulahin ang Activity percentage mula sa iba pang categories
      const activityScore = ((newStats.edulms + newStats.online + newStats.prayer + newStats.zion + newStats.sermon) / (50 * 5)) * 100;

      const { error } = await supabase
        .from('profiles')
        .update({
          preach_pct: Math.min(Math.round(preachScore), 100),
          activity_pct: Math.min(Math.round(activityScore), 100),
          last_updated: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) console.error("Supabase Sync Error:", error.message);
      else console.log("✅ Cloud Sync Success");
    } catch (err) {
      console.error("Cloud Sync Error:", err);
    }
  };

  const fetchZionData = async () => {
    try {
      // FULL SYNC: Kinukuha ang lahat ng data mula sa bawat form sa AsyncStorage
      const [s, c, f, e, o, p, z, sm] = await Promise.all([
        AsyncStorage.getItem('@zion_simple_logs'),
        AsyncStorage.getItem('@zion_connection_logs'),
        AsyncStorage.getItem('@zion_fruit_logs'),
        AsyncStorage.getItem('@zion_edulms_logs'),
        AsyncStorage.getItem('@zion_online_logs'),
        AsyncStorage.getItem('@zion_prayer_logs'),
        AsyncStorage.getItem('@zion_activity_logs'),
        AsyncStorage.getItem('@zion_sermon_logs')
      ]);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // HELPER ENGINE: Selyadong filter block para i-isolate ang logs sa kasalukuyang buwan lamang
      const filterThisMonthLogs = (rawJson) => {
        if (!rawJson) return [];
        const parsed = JSON.parse(rawJson);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(log => {
          if (!log.date) return false;
          const d = new Date(log.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
      };

      const sLogs = filterThisMonthLogs(s);
      const cLogs = filterThisMonthLogs(c);
      const fLogs = filterThisMonthLogs(f);
      const eLogs = filterThisMonthLogs(e);
      const oLogs = filterThisMonthLogs(o);
      const pLogs = filterThisMonthLogs(p);
      const zLogs = filterThisMonthLogs(z);
      const smLogs = filterThisMonthLogs(sm);

      // Pag-calculate ng Stats para sa Progress Bars batay sa na-isolate na buwan
      const calculatedStats = {
        simple: sLogs.reduce((acc, curr) => acc + (curr.total || 0), 0),
        valid: cLogs.filter(l => l.status === 'VALID').length,
        fruit: fLogs.length,
        edulms: eLogs.length,
        online: oLogs.length,
        prayer: pLogs.length,
        zion: zLogs.length, 
        sermon: smLogs.length
      };

      setStats(calculatedStats);

      // I-trigger ang sync sa Supabase para mag-update ang Ranking Card
      syncToSupabase(calculatedStats);

      // Map para sa Dots sa Calendar view
      const dotMap = {};

      const processDots = (logs, color) => {
        if (!logs) return;
        logs.forEach(log => {
          const logDate = new Date(log.date);
          if(logDate.getMonth() === currentDate.getMonth() && logDate.getFullYear() === currentDate.getFullYear()) {
            const day = logDate.getDate();
            if (!dotMap[day]) dotMap[day] = [];
            if (!dotMap[day].includes(color)) dotMap[day].push(color);
          }
        });
      };

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
    // 5 seconds interval para laging updated ang dashboard
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
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" color="#ffffff" size={24} />
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
  monitorRow: { marginBottom: 14 }, 
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel: { 
    color: '#ffffff', 
    fontSize: 12,     
    fontWeight: '900' 
  },
  catVal: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: '900' 
  },
  progressTrack: { 
    height: 6, 
    backgroundColor: '#1c1c21', 
    borderRadius: 3 
  },
  progressBar: { 
    height: '100%', 
    borderRadius: 3 
  },
  calendarNavContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15,
    paddingHorizontal: 10
  },
  navBtn: {
    padding: 6,
    backgroundColor: '#18181c', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232329'
  },
  monthText: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: '900', 
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    borderWidth: 1, 
    borderColor: '#2d313d' 
  },
  dayCell: { 
    width: '14.28%', 
    height: 58, 
    borderWidth: 0.5, 
    borderColor: '#232329', 
    padding: 3, 
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#121214' 
  },
  dayNumber: { 
    color: '#ffffff', 
    fontSize: 12,     
    fontWeight: '900', 
    marginBottom: 4 
  },
  dotWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 2,
    maxWidth: '100%'
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3 
  }
});