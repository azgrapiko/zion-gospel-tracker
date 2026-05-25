import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function OnlineMission() {
  const [selectedContent, setSelectedContent] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
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
      date: date, // Dynamic user-selected interactive date
      content: selectedContent,
      mark: mark,
      timestamp: new Date().toISOString()
    };

    try {
      const updatedLogs = [newLog, ...logs];
      await AsyncStorage.setItem('@zion_online_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      
      Alert.alert("ONLINE MISSION", "Wow, Good Job po today😊");
      
      // Reset fields (keeping current date selection state intact for continuous entries)
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
            <MaterialCommunityIcons name="calendar-check" size={20} color="#2ecc71" />
          </View>
        )}
      </View>

      <Text style={styles.label}>ONLINE CONTENT (TITLE)</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={selectedContent}
          onValueChange={(v) => setSelectedContent(v)}
          style={styles.picker}
          dropdownIconColor="#2ecc71"
        >
          <Picker.Item label="Select Content No." value="" color="#8a8f9e" />
          {[...Array(10)].map((_, i) => (
            <Picker.Item 
              key={i} 
              label={`Content ${i + 1}`} 
              value={`Content ${i + 1}`} 
              color={Platform.OS === 'web' ? '#0c0c0c' : '#0e0d0d'} 
              style={styles.pickerItemBackend}
            />
          ))}
        </Picker>
      </View>

      {/* Switch Status Section */}
      <View style={styles.switchRow}>
        <Text style={[styles.statusText, { color: isCompleted ? '#8a8f9e' : '#2ecc71' }]}>Partial</Text>
        <Switch
          value={isCompleted}
          onValueChange={setIsCompleted}
          trackColor={{ false: '#232329', true: 'rgba(46, 204, 113, 0.4)' }}
          thumbColor={isCompleted ? '#2ecc71' : '#8a8f9e'}
        />
        <Text style={[styles.statusText, { color: isCompleted ? '#2ecc71' : '#8a8f9e' }]}>Completed</Text>
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
          <Text style={[styles.hCell, { width: 40, textAlign: 'right' }]}>ACT</Text>
        </View>
        
        {/* ScrollView for the list to handle more than 5 logs */}
        <View style={styles.listWrapper}>
          <ScrollView nestedScrollEnabled={true}>
            {logs.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.rCell}>{item.date}</Text>
                <Text style={[styles.rCell, { color: '#ffffff', fontWeight: '500' }]}>{item.content}</Text>
                <Text style={[styles.rCell, { color: item.mark === 'COMPLETED' ? '#2ecc71' : '#f1c40f', fontWeight: '900' }]}>
                  {item.mark}
                </Text>
                <View style={{ width: 40, alignItems: 'flex-end' }}>
                  <TouchableOpacity>
                    <MaterialCommunityIcons name="pencil" size={18} color="#2ecc71" />
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
  label: { color: '#2ecc71', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  
  // Custom High Contrast Calendar Input Layouts
  inputBoxWrapper: { marginBottom: 20 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#4ef09c', fontSize: 14, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#50e98d', border: '1px solid #3feb6a', 
    padding: '12px', borderRadius: '8px', width: '50%', fontSize: '14px', 
    fontFamily: 'inherit', outline: 'none' 
  },

  pickerWrap: { 
    backgroundColor: '#121214', 
    borderRadius: 8, marginBottom: 15, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c303b'
  },
  picker: { color: '#121111', height: 50 },
  pickerItemBackend: { backgroundColor: '#121214', color: '#ffffff' },

  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 15, marginVertical: 15, backgroundColor: '#18181c', padding: 15, borderRadius: 12,
    borderWidth: 1, borderColor: '#232329'
  },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  submitBtn: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  submitText: { color: '#000000', fontWeight: '900', letterSpacing: 1 },
  
  // High Contrast Table Layout Config
  logsContainer: { marginTop: 10, paddingBottom: 40 },
  logTitle: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#18181c', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, // Shifted to higher visibility contrast
  listWrapper: { maxHeight: 200 }, 
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 10, flex: 1, fontWeight: '500' }
});