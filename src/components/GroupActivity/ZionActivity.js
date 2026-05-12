import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ZION_TASKS = [
  { id: 'cleaning', label: 'Cleaning Zion (Temple, Kitchen, Washing)' },
  { id: 'visiting', label: 'Visiting (Study members)' },
  { id: 'gathering', label: 'Gathering (Education, Online Gathering)' },
  { id: 'food', label: 'Food Preparation (Cooking, Assist)' },
  { id: 'carrying', label: 'Carrying Member (Assist Member, Children)' },
  { id: 'construction', label: 'Zion Construction (Repair, Electric, Paint)' },
];

export default function ZionActivity() {
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [logs, setLogs] = useState([]);

  // Web-Compatible Date
  const today = new Date();
  const webDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  const [date] = useState(webDate);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await AsyncStorage.getItem('@zion_activity_logs');
      if (data) setLogs(JSON.parse(data));
    } catch (e) { console.error("Load Error:", e); }
  };

  const toggleTask = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const handleSave = async () => {
    if (selectedTasks.length === 0) {
      return Alert.alert("Pansin", "Pumili ng kahit isang aktibidad.");
    }

    const taskLabels = ZION_TASKS
      .filter(t => selectedTasks.includes(t.id))
      .map(t => t.label.split(' (')[0]); // Kinukuha lang ang main title

    const newLog = {
      id: Date.now().toString(),
      type: 'ZionActivity',
      date: date,
      activities: taskLabels.join(', '),
      timestamp: new Date().toISOString()
    };

    try {
      const existing = await AsyncStorage.getItem('@zion_activity_logs');
      const currentLogs = existing ? JSON.parse(existing) : [];
      const updatedLogs = [newLog, ...currentLogs];
      
      await AsyncStorage.setItem('@zion_activity_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      
      Alert.alert("ZION ACTIVITY", "Many Blessing Today, Good Job po😊");
      setSelectedTasks([]); // Reset selection
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  const deleteLog = async (id) => {
    const filtered = logs.filter(l => l.id !== id);
    await AsyncStorage.setItem('@zion_activity_logs', JSON.stringify(filtered));
    setLogs(filtered);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>ZION ACTIVITY</Text>

      <Text style={styles.label}>DATE FIELD</Text>
      <View style={styles.inputBox}>
        <Text style={styles.inputText}>{date}</Text>
        <MaterialCommunityIcons name="calendar-star" size={20} color="#3498db" />
      </View>

      <Text style={styles.label}>SELECT ZION ACTIVITY</Text>
      {ZION_TASKS.map((task) => (
        <TouchableOpacity 
          key={task.id} 
          style={[styles.checkRow, selectedTasks.includes(task.id) && styles.checkRowActive]} 
          onPress={() => toggleTask(task.id)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={selectedTasks.includes(task.id) ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={22} 
            color={selectedTasks.includes(task.id) ? "#3498db" : "#666"} 
          />
          <Text style={[styles.checkText, selectedTasks.includes(task.id) && styles.checkTextActive]}>
            {task.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
        <Text style={styles.submitText}>SUBMIT LOG</Text>
      </TouchableOpacity>

      {/* --- TABLE LOGS SECTION --- */}
      <View style={styles.logsSection}>
        <Text style={styles.logHeaderLabel}>ZION ACTIVITY LOGS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 0.8 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 2 }]}>Activities</Text>
          <Text style={[styles.hCell, { width: 30 }]}>Act</Text>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={styles.rCell} numberOfLines={2}>{item.activities}</Text>
                <TouchableOpacity onPress={() => deleteLog(item.id)}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#3498db" />
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
  label: { color: '#3498db', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  inputBox: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 20,
    borderWidth: 1, borderColor: '#222'
  },
  inputText: { color: '#fff', fontSize: 14 },
  checkRow: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, 
    backgroundColor: '#151515', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#222'
  },
  checkRowActive: { borderColor: 'rgba(52, 152, 219, 0.3)', backgroundColor: '#1a1a1a' },
  checkText: { color: '#888', marginLeft: 10, fontSize: 12 },
  checkTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { 
    backgroundColor: '#3498db', padding: 16, borderRadius: 10, alignItems: 'center',
    marginTop: 20, marginBottom: 30
  },
  submitText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  
  // Table Styles
  logsSection: { marginTop: 10, paddingBottom: 50 },
  logHeaderLabel: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginBottom: 10, opacity: 0.8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#333' },
  hCell: { color: '#666', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  listWrapper: { maxHeight: 200 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#222', alignItems: 'center' },
  rCell: { color: '#ccc', fontSize: 10, flex: 1 }
});