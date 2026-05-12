import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function OnlineMission() {
  const [selectedContent, setSelectedContent] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Web-Compatible Date logic
  const today = new Date();
  const webDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  const [date] = useState(webDate);

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
    if (!selectedContent) return Alert.alert("Error", "Pumili ng Content No.");
    
    const mark = isCompleted ? "COMPLETED" : "PARTIAL";

    const newLog = {
      id: Date.now().toString(),
      date: date,
      content: selectedContent,
      mark: mark,
      timestamp: new Date().toISOString()
    };

    try {
      const updatedLogs = [newLog, ...logs];
      await AsyncStorage.setItem('@zion_online_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      
      Alert.alert("ONLINE MISSION", "Wow, Good Job po today😊");
      
      // Reset fields
      setSelectedContent('');
      setIsCompleted(false);
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>ONLINE MISSION</Text>

      <Text style={styles.label}>DATE FIELD</Text>
      <View style={styles.inputBox}>
        <Text style={styles.inputText}>{date}</Text>
        <MaterialCommunityIcons name="calendar-check" size={18} color="#2ecc71" />
      </View>

      <Text style={styles.label}>ONLINE CONTENT (TITLE)</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={selectedContent}
          onValueChange={(v) => setSelectedContent(v)}
          style={styles.picker}
          dropdownIconColor="#2ecc71"
        >
          <Picker.Item label="Select Content No." value="" color="#888" />
          {[...Array(10)].map((_, i) => (
            <Picker.Item 
              key={i} 
              label={`Content ${i + 1}`} 
              value={`Content ${i + 1}`} 
              color="#000" 
            />
          ))}
        </Picker>
      </View>

      {/* Switch Status Section */}
      <View style={styles.switchRow}>
        <Text style={[styles.statusText, { color: isCompleted ? '#444' : '#2ecc71' }]}>Partial</Text>
        <Switch
          value={isCompleted}
          onValueChange={setIsCompleted}
          trackColor={{ false: '#333', true: '#2ecc71' }}
          thumbColor={isCompleted ? '#fff' : '#f4f3f4'}
        />
        <Text style={[styles.statusText, { color: isCompleted ? '#2ecc71' : '#444' }]}>Completed</Text>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
        <Text style={styles.submitText}>SUBMIT LOG</Text>
      </TouchableOpacity>

      {/* --- TABLE LOGS WITH SCROLL LIMIT --- */}
      <View style={styles.logsContainer}>
        <Text style={styles.logTitle}>ONLINE MISSION TABLE LOGS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, { flex: 1 }]}>Date</Text>
          <Text style={[styles.hCell, { flex: 1 }]}>Content No</Text>
          <Text style={[styles.hCell, { flex: 1 }]}>Mark</Text>
          <Text style={[styles.hCell, { width: 40, textAlign: 'right' }]}>Act</Text>
        </View>
        
        {/* ScrollView for the list to handle more than 5 logs */}
        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={styles.rCell}>{item.content}</Text>
                <Text style={[styles.rCell, { color: item.mark === 'COMPLETED' ? '#2ecc71' : '#f1c40f' }]}>
                  {item.mark}
                </Text>
                <TouchableOpacity style={{ width: 40, alignItems: 'flex-end' }}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#2ecc71" />
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
  label: { color: '#2ecc71', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  inputBox: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 20,
    borderWidth: 1, borderColor: '#222'
  },
  inputText: { color: '#fff', fontSize: 14 },
  pickerWrap: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  picker: { color: '#000', height: 50 },
  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 15, backgroundColor: '#151515', padding: 15, borderRadius: 12
  },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  submitBtn: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  submitText: { color: '#000', fontWeight: '900', letterSpacing: 1 },
  
  // Table Styles
  logsContainer: { marginTop: 10, paddingBottom: 40 },
  logTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginBottom: 10, opacity: 0.8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#333' },
  hCell: { color: '#888', fontSize: 9, fontWeight: 'bold' },
  listWrapper: { maxHeight: 200 }, // Scroll limit para sa list
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#222', alignItems: 'center' },
  rCell: { color: '#ccc', fontSize: 10, flex: 1 }
});