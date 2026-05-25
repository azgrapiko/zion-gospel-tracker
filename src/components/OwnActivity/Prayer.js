import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function Prayer() {
  const [unity, setUnity] = useState(false);
  const [letter, setLetter] = useState(false);
  const [time, setTime] = useState('Early Morning');
  const [logs, setLogs] = useState([]);

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
      const data = await AsyncStorage.getItem('@zion_prayer_logs');
      if (data) setLogs(JSON.parse(data));
    } catch (e) {
      console.error("Load Error:", e);
    }
  };

  const handleSave = async () => {
    // Kinukuha ang mga napiling tasks para sa Table View
    let tasks = [];
    if (unity) tasks.push("Unity");
    if (letter) tasks.push("Letter");
    
    if (tasks.length === 0) return Alert.alert("Pansin", "Pumili ng kahit isang Prayer Task.");

    const newLog = {
      id: Date.now().toString(),
      date: date, // Active chosen interactive date field saved
      time: time,
      taskDisplay: tasks.join(', '),
      timestamp: new Date().toISOString()
    };

    try {
      const updated = [newLog, ...logs];
      await AsyncStorage.setItem('@zion_prayer_logs', JSON.stringify(updated));
      setLogs(updated);
      
      Alert.alert("PRAYER", "Pagpalain ka ng Diyos sa iyong Pasasalamat 😊");
      
      // Reset UI (keeping chosen date configuration state intact for continuous multi-logging preferences)
      setUnity(false);
      setLetter(false);
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  const deleteLog = async (id) => {
    const filtered = logs.filter(l => l.id !== id);
    await AsyncStorage.setItem('@zion_prayer_logs', JSON.stringify(filtered));
    setLogs(filtered);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>PRAYER</Text>

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
            <MaterialCommunityIcons name="hands-pray" size={20} color="#26f7ff" />
          </View>
        )}
      </View>

      <Text style={styles.label}>SELECT PRAYER TASKS</Text>
      <TouchableOpacity 
        style={[styles.checkRow, unity && styles.checkRowActive]} 
        onPress={() => setUnity(!unity)} 
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={unity ? "checkbox-marked" : "checkbox-blank-outline"} 
          size={24} 
          color="#26f7ff" 
        />
        <Text style={[styles.checkText, unity && styles.checkTextActive]}>Unity Prayer</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.checkRow, letter && styles.checkRowActive]} 
        onPress={() => setLetter(!letter)} 
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={letter ? "checkbox-marked" : "checkbox-blank-outline"} 
          size={24} 
          color="#26f7ff" 
        />
        <Text style={[styles.checkText, letter && styles.checkTextActive]}>Letter to Heavenly Mother</Text>
      </TouchableOpacity>

      <Text style={styles.label}>TIME SCHEDULE</Text>
      <View style={styles.pickerWrap}>
        <Picker 
          selectedValue={time} 
          onValueChange={(v) => setTime(v)} 
          style={styles.picker}
          dropdownIconColor="#26f7ff"
        >
          <Picker.Item label="Early Morning" value="Early Morning" color={Platform.OS === 'web' ? '#0a0a0a' : '#090909'} style={styles.pickerItemBackend} />
          <Picker.Item label="Morning" value="Morning" color={Platform.OS === 'web' ? '#0a0a0a' : '#0b0b0b'} style={styles.pickerItemBackend} />
          <Picker.Item label="Afternoon" value="Afternoon" color={Platform.OS === 'web' ? '#0a0909' : '#0b0b0b'} style={styles.pickerItemBackend} />
          <Picker.Item label="Evening" value="Evening" color={Platform.OS === 'web' ? '#0c0b0b' : '#0c0c0c'} style={styles.pickerItemBackend} />
        </Picker>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
        <Text style={styles.submitText}>SUBMIT LOG</Text>
      </TouchableOpacity>

      {/* --- PRAYER HISTORY TABLE --- */}
      <View style={styles.logsSection}>
        <Text style={styles.logHeaderLabel}>PRAYER HISTORY</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 1 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 1.2 }]}>Prayer Task</Text>
          <Text style={[styles.hCell, { flex: 1 }]}>Time Comp.</Text>
          <Text style={[styles.hCell, { width: 30, textAlign: 'right' }]}>ACT</Text>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((log) => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{log.date}</Text>
                <Text style={[styles.rCell, { flex: 1.2, color: '#ffffff', fontWeight: '500' }]} numberOfLines={1}>{log.taskDisplay}</Text>
                <Text style={[styles.rCell, { color: '#26f7ff', fontWeight: '900' }]}>{log.time}</Text>
                <View style={{ width: 30, alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => deleteLog(log.id)}>
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
  container: { padding: 20, backgroundColor: '#050505' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  label: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  
  // Custom High Contrast Interactive Date Field Config
  inputBoxWrapper: { marginBottom: 15 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#30edf3', fontSize: 14, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#4afcff', border: '1px solid #49e5e0', 
    padding: '12px', borderRadius: '8px', width: '50%', fontSize: '14px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  checkRow: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, 
    backgroundColor: '#121214', padding: 15, borderRadius: 10,
    borderWidth: 1, borderColor: '#2c303b'
  },
  checkRowActive: { borderColor: '#26f7ff', backgroundColor: '#18181c' },
  checkText: { color: '#8a8f9e', marginLeft: 12, fontSize: 13, fontWeight: '500' },
  checkTextActive: { color: '#ffffff', fontWeight: '900' },

  pickerWrap: { 
    backgroundColor: '#121214', 
    borderRadius: 8, marginBottom: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c303b'
  },
  picker: { color: '#0d0c0c', height: 50 },
  pickerItemBackend: { backgroundColor: '#121214', color: '#ffffff' },

  submitBtn: { 
    backgroundColor: '#26f7ff', padding: 16, borderRadius: 10, 
    alignItems: 'center', marginBottom: 30, shadowColor: '#26f7ff', shadowOpacity: 0.2, shadowRadius: 10
  },
  submitText: { color: '#000000', fontWeight: '900', letterSpacing: 1 },
  
  // High Contrast Table Layout Config
  logsSection: { marginTop: 10, paddingBottom: 50 },
  logHeaderLabel: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  tableHeader: { 
    flexDirection: 'row', backgroundColor: '#18181c', padding: 10, 
    borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' 
  },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, // Shifted to higher layout visibility contrast
  listWrapper: { maxHeight: 200 },
  tableRow: { 
    flexDirection: 'row', padding: 12, borderBottomWidth: 1, 
    borderBottomColor: '#121214', alignItems: 'center' 
  },
  rCell: { color: '#ffffff', fontSize: 10, flex: 1, fontWeight: '500' }
});