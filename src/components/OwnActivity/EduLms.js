import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const COURSES = [
  { id: 'nms', label: 'New Member School (NMS)', steps: 12 },
  { id: 'm1', label: 'Member I', steps: 12 },
  { id: 'm2', label: 'Member II', steps: 12 },
  { id: 'se', label: 'Student Evangelist', steps: 11 },
  { id: 'e1', label: 'Evangelist I', steps: 12 },
  { id: 'e2', label: 'Evangelist II', steps: 12 },
  { id: 'de', label: 'Deacon(ess)', steps: 12 },
];

export default function EduLms({ onClose }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [logs, setLogs] = useState([]);
  
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
    } catch (e) { console.error(e); }
  };

  const getStepOptions = () => {
    const course = COURSES.find(c => c.label === selectedCourse);
    if (!course) return [];
    return Array.from({ length: course.steps }, (_, i) => `Step ${i + 1}`);
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedStep) {
      return Alert.alert("Required", "Paki-pili ang Course at Step.");
    }

    const newLog = {
      id: Date.now().toString(),
      type: 'EduLMS',
      course: selectedCourse,
      step: selectedStep,
      status: isCompleted ? 'Completed' : 'Partial',
      date: date, // Active user-selected calendar date value
      timestamp: new Date().toISOString(),
    };

    try {
      const existing = await AsyncStorage.getItem('@zion_edulms_logs');
      const currentLogs = existing ? JSON.parse(existing) : [];
      const updatedLogs = [newLog, ...currentLogs];
      
      await AsyncStorage.setItem('@zion_edulms_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs); // Update UI table agad
      
      Alert.alert("EDULMS", "Wow, Good Job po today😊");
      
      // Reset inputs
      setSelectedCourse('');
      setSelectedStep('');
      setIsCompleted(false);
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  const deleteLog = async (id) => {
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

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>SUBMIT LOG</Text>
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
            <Text style={[styles.rCell, { flex: 1.5, color: '#ffffff', fontWeight: '500' }]} numberOfLines={1}>{item.course}</Text>
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
  container: { padding: 20, backgroundColor: '#050505' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  label: { color: '#d504e8', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  
  // Custom High Contrast Selection Pickers
  inputBoxWrapper: { marginBottom: 20 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#ffffff', fontSize: 14, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#fc2cd2', border: '1px solid #df20c6', 
    padding: '12px', borderRadius: '8px', width: '50%', fontSize: '14px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  pickerContainer: { 
    backgroundColor: '#121214', 
    borderRadius: 8, marginBottom: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c303b'
  },
  picker: { color: '#0f0e0e', height: 50 },
  pickerItemBackend: { backgroundColor: '#121214', color: '#ffffff' },

  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 15, backgroundColor: '#18181c', padding: 15, borderRadius: 12,
    borderWidth: 1, borderColor: '#232329'
  },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBtn: { 
    backgroundColor: '#830896', padding: 16, borderRadius: 10, alignItems: 'center',
    shadowColor: '#b40aa8', shadowOpacity: 0.2, shadowRadius: 10
  },
  saveBtnText: { color: '#fffbfb', fontWeight: '900', letterSpacing: 1 },
  
  // High Contrast Table Logs Section Styles
  logsSection: { marginTop: 30, paddingBottom: 50 },
  logHeaderLabel: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#18181c', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, // Shifted to higher layout visibility
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 10, flex: 1, fontWeight: '500' }
});