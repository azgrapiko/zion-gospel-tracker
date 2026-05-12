import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, FlatList } from 'react-native';
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
  
  // Web-Compatible Date Initialization
  const today = new Date();
  const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  const [date] = useState(formattedDate);

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
      date: date,
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
      <View style={styles.inputBox}>
        <Text style={styles.inputText}>{date}</Text>
        <MaterialCommunityIcons name="calendar-month" size={20} color="#26f7ff" />
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
          <Picker.Item label="Select Course" value="" color="#888" />
          {COURSES.map(c => (
            <Picker.Item key={c.id} label={c.label} value={c.label} color="#000" /> 
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
              <Picker.Item label="Select Step" value="" color="#888" />
              {getStepOptions().map(step => (
                <Picker.Item key={step} label={step} value={step} color="#000" />
              ))}
            </Picker>
          </View>
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={[styles.statusText, { color: isCompleted ? '#444' : '#26f7ff' }]}>Partial</Text>
        <Switch
          value={isCompleted}
          onValueChange={setIsCompleted}
          trackColor={{ false: '#333', true: '#26f7ff' }}
          thumbColor={isCompleted ? '#fff' : '#f4f3f4'}
        />
        <Text style={[styles.statusText, { color: isCompleted ? '#2ecc71' : '#444' }]}>Completed</Text>
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
          <Text style={[styles.hCell, { width: 40 }]}>Act</Text>
        </View>

        {logs.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.rCell}>{item.date}</Text>
            <Text style={styles.rCell} numberOfLines={1}>{item.course}</Text>
            <Text style={[styles.rCell, { color: item.status === 'Completed' ? '#2ecc71' : '#26f7ff' }]}>
              {item.status}
            </Text>
            <TouchableOpacity onPress={() => deleteLog(item.id)}>
              <MaterialCommunityIcons name="delete-outline" size={18} color="#ff4d4d" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#0f0f0f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  label: { color: '#26f7ff', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  inputBox: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 20,
    borderWidth: 1, borderColor: '#222'
  },
  inputText: { color: '#fff', fontSize: 14 },
  pickerContainer: { 
    backgroundColor: '#fff', // Pinalitan para maging visible ang text
    borderRadius: 8, marginBottom: 20, overflow: 'hidden'
  },
  picker: { color: '#000', height: 50 },
  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 15, backgroundColor: '#151515', padding: 15, borderRadius: 12
  },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  saveBtn: { 
    backgroundColor: '#26f7ff', padding: 16, borderRadius: 10, alignItems: 'center',
    shadowColor: '#26f7ff', shadowOpacity: 0.3, shadowRadius: 10
  },
  saveBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1 },
  
  // Table Styles
  logsSection: { marginTop: 30, paddingBottom: 50 },
  logHeaderLabel: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 10, opacity: 0.8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#333' },
  hCell: { color: '#888', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#222', alignItems: 'center' },
  rCell: { color: '#ccc', fontSize: 10, flex: 1 }
});