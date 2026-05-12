import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
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

  // Web-Compatible Date Initialization
  const today = new Date();
  const webDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  const [date] = useState(webDate);

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
      date: date,
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
      
      // Reset inputs
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
      <View style={styles.inputBox}>
        <Text style={styles.inputText}>{date}</Text>
        <MaterialCommunityIcons name="calendar-edit" size={20} color="#f1c40f" />
      </View>

      <Text style={styles.label}>SERMON LEVEL</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLevel}
          onValueChange={(val) => setSelectedLevel(val)}
          style={styles.picker}
          dropdownIconColor="#f1c40f"
        >
          <Picker.Item label="Select Sermon Level" value="" color="#888" />
          {SERMON_LEVELS.map((level, index) => (
            <Picker.Item key={index} label={level} value={level} color="#000" />
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
          <Picker.Item label="Select Subject No." value="" color="#888" />
          {[...Array(10)].map((_, i) => (
            <Picker.Item key={i} label={`Subject ${i + 1}`} value={`Subject ${i + 1}`} color="#000" />
          ))}
        </Picker>
      </View>

      {/* Switch Button Section */}
      <View style={styles.switchRow}>
        <Text style={[styles.statusText, { color: isEvaluation ? '#444' : '#f1c40f' }]}>Practice</Text>
        <Switch
          value={isEvaluation}
          onValueChange={setIsEvaluation}
          trackColor={{ false: '#333', true: '#f1c40f' }}
          thumbColor={isEvaluation ? '#fff' : '#f4f3f4'}
        />
        <Text style={[styles.statusText, { color: isEvaluation ? '#2ecc71' : '#444' }]}>Evaluation</Text>
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
                <Text style={styles.rCell} numberOfLines={1}>{item.level}</Text>
                <Text style={styles.rCell}>{item.subject.replace('Subject ', 'Sub ')}</Text>
                <Text style={[styles.rCell, { color: item.mark === 'EVALUATION' ? '#2ecc71' : '#f1c40f' }]}>
                  {item.mark.substring(0, 4)}..
                </Text>
                <TouchableOpacity onPress={() => deleteLog(item.id)}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#ff4d4d" />
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
  container: { padding: 20, backgroundColor: '#0f0f0f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  label: { color: '#f1c40f', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  inputBox: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 20,
    borderWidth: 1, borderColor: '#222'
  },
  inputText: { color: '#fff', fontSize: 14 },
  pickerContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 8, marginBottom: 15, overflow: 'hidden'
  },
  picker: { color: '#000', height: 50 },
  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 15, backgroundColor: '#151515', padding: 15, borderRadius: 12
  },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  saveBtn: { 
    backgroundColor: '#f1c40f', padding: 16, borderRadius: 10, alignItems: 'center',
    shadowColor: '#f1c40f', shadowOpacity: 0.3, shadowRadius: 10
  },
  saveBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1 },
  
  // Table Styles
  logsSection: { marginTop: 25, paddingBottom: 50 },
  logHeaderLabel: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginBottom: 10, opacity: 0.8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#333' },
  hCell: { color: '#888', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  listWrapper: { maxHeight: 200 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#222', alignItems: 'center' },
  rCell: { color: '#ccc', fontSize: 9, flex: 1 }
});