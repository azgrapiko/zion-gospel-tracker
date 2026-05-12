import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function Prayer() {
  const [unity, setUnity] = useState(false);
  const [letter, setLetter] = useState(false);
  const [time, setTime] = useState('Early Morning');
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
      date: date,
      time: time,
      taskDisplay: tasks.join(', '),
      timestamp: new Date().toISOString()
    };

    try {
      const updated = [newLog, ...logs];
      await AsyncStorage.setItem('@zion_prayer_logs', JSON.stringify(updated));
      setLogs(updated);
      
      Alert.alert("PRAYER", "Pagpalain ka ng Diyos sa iyong Pasasalamat 😊");
      
      // Reset UI
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
      <View style={styles.inputBox}>
        <Text style={styles.inputText}>{date}</Text>
        <MaterialCommunityIcons name="hands-pray" size={18} color="#26f7ff" />
      </View>

      <Text style={styles.label}>SELECT PRAYER TASKS</Text>
      <TouchableOpacity style={styles.checkRow} onPress={() => setUnity(!unity)} activeOpacity={0.7}>
        <MaterialCommunityIcons 
          name={unity ? "checkbox-marked" : "checkbox-blank-outline"} 
          size={24} 
          color="#26f7ff" 
        />
        <Text style={styles.checkText}>Unity Prayer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.checkRow} onPress={() => setLetter(!letter)} activeOpacity={0.7}>
        <MaterialCommunityIcons 
          name={letter ? "checkbox-marked" : "checkbox-blank-outline"} 
          size={24} 
          color="#26f7ff" 
        />
        <Text style={styles.checkText}>Letter to Heavenly Mother</Text>
      </TouchableOpacity>

      <Text style={styles.label}>TIME SCHEDULE</Text>
      <View style={styles.pickerWrap}>
        <Picker 
          selectedValue={time} 
          onValueChange={(v) => setTime(v)} 
          style={styles.picker}
          dropdownIconColor="#26f7ff"
        >
          <Picker.Item label="Early Morning" value="Early Morning" color="#000" />
          <Picker.Item label="Morning" value="Morning" color="#000" />
          <Picker.Item label="Afternoon" value="Afternoon" color="#000" />
          <Picker.Item label="Evening" value="Evening" color="#000" />
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
          <Text style={[styles.hCell, { width: 30 }]}>Act</Text>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((log) => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{log.date}</Text>
                <Text style={styles.rCell} numberOfLines={1}>{log.taskDisplay}</Text>
                <Text style={[styles.rCell, { color: '#26f7ff' }]}>{log.time}</Text>
                <TouchableOpacity onPress={() => deleteLog(log.id)}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#26f7ff" />
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
  label: { color: '#26f7ff', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  inputBox: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 15,
    borderWidth: 1, borderColor: '#222'
  },
  inputText: { color: '#fff', fontSize: 14 },
  checkRow: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, 
    backgroundColor: '#151515', padding: 15, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(38, 247, 255, 0.1)'
  },
  checkText: { color: '#fff', marginLeft: 12, fontSize: 13, fontWeight: '600' },
  pickerWrap: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 20, overflow: 'hidden' },
  picker: { color: '#000', height: 50 },
  submitBtn: { 
    backgroundColor: '#26f7ff', padding: 16, borderRadius: 10, 
    alignItems: 'center', marginBottom: 30 
  },
  submitText: { color: '#000', fontWeight: '900', letterSpacing: 1 },
  
  // Table Styles
  logsSection: { marginTop: 10, paddingBottom: 50 },
  logHeaderLabel: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginBottom: 10, opacity: 0.8 },
  tableHeader: { 
    flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 10, 
    borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#333' 
  },
  hCell: { color: '#888', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  listWrapper: { maxHeight: 200 }, // Rolldown limit after 5 logs
  tableRow: { 
    flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, 
    borderBottomColor: '#222', alignItems: 'center' 
  },
  rCell: { color: '#ccc', fontSize: 10, flex: 1 }
});