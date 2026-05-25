import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, TextInput } from 'react-native';
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

  // Web-Compatible Date Initialization Formatter (YYYY-MM-DD for stable selection sync)
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // User explicitly selects and updates the activity log date field
  const [date, setDate] = useState(getTodayString());

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
      date: date, // Active chosen user date
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
            <MaterialCommunityIcons name="calendar-star" size={25} color="#2281c0" />
          </View>
        )}
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
            color={selectedTasks.includes(task.id) ? "#3498db" : "#8a8f9e"} 
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
          <Text style={[styles.hCell, { width: 30, textAlign: 'right' }]}>ACT</Text>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={[styles.rCell, { flex: 2, color: '#ffffff', fontWeight: '500' }]} numberOfLines={2}>{item.activities}</Text>
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
  container: { padding: 20, backgroundColor: '#050505' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  label: { color: '#3498db', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  
  // High Contrast Calendar Pickers Structure
  inputBoxWrapper: { marginBottom: 15 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#3a84c8', padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#2e8ada'
  },
  inputText: { color: '#ffffff', fontSize: 14, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#ffffff', border: '1px solid #5da6e9', 
    padding: '12px', borderRadius: '8px', width: '50%', fontSize: '14px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  checkRow: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, 
    backgroundColor: '#121414', padding: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  checkRowActive: { borderColor: '#3498db', backgroundColor: '#18181c' },
  checkText: { color: '#8a8f9e', marginLeft: 10, fontSize: 13, fontWeight: '500' },
  checkTextActive: { color: '#ffffff', fontWeight: '900' },
  
  submitBtn: { 
    backgroundColor: '#3498db', padding: 16, borderRadius: 10, alignItems: 'center',
    marginTop: 20, marginBottom: 30, shadowColor: '#3498db', shadowOpacity: 0.2, shadowRadius: 10
  },
  submitText: { color: '#ffffff', fontWeight: '900', letterSpacing: 1 },
  
  // High Contrast Table Layout Config
  logsSection: { marginTop: 10, paddingBottom: 50 },
  logHeaderLabel: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#18181c', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, // High contrast header shift
  listWrapper: { maxHeight: 200 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 10, flex: 0.8, fontWeight: '500' }
});