import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- TAMANG SUPABASE PATH BATAY SA IYONG DIRECTORY ---
import { supabase } from '../../utils/supabase';

// MGA KATEGORYA PARA SA EDUCATION_TYPE COLUMN
const EDUCATION_TASKS = [
  { id: 'gathering', label: 'Gathering in Zion (Meeting, Online, Sabbath Sch.)' },
  { id: 'edu_new', label: 'Education for New Member' },
  { id: 'edu_regular', label: 'Education for Regular Member' },
  { id: 'edu_evangelist', label: 'Education for Evangelist' },
  { id: 'edu_other', label: 'Other Education' },
];

// MGA KATEGORYA PARA SA ACTIVITY_TYPE COLUMN
const GENERAL_TASKS = [
  { id: 'visiting', label: 'Visiting & Study members' },
  { id: 'carrying', label: 'Carrying Children' },
  { id: 'food', label: 'Food Preparation' },
  { id: 'cleaning', label: 'Cleaning in Zion (Temple, Kitchen, Washing)' },
  { id: 'construction', label: 'Construction in Zion (Repair, Paint, Electric)' },
];

export default function ZionActivity() {
  const [selectedEducation, setSelectedEducation] = useState([]);
  const [selectedGeneral, setSelectedGeneral] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Web-Compatible Date Initialization Formatter
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getTodayString());

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await AsyncStorage.getItem('@zion_activity_logs');
      if (data) setLogs(JSON.parse(data));
    } catch (e) { 
      console.error("Load Error:", e); 
    }
  };

  const toggleEducationTask = (taskId) => {
    if (selectedEducation.includes(taskId)) {
      setSelectedEducation(selectedEducation.filter(id => id !== taskId));
    } else {
      setSelectedEducation([...selectedEducation, taskId]);
    }
  };

  const toggleGeneralTask = (taskId) => {
    if (selectedGeneral.includes(taskId)) {
      setSelectedGeneral(selectedGeneral.filter(id => id !== taskId));
    } else {
      setSelectedGeneral([...selectedGeneral, taskId]);
    }
  };

  const handleSave = async () => {
    if (selectedEducation.length === 0 && selectedGeneral.length === 0) {
      const taskMsg = "Pumili ng kahit isang aktibidad mula sa Edukasyon o Pangkalahatang Gawain.";
      Platform.OS === 'web' ? window.alert(taskMsg) : Alert.alert("Pansin", taskMsg);
      return;
    }

    setLoading(true);

    // Kuhanin ang labels para sa Local Storage display at breakdown string
    const eduLabels = EDUCATION_TASKS.filter(t => selectedEducation.includes(t.id)).map(t => t.label);
    const genLabels = GENERAL_TASKS.filter(t => selectedGeneral.includes(t.id)).map(t => t.label);
    
    // I-resolve ang mga tiyak na isusumite sa database columns
    const dbEducationType = EDUCATION_TASKS.find(t => t.id === selectedEducation[0])?.label || null;
    const dbActivityType = GENERAL_TASKS.find(t => t.id === selectedGeneral[0])?.label || null;

    const allPicked = [...eduLabels, ...genLabels].join(', ');
    const localId = String(Date.now());

    const newLog = {
      id: localId,
      type: 'ZionActivity',
      date: date,
      activities: allPicked,
      timestamp: new Date().toISOString()
    };

    try {
      if (supabase) {
        // 1. KUNIN ANG ACTIVE USER SESSION DIRECTLY FROM SUPABASE AUTH
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData?.user) {
          throw new Error("Walang aktibong session ng user. Mangyaring mag-login muna.");
        }

        const currentUser = authData.user;

        // 2. KUNIN ANG USER METADATA O PROFILE PARA SA MULTI-TENANCY TRACING
        // Sumasangguni sa 'profiles' table gamit ang ID ng user para sa full_name at zion_code
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, zion_code')
          .eq('id', currentUser.id)
          .single();

        // Fallback strategy kung sakaling nasa user_metadata ng Auth direct nakalagay ang properties
        const resolvedName = profile?.full_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.user_name || 'Zion Member';
        const resolvedZion = profile?.zion_code || currentUser.user_metadata?.zion_code || 'PLA';

        // 3. ENHANCED DATA PAYLOAD WITH SECURE TENANCY KEYS
        const payload = {
          log_date: date,
          education_type: dbEducationType, 
          activity_type: dbActivityType,   
          preaching_type: 'Zion', 
          breakdown: allPicked, 
          total: selectedEducation.length + selectedGeneral.length,
          full_name: resolvedName,   // Awtomatikong pinunan mula sa session trace
          zion_code: resolvedZion    // Awtomatikong pinunan para sa data isolation
        };

        const res = await supabase.from('gospel_activity').insert([payload]).select();
        if (res?.data && res.data[0]) {
          newLog.id = res.data[0].id;
        }
        if (res?.error) {
          console.error("Supabase Insertion Error:", res.error.message);
        }
      }
    } catch (dbErr) {
      console.warn("Database Sync Trace Failed:", dbErr.message || dbErr);
    }

    try {
      const existing = await AsyncStorage.getItem('@zion_activity_logs');
      const currentLogs = existing ? JSON.parse(existing) : [];
      const updatedLogs = [newLog, ...currentLogs];
      
      await AsyncStorage.setItem('@zion_activity_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      
      const successMsg = "Many Blessing Today, Good Job po😊";
      Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert("ZION ACTIVITY", successMsg);
      
      // Reset State Management
      setSelectedEducation([]);
      setSelectedGeneral([]);
      setLoading(false);
    } catch (e) {
      console.error("Save Error:", e);
      setLoading(false);
    }
  };

  const deleteLog = async (id) => {
    try {
      if (supabase && id.length > 10) {
        await supabase.from('gospel_activity').delete().eq('id', id);
      }
    } catch (e) {
      console.warn("Database Delete Skip:", e);
    }

    const filtered = logs.filter(l => l.id !== id);
    await AsyncStorage.setItem('@zion_activity_logs', JSON.stringify(filtered));
    setLogs(filtered);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>ZION ACTIVITY</Text>

      <Text style={styles.label}>DATE FIELD</Text>
      <View style={styles.inputBoxWrapper}>
        {Platform.OS === 'web' ? (
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            style={styles.webDate} 
          />
        ) : (
          <View style={styles.nativeDateContainer}>
            <TextInput 
              style={styles.inputText}
              value={date}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8a8f9e"
              onChangeText={setDate}
            />
            <MaterialCommunityIcons name="calendar-star" size={22} color="#26f7ff" />
          </View>
        )}
      </View>

      {/* GRUPO 1: EDUCATION TYPE COLUMN TARGET */}
      <Text style={styles.labelSection}>📖 EDUCATION TYPE ACTIVITIES</Text>
      {EDUCATION_TASKS.map((task) => (
        <TouchableOpacity 
          key={task.id} 
          style={[styles.checkRow, selectedEducation.includes(task.id) && styles.checkRowActive]} 
          onPress={() => toggleEducationTask(task.id)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={selectedEducation.includes(task.id) ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={20} 
            color={selectedEducation.includes(task.id) ? "#26f7ff" : "#515764"} 
          />
          <Text style={[styles.checkText, selectedEducation.includes(task.id) && styles.checkTextActive]}>
            {task.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* GRUPO 2: ACTIVITY TYPE COLUMN TARGET */}
      <Text style={[styles.labelSection, { marginTop: 10 }]}>🏛️ GENERAL ZION ACTIVITIES</Text>
      {GENERAL_TASKS.map((task) => (
        <TouchableOpacity 
          key={task.id} 
          style={[styles.checkRow, selectedGeneral.includes(task.id) && styles.checkRowActive]} 
          onPress={() => toggleGeneralTask(task.id)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={selectedGeneral.includes(task.id) ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={20} 
            color={selectedGeneral.includes(task.id) ? "#26f7ff" : "#515764"} 
          />
          <Text style={[styles.checkText, selectedGeneral.includes(task.id) && styles.checkTextActive]}>
            {task.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.submitText}>{loading ? "SYNCING..." : "SUBMIT LOG TO SUPABASE"}</Text>
      </TouchableOpacity>

      {/* --- TABLE LOGS SECTION WITHOUT NAME FOR A CLEANER UX --- */}
      <View style={styles.logsSection}>
        <Text style={styles.logHeaderLabel}>ZION ACTIVITY LOGS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 0.8 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 2.2 }]}>Activities</Text>
          <Text style={[styles.hCell, { width: 30, textAlign: 'right' }]}>ACT</Text>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={[styles.rCell, { flex: 2.2, color: '#ffffff', fontWeight: '500' }]} numberOfLines={2}>{item.activities}</Text>
                <View style={{ width: 30, alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => deleteLog(item.id)}>
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#ff4d4d" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#050505' },
  
  // OPTIMIZED HIGH CONTRAST DARK UI DESIGN WITH SMALLER GAPS
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 15, letterSpacing: 2, textTransform: 'uppercase', textShadowColor: 'rgba(38, 247, 255, 0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  label: { color: '#26f7ff', fontSize: 10, fontWeight: '900', marginBottom: 6, letterSpacing: 1.2, textTransform: 'uppercase' },
  labelSection: { color: '#ffffff', fontSize: 11, fontWeight: '900', marginTop: 6, marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase', borderLeftWidth: 3, borderLeftColor: '#26f7ff', paddingLeft: 6 },
  
  inputBoxWrapper: { marginBottom: 12 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#111115', padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#26f7ff'
  },
  inputText: { color: '#ffffff', fontSize: 13, flex: 1, fontWeight: '600' },
  webDate: { 
    backgroundColor: '#111115', color: '#ffffff', border: '1px solid #26f7ff', 
    padding: '10px', borderRadius: '8px', width: '60%', fontSize: '13px', 
    fontFamily: 'inherit', outline: 'none', fontWeight: '600'
  },

  checkRow: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 5, 
    backgroundColor: '#0c0c0e', padding: 11, borderRadius: 8,
    borderWidth: 1, borderColor: '#1f2128'
  },
  checkRowActive: { borderColor: '#26f7ff', backgroundColor: '#11151a' },
  checkText: { color: '#727885', marginLeft: 10, fontSize: 12, fontWeight: '600' },
  checkTextActive: { color: '#ffffff', fontWeight: '900' },
  
  submitBtn: { 
    backgroundColor: '#111115', padding: 14, borderRadius: 10, alignItems: 'center',
    marginTop: 15, marginBottom: 20, borderWidth: 1, borderColor: '#26f7ff',
    shadowColor: '#26f7ff', shadowOpacity: 0.1, shadowRadius: 10
  },
  submitText: { color: '#26f7ff', fontWeight: '900', letterSpacing: 1.2, fontSize: 12 },
  
  // HIGH CONTRAST COMPACT UI FOR TABLES
  logsSection: { marginTop: 10, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#1a1a22', paddingTop: 15 },
  logHeaderLabel: { color: '#ffffff', fontSize: 13, fontWeight: '900', marginBottom: 10, letterSpacing: 0.8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#111115', padding: 10, borderRadius: 6, borderBottomWidth: 1, borderBottomColor: '#26f7ff' },
  hCell: { color: '#727885', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }, 
  listWrapper: { maxHeight: 200 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#111115', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 11, flex: 0.8, fontWeight: '600' }
});