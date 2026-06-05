import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// --- TAMANG SUPABASE PATH BATAY SA IYONG DIRECTORY ---
import { supabase } from '../../utils/supabase';

const COURSES = [
  { id: 'nms', label: 'New Member School (NMS)', steps: 12 },
  { id: 'm1', label: 'Member I', steps: 12 },
  { id: 'm2', label: 'Member II', steps: 12 },
  { id: 'se', label: 'Student Evangelist', steps: 11 },
  { id: 'e1', label: 'Evangelist I', steps: 12 },
  { id: 'e2', label: 'Evangelist II', steps: 18 },
  { id: 'de', label: 'Deacon(ess)', steps: 12 },
];

export default function EduLms({ onClose }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Web-Compatible Date Initialization Formatter (YYYY-MM-DD for standard calendar field parsing)
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // State holds the custom chosen date modified by the user
  const [date, setDate] = useState(getTodayString());

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await AsyncStorage.getItem('@zion_edulms_logs');
      if (data) setLogs(JSON.parse(data));
    } catch (e) { 
      console.error("Load Error:", e); 
    }
  };

  const getStepOptions = () => {
    const course = COURSES.find(c => c.label === selectedCourse);
    if (!course) return [];
    return Array.from({ length: course.steps }, (_, i) => `Step ${i + 1}`);
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedStep) {
      const reqMsg = "Paki-pili ang Course at Step.";
      Platform.OS === 'web' ? window.alert(reqMsg) : Alert.alert("Required", reqMsg);
      return;
    }

    setLoading(true);

    const markStatus = isCompleted ? 'Completed' : 'Partial';
    const courseMarkString = `${selectedCourse} - ${selectedStep}`;
    const localId = String(Date.now());

    const newLog = {
      id: localId,
      type: 'EduLMS',
      course: selectedCourse,
      step: selectedStep,
      status: markStatus,
      date: date, // Active user-selected calendar date value
      timestamp: new Date().toISOString(),
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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, zion_code')
          .eq('id', currentUser.id)
          .single();

        const resolvedName = profile?.full_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.user_name || 'Zion Member';
        const resolvedZion = profile?.zion_code || currentUser.user_metadata?.zion_code || 'PLA';

        // 3. TARGET DATA PAYLOAD PARA SA MGA EXACT COLUMNS NI SUPABASE
        const payload = {
          log_date: date,
          full_name: resolvedName,
          zion_code: resolvedZion,
          lms_course: courseMarkString,
          mark: markStatus
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
      const existing = await AsyncStorage.getItem('@zion_edulms_logs');
      const currentLogs = existing ? JSON.parse(existing) : [];
      const updatedLogs = [newLog, ...currentLogs];
      
      await AsyncStorage.setItem('@zion_edulms_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs); // Update UI table agad
      
      const successMsg = "Wow, Good Job po today😊";
      Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert("EDULMS", successMsg);
      
      // Reset inputs at loading indicators
      setSelectedCourse('');
      setSelectedStep('');
      setIsCompleted(false);
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
    await AsyncStorage.setItem('@zion_edulms_logs', JSON.stringify(filtered));
    setLogs(filtered);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>EDULMS</Text>

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
            <MaterialCommunityIcons name="calendar-month" size={20} color="#26f7ff" />
          </View>
        )}
      </View>

      <Text style={styles.label}>ONLINE COURSES (TITLE)</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCourse}
          onValueChange={(val) => {
            setSelectedCourse(val);
            setSelectedStep('');
          }}
          style={styles.picker}
          dropdownIconColor="#26f7ff"
          mode="dropdown"
        >
          <Picker.Item label="Select Course" value="" color="#8a8f9e" />
          {COURSES.map(c => (
            <Picker.Item key={c.id} label={c.label} value={c.label} color={Platform.OS === 'web' ? '#141212' : '#0d0c0c'} style={styles.pickerItemBackend} /> 
          ))}
        </Picker>
      </View>

      {selectedCourse !== '' && (
        <>
          <Text style={styles.label}>SELECT STEPS NUMBER</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedStep}
              onValueChange={(val) => setSelectedStep(val)}
              style={styles.picker}
              dropdownIconColor="#26f7ff"
            >
              <Picker.Item label="Select Step" value="" color="#8a8f9e" />
              {getStepOptions().map(step => (
                <Picker.Item key={step} label={step} value={step} color={Platform.OS === 'web' ? '#0b0b0b' : '#0a0a0a'} style={styles.pickerItemBackend} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={[styles.statusText, { color: isCompleted ? '#8a8f9e' : '#c701c7' }]}>Partial</Text>
        <Switch
          value={isCompleted}
          onValueChange={setIsCompleted}
          trackColor={{ false: '#232329', true: 'rgba(38, 247, 255, 0.4)' }}
          thumbColor={isCompleted ? '#a524e1' : '#8a8f9e'}
        />
        <Text style={[styles.statusText, { color: isCompleted ? '#2ecc71' : '#8a8f9e' }]}>Completed</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? "SYNCING..." : "SUBMIT LOG"}</Text>
      </TouchableOpacity>

      {/* --- TABLE LOGS SECTION --- */}
      <View style={styles.logsSection}>
        <Text style={styles.logHeaderLabel}>EDULMS TABLE LOGS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 1 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 1.5 }]}>Course</Text>
          <Text style={[styles.hCell, { flex: 1 }]}>Mark</Text>
          <Text style={[styles.hCell, { width: 40, textAlign: 'right' }]}>ACT</Text>
        </View>

        {logs.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.rCell}>{item.date}</Text>
            <Text style={[styles.rCell, { flex: 1.5, color: '#ffffff', fontWeight: '500' }]} numberOfLines={1}>
              {item.course} {item.step ? `- ${item.step}` : ''}
            </Text>
            <Text style={[styles.rCell, { color: item.status === 'Completed' ? '#ca12d4' : '#26f7ff', fontWeight: '900' }]}>
              {item.status}
            </Text>
            <View style={{ width: 40, alignItems: 'flex-end' }}>
              <TouchableOpacity onPress={() => deleteLog(item.id)}>
                <MaterialCommunityIcons name="delete-outline" size={18} color="#ff4d4d" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#050505' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 15, letterSpacing: 2 },
  label: { color: '#d504e8', fontSize: 11, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
  
  // Custom High Contrast Selection Pickers
  inputBoxWrapper: { marginBottom: 12 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#ffffff', fontSize: 13, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#fc2cd2', border: '1px solid #df20c6', 
    padding: '10px', borderRadius: '8px', width: '60%', fontSize: '13px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  pickerContainer: { 
    backgroundColor: '#121214', 
    borderRadius: 8, marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c303b'
  },
  picker: { color: '#0f0e0e', height: 45 },
  pickerItemBackend: { backgroundColor: '#121214', color: '#ffffff' },

  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 10, backgroundColor: '#18181c', padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#232329'
  },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBtn: { 
    backgroundColor: '#830896', padding: 14, borderRadius: 10, alignItems: 'center',
    shadowColor: '#b40aa8', shadowOpacity: 0.2, shadowRadius: 10
  },
  saveBtnText: { color: '#fffbfb', fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  
  // High Contrast Table Logs Section Styles - Compact Layout spacing optimized
  logsSection: { marginTop: 20, paddingBottom: 40 },
  logHeaderLabel: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 10, letterSpacing: 0.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#18181c', padding: 8, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, 
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 10, flex: 1, fontWeight: '500' }
});