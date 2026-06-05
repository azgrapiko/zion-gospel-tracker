import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// --- TAMANG SUPABASE PATH BATAY SA IYONG DIRECTORY ---
import { supabase } from '../../utils/supabase';

export default function OnlineMission() {
  const [selectedContent, setSelectedContent] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Web-Compatible Date Initialization Formatter (YYYY-MM-DD for standard calendar field sync)
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // State holds the custom chosen calendar date modified by the user
  const [date, setDate] = useState(getTodayString());

  useEffect(() => { 
    loadLogs(); 
  }, []);

  const loadLogs = async () => {
    try {
      const data = await AsyncStorage.getItem('@zion_online_logs');
      if (data) setLogs(JSON.parse(data));
    } catch (e) {
      console.error("Load Error:", e);
    }
  };

  const handleSave = async () => {
    if (!selectedContent) {
      const reqMsg = "Pumili ng Content No.";
      Platform.OS === 'web' ? window.alert(reqMsg) : Alert.alert("Error", reqMsg);
      return;
    }
    
    setLoading(true);
    const markStatus = isCompleted ? "COMPLETED" : "PARTIAL";
    const localId = String(Date.now());

    const newLog = {
      id: localId,
      date: date, // Dynamic user-selected interactive date
      content: selectedContent,
      mark: markStatus,
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
          online_content: selectedContent,
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
      const updatedLogs = [newLog, ...logs];
      await AsyncStorage.setItem('@zion_online_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      
      const successMsg = "Value Tracker Saved, Good Job po today😊";
      Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert("ONLINE MISSION", successMsg);
      
      // Reset fields (keeping current date selection state intact for continuous entries)
      setSelectedContent('');
      setIsCompleted(false);
      setLoading(false);
    } catch (e) {
      console.error("Save Error:", e);
      setLoading(false);
    }
  };

  // NEW PIPELINE: Delete handler mechanism to purge item from AsyncStorage and Supabase
  const deleteLog = async (id) => {
    try {
      if (supabase && id.length > 10) {
        await supabase.from('gospel_activity').delete().eq('id', id);
      }
    } catch (e) {
      console.warn("Database Delete Skip:", e);
    }

    try {
      const filtered = logs.filter(l => l.id !== id);
      await AsyncStorage.setItem('@zion_online_logs', JSON.stringify(filtered));
      setLogs(filtered);
    } catch (e) {
      console.error("Delete Error:", e);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>ONLINE MISSION</Text>

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
            <MaterialCommunityIcons name="calendar-check" size={20} color="#2ecc71" />
          </View>
        )}
      </View>

      <Text style={styles.label}>ONLINE CONTENT (TITLE)</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={selectedContent}
          onValueChange={(v) => setSelectedContent(v)}
          style={styles.picker}
          dropdownIconColor="#2ecc71"
        >
          <Picker.Item label="Select Content No." value="" color="#8a8f9e" />
          {[...Array(10)].map((_, i) => (
            <Picker.Item 
              key={i} 
              label={`Content ${i + 1}`} 
              value={`Content ${i + 1}`} 
              color={Platform.OS === 'web' ? '#0c0c0c' : '#0e0d0d'} 
              style={styles.pickerItemBackend}
            />
          ))}
        </Picker>
      </View>

      {/* Switch Status Section */}
      <View style={styles.switchRow}>
        <Text style={[styles.statusText, { color: isCompleted ? '#8a8f9e' : '#2ecc71' }]}>Partial</Text>
        <Switch
          value={isCompleted}
          onValueChange={setIsCompleted}
          trackColor={{ false: '#232329', true: 'rgba(46, 204, 113, 0.4)' }}
          thumbColor={isCompleted ? '#2ecc71' : '#8a8f9e'}
        />
        <Text style={[styles.statusText, { color: isCompleted ? '#2ecc71' : '#8a8f9e' }]}>Completed</Text>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.submitText}>{loading ? "SYNCING..." : "SUBMIT LOG"}</Text>
      </TouchableOpacity>

      {/* --- TABLE LOGS WITH SCROLL LIMIT --- */}
      <View style={styles.logsContainer}>
        <Text style={styles.logTitle}>ONLINE MISSION TABLE LOGS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 1 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 1 }]}>Content No</Text>
          <Text style={[styles.hCell, { flex: 1 }]}>Mark</Text>
          <Text style={[styles.hCell, { width: 40, textAlign: 'right' }]}>ACT</Text>
        </View>
        
        {/* ScrollView for the list to handle more than 5 logs */}
        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={[styles.rCell, { color: '#ffffff', fontWeight: '500' }]}>{item.content}</Text>
                <Text style={[styles.rCell, { color: item.mark === 'COMPLETED' ? '#2ecc71' : '#f1c40f', fontWeight: '900' }]}>
                  {item.mark}
                </Text>
                {/* 🗑️ UPDATED PIPELINE: Changed pencil to interactive DELETE trash icon */}
                <View style={{ width: 40, alignItems: 'flex-end' }}>
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
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 15, letterSpacing: 2 },
  label: { color: '#2ecc71', fontSize: 11, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
  
  // Custom High Contrast Calendar Input Layouts
  inputBoxWrapper: { marginBottom: 12 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#4ef09c', fontSize: 13, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#50e98d', border: '1px solid #3feb6a', 
    padding: '10px', borderRadius: '8px', width: '60%', fontSize: '13px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  pickerWrap: { 
    backgroundColor: '#121214', 
    borderRadius: 8, marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c303b'
  },
  picker: { color: '#121111', height: 45 },
  pickerItemBackend: { backgroundColor: '#121214', color: '#ffffff' },

  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 10, backgroundColor: '#18181c', padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#232329'
  },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  submitBtn: { backgroundColor: '#2ecc71', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  submitText: { color: '#000000', fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  
  // High Contrast Table Layout Config
  logsContainer: { marginTop: 10, paddingBottom: 40 },
  logTitle: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 10, letterSpacing: 0.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#18181c', padding: 8, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, 
  listWrapper: { maxHeight: 200 }, 
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 10, flex: 1, fontWeight: '500' }
});