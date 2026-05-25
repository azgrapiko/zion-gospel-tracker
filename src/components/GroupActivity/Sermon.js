import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// SERMON LEVELS DATA
const SERMON_LEVELS = [
  "Sermon Level 1", "Sermon Level 2", "Sermon Level 3", 
  "Sermon Level 4", "Sermon Level 5", 
  "Staff of Moses 1", "Staff of Moses 2"
];

export default function Sermon({ onClose }) {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isEvaluation, setIsEvaluation] = useState(false);
  const [logs, setLogs] = useState([]);

  // Web-Compatible Date Initialization Formatter (YYYY-MM-DD for standard calendar input sync)
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // User can now explicitly choose and modify the date field
  const [date, setDate] = useState(getTodayString());

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await AsyncStorage.getItem('@zion_sermon_logs');
      if (data) setLogs(JSON.parse(data));
    } catch (e) { console.error("Load Error:", e); }
  };

  const handleSave = async () => {
    if (!selectedLevel || !selectedSubject) {
      return Alert.alert("Pansin", "Paki-pili ang Level at Subject No.");
    }

    const mark = isEvaluation ? "EVALUATION" : "PRACTICE";

    const newLog = {
      id: Date.now().toString(),
      type: 'Sermon',
      date: date, // Dynamic selected date record saved here
      level: selectedLevel,
      subject: selectedSubject,
      mark: mark,
      timestamp: new Date().toISOString()
    };

    try {
      const existing = await AsyncStorage.getItem('@zion_sermon_logs');
      const currentLogs = existing ? JSON.parse(existing) : [];
      const updatedLogs = [newLog, ...currentLogs];
      
      await AsyncStorage.setItem('@zion_sermon_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs); // Update UI table agad
      
      Alert.alert("SERMON", "Wow, Good Job po😊");
      
      // Reset inputs (keeping the active date state selection intact for multi-logging preference)
      setSelectedLevel('');
      setSelectedSubject('');
      setIsEvaluation(false);
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  const deleteLog = async (id) => {
    const filtered = logs.filter(l => l.id !== id);
    await AsyncStorage.setItem('@zion_sermon_logs', JSON.stringify(filtered));
    setLogs(filtered);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>SERMON</Text>

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
            <MaterialCommunityIcons name="calendar-edit" size={20} color="#f1c40f" />
          </View>
        )}
      </View>

      <Text style={styles.label}>SERMON LEVEL</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLevel}
          onValueChange={(val) => setSelectedLevel(val)}
          style={styles.picker}
          dropdownIconColor="#f1c40f"
        >
          <Picker.Item label="Select Sermon Level" value="" color="#8a8f9e" />
          {SERMON_LEVELS.map((level, index) => (
            <Picker.Item key={index} label={level} value={level} color={Platform.OS === 'web' ? '#fff' : '#fff'} style={styles.pickerItemBackend} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>SUBJECT NO.</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedSubject}
          onValueChange={(val) => setSelectedSubject(val)}
          style={styles.picker}
          dropdownIconColor="#f1c40f"
        >
          <Picker.Item label="Select Subject No." value="" color="#8a8f9e" />
          {[...Array(10)].map((_, i) => (
            <Picker.Item key={i} label={`Subject ${i + 1}`} value={`Subject ${i + 1}`} color={Platform.OS === 'web' ? '#fff' : '#fff'} style={styles.pickerItemBackend} />
          ))}
        </Picker>
      </View>

      {/* Switch Button Section */}
      <View style={styles.switchRow}>
        <Text style={[styles.statusText, { color: isEvaluation ? '#8a8f9e' : '#f1c40f' }]}>Practice</Text>
        <Switch
          value={isEvaluation}
          onValueChange={setIsEvaluation}
          trackColor={{ false: '#232329', true: 'rgba(241, 196, 15, 0.4)' }}
          thumbColor={isEvaluation ? '#f1c40f' : '#8a8f9e'}
        />
        <Text style={[styles.statusText, { color: isEvaluation ? '#2ecc71' : '#8a8f9e' }]}>Evaluation</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>SUBMIT LOG</Text>
      </TouchableOpacity>

      {/* --- TABLE LOGS SECTION --- */}
      <View style={styles.logsSection}>
        <Text style={styles.logHeaderLabel}>SERMON HISTORY LOGS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 1 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 1.2 }]}>Level</Text>
          <Text style={[styles.hCell, { flex: 1 }]}>Subject</Text>
          <Text style={[styles.hCell, { flex: 0.8 }]}>Mark</Text>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={[styles.rCell, { color: '#ffffff', fontWeight: '500' }]} numberOfLines={1}>{item.level}</Text>
                <Text style={styles.rCell}>{item.subject.replace('Subject ', 'Sub ')}</Text>
                <Text style={[styles.rCell, { color: item.mark === 'EVALUATION' ? '#2ecc71' : '#f1c40f', fontWeight: '900' }]}>
                  {item.mark.substring(0, 4)}..
                </Text>
                <TouchableOpacity onPress={() => deleteLog(item.id)}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#ff4d4d" />
                </TouchableOpacity>
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
  label: { color: '#f1c40f', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  
  // Custom Date selection styling configurations
  inputBoxWrapper: { marginBottom: 20 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#ffffff', fontSize: 14, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#ffffff', border: '1px solid #d9e317', 
    padding: '12px', borderRadius: '8px', width: '50%', fontSize: '14px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  pickerContainer: { 
    backgroundColor: '#121214', 
    borderRadius: 8, marginBottom: 15, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c303b'
  },
  picker: { color: '#ffffff', height: 50 },
  pickerItemBackend: { backgroundColor: '#121214', color: '#ffffff' },
  
  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 15, backgroundColor: '#18181c', padding: 15, borderRadius: 12,
    borderWidth: 1, borderColor: '#232329'
  },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBtn: { 
    backgroundColor: '#f1c40f', padding: 16, borderRadius: 10, alignItems: 'center',
    shadowColor: '#f1c40f', shadowOpacity: 0.2, shadowRadius: 10
  },
  saveBtnText: { color: '#000000', fontWeight: '900', letterSpacing: 1 },
  
  // High Contrast Table Styles
  logsSection: { marginTop: 25, paddingBottom: 50 },
  logHeaderLabel: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#18181c', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, // High contrast header shift
  listWrapper: { maxHeight: 200 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 10, flex: 1, fontWeight: '500' } // Pure White item content row alignment
});