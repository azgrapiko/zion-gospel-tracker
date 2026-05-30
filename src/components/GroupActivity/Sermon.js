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

// FEED MY SHEEP BOOKS DATA
const FMS_BOOKS = [
  "FMS Book 1", "FMS Book 2", "FMS Book 3", 
  "FMS Book 4", "FMS Book 5", "FMS Book 6-1", 
  "FMS Book 6-2", "FMS Book 7-1", "FMS Book 1-2"
];

export default function Sermon({ onClose }) {
  // New State Toggle: false = Sermon Level mode, true = Feed My Sheep mode
  const [isFeedMySheep, setIsFeedMySheep] = useState(false);

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

  // Reset category values when switching operational modes to avoid data spill
  useEffect(() => {
    setSelectedLevel('');
    setSelectedSubject('');
  }, [isFeedMySheep]);

  const loadLogs = async () => {
    try {
      const data = await AsyncStorage.getItem('@zion_sermon_logs');
      if (data) setLogs(JSON.parse(data));
    } catch (e) { console.error("Load Error:", e); }
  };

  const handleSave = async () => {
    if (!selectedLevel || !selectedSubject) {
      return Alert.alert(
        "Pansin", 
        isFeedMySheep ? "Paki-pili ang Book at Chapter No." : "Paki-pili ang Level at Subject No."
      );
    }

    const mark = isEvaluation ? "EVALUATION" : "PRACTICE";
    const modeType = isFeedMySheep ? 'Feed My Sheep' : 'Sermon';

    const newLog = {
      id: Date.now().toString(),
      type: modeType,
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
      
      Alert.alert(isFeedMySheep ? "FEED MY SHEEP" : "SERMON", "Wow, Good Job po😊");
      
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
      <Text style={styles.headerTitle}>SERMON & FEED MY SHEEP</Text>

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

      {/* --- MODE CATEGORY SWITCH (Sermon Level vs Feed My Sheep) --- */}
      <Text style={styles.label}>CHOOSE CATEGORY MODE</Text>
      <View style={styles.modeSwitchRow}>
        <Text style={[styles.statusText, { color: isFeedMySheep ? '#8a8f9e' : '#f1c40f' }]}>Sermon Level</Text>
        <Switch
          value={isFeedMySheep}
          onValueChange={setIsFeedMySheep}
          trackColor={{ false: 'rgba(241, 196, 15, 0.4)', true: 'rgba(241, 196, 15, 0.4)' }}
          thumbColor="#f1c40f"
        />
        <Text style={[styles.statusText, { color: isFeedMySheep ? '#f1c40f' : '#8a8f9e' }]}>Feed My Sheep</Text>
      </View>

      {/* --- DYNAMIC MAIN DROPDOWN PICKER (Sermon Level OR FMS Books) --- */}
      <Text style={styles.label}>{isFeedMySheep ? "FEED MY SHEEP BOOK" : "SERMON LEVEL"}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLevel}
          onValueChange={(val) => setSelectedLevel(val)}
          style={styles.picker}
          dropdownIconColor="#f1c40f"
        >
          <Picker.Item label={isFeedMySheep ? "Select FMS Book" : "Select Sermon Level"} value="" color="#8a8f9e" />
          {isFeedMySheep ? (
            FMS_BOOKS.map((book, index) => (
              <Picker.Item key={index} label={book} value={book} color={Platform.OS === 'web' ? '#0e0e0e' : '#0d0d0d'} style={styles.pickerItemBackend} />
            ))
          ) : (
            SERMON_LEVELS.map((level, index) => (
              <Picker.Item key={index} label={level} value={level} color={Platform.OS === 'web' ? '#0e0e0e' : '#0d0d0d'} style={styles.pickerItemBackend} />
            ))
          )}
        </Picker>
      </View>

      {/* --- DYNAMIC SUB-ITEMS DROPDOWN PICKER (Subject No. OR Chapter No.) --- */}
      <Text style={styles.label}>{isFeedMySheep ? "CHAPTER NO." : "SUBJECT NO."}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedSubject}
          onValueChange={(val) => setSelectedSubject(val)}
          style={styles.picker}
          dropdownIconColor="#f1c40f"
        >
          <Picker.Item label={isFeedMySheep ? "Select Chapter No." : "Select Subject No."} value="" color="#8a8f9e" />
          {[...Array(10)].map((_, i) => {
            const displayLabel = isFeedMySheep ? `Chapter ${i + 1}` : `Subject ${i + 1}`;
            const valueLabel = isFeedMySheep ? `Chapter ${i + 1}` : `Subject ${i + 1}`;
            return (
              <Picker.Item key={i} label={displayLabel} value={valueLabel} color={Platform.OS === 'web' ? '#090909' : '#080808'} style={styles.pickerItemBackend} />
            );
          })}
        </Picker>
      </View>

      {/* Evaluation/Practice Switch Button Section */}
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
        <Text style={styles.logHeaderLabel}>SERMON & FMS HISTORY LOGS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 0.9 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 1.3 }]}>Level / Book</Text>
          <Text style={[styles.hCell, { flex: 0.9 }]}>Sub/Ch.</Text>
          <Text style={[styles.hCell, { flex: 0.7 }]}>Mark</Text>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={[styles.rCell, { flex: 1.3, color: '#ffffff', fontWeight: '500' }]} numberOfLines={1}>{item.level}</Text>
                <Text style={[styles.rCell, { flex: 0.9 }]}>
                  {item.subject ? item.subject.replace('Subject ', 'Sub ').replace('Chapter ', 'Ch. ') : ''}
                </Text>
                <Text style={[styles.rCell, { flex: 0.7, color: item.mark === 'EVALUATION' ? '#2ecc71' : '#f1c40f', fontWeight: '900' }]}>
                  {item.mark ? item.mark.substring(0, 4) : ''}..
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
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 1.5 },
  label: { color: '#f1c40f', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  
  // Custom Date selection styling configurations
  inputBoxWrapper: { marginBottom: 20 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#f6e100', fontSize: 14, flex: 1 },
  webDate: { 
    backgroundColor: '#141412', color: '#fceb06', border: '1px solid #d9e317', 
    padding: '12px', borderRadius: '8px', width: '50%', fontSize: '14px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  pickerContainer: { 
    backgroundColor: '#121214', 
    borderRadius: 8, marginBottom: 15, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c303b'
  },
  picker: { color: '#070707', height: 50 },
  pickerItemBackend: { backgroundColor: '#121214', color: '#080808' },
  
  // Custom alignment for Category Switch Mode
  modeSwitchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#121214', padding: 12, borderRadius: 8, marginBottom: 15,
    borderWidth: 1, borderColor: '#2c303b'
  },
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
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, 
  listWrapper: { maxHeight: 200 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 10, flex: 1, fontWeight: '500' } 
});