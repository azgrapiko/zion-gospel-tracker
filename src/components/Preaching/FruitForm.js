import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';

export default function FruitForm({
  // Mula sa HubNavigator (States)
  baptismDate, setBaptismDate,
  fruitName, setFruitName,
  location, setLocation,
  contact, setContact,
  ageCategory, setAgeCategory,
  m1, setM1, m2, setM2, m3, setM3,
  
  // Mula sa HubNavigator (Actions)
  handleSave,
  loading,
  editId,
  logs = [], 
  handleEdit,
  handleDelete
}) {
  const { zionCode } = useAuthStore();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>
          {editId ? "⚡ REVISING FRUIT DATA" : "🍇 MY GOOD FRUIT"}
        </Text>
        <Text style={styles.zionBadge}>{zionCode || 'PLA'}</Text>
      </View>

      {/* Date Field - Cyan Label & Fixed State Sync */}
      <View style={{ width: '100%', marginBottom: 12 }}>
        <Text style={styles.miniLabel}>DATE OF BAPTISM</Text>
        <input 
          type="date" 
          value={baptismDate || ''} 
          onChange={(e) => setBaptismDate(e.target.value)} 
          style={styles.webDate} 
        />
      </View>

      {/* Fruit Name at Age Dropdown */}
      <View style={styles.infoGrid}>
        <View style={{ flex: 2, marginRight: 10 }}>
          <Text style={styles.miniLabel}>NAME OF FRUIT</Text>
          <TextInput 
            style={styles.input} 
            value={fruitName} 
            onChangeText={setFruitName} 
            placeholder="Full Name" 
            placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.miniLabel}>AGE</Text>
          <select 
            value={ageCategory} 
            onChange={(e) => setAgeCategory(e.target.value)} 
            style={styles.webSelect}
          >
            {['','MA','FA','MYW','FYW','MYU','FYU','MSH','FSH','MMS','FMS','ME','FE'].map(opt => (
              <option key={opt} value={opt}>{opt || 'AGE'}</option>
            ))}
          </select>
        </View>
      </View>

      {/* Location at Contact */}
      <View style={[styles.infoGrid, { marginTop: 15 }]}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.miniLabel}>LOCATION</Text>
          <TextInput 
            style={styles.input} 
            value={location} 
            onChangeText={setLocation} 
            placeholder="Area" 
            placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.miniLabel}>CONTACT</Text>
          <TextInput 
            style={styles.input} 
            value={contact} 
            onChangeText={setContact} 
            placeholder="Phone / Social" 
            placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
          />
        </View>
      </View>

      {/* Team Section */}
      <Text style={[styles.miniLabel, { marginTop: 15 }]}>TEAM MEMBERS</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Member 1 (Lead)" 
        value={m1} 
        onChangeText={setM1} 
        placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
      />
      <View style={styles.infoGrid}>
        <TextInput 
          style={[styles.input, { flex: 1, marginRight: 8, marginTop: 8 }]} 
          placeholder="Member 2" 
          value={m2} 
          onChangeText={setM2} 
          placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
        />
        <TextInput 
          style={[styles.input, { flex: 1, marginTop: 8 }]} 
          placeholder="Member 3" 
          value={m3} 
          onChangeText={setM3} 
          placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, editId && { backgroundColor: '#ffaa00' }]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#000" /> : (
          <Text style={styles.saveBtnText}>{editId ? "UPDATE FRUIT INFO" : "SAVE FRUIT RECORD"}</Text>
        )}
      </TouchableOpacity>

      {/* Logs Table */}
      {/* HIGH CONTRAST FIXED: Iniangat ang kulay ng section header mula sa dating madilim na #555 */}
      <Text style={[styles.sectionLabel, { marginTop: 40, color: '#a2a8b6' }]}>MY FRUITS TABLE LOGS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{ paddingBottom: 20 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 60 }]}>DATE</Text>
            <Text style={[styles.th, { width: 140 }]}>FRUIT NAME</Text>
            <Text style={[styles.th, { width: 100 }]}>LOCATION</Text>
            <Text style={[styles.th, { width: 120 }]}>TEAM</Text>
            <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>ACTION</Text>
          </View>
          
          {logs?.length > 0 ? (
            logs.map(log => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={[styles.td, { width: 60 }]}>{log.date ? log.date.slice(5) : '--'}</Text>
                <Text style={[styles.td, { width: 140, color: '#26f7ff', fontWeight: '900' }]}>{log.name}</Text>
                <Text style={[styles.td, { width: 100, color: '#ffffff' }]}>{log.location}</Text>
                <Text style={[styles.td, { width: 120, fontSize: 10, color: '#a2a8b6', fontWeight: '500' }]}>{log.team}</Text>
                <View style={{ width: 80, flexDirection: 'row', justifyContent: 'space-evenly' }}>
                  <TouchableOpacity onPress={() => handleEdit(log)}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#ffaa00" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(log.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            // HIGH CONTRAST FIXED
            <Text style={{ color: '#a2a8b6', fontSize: 11, marginTop: 15, fontWeight: '700' }}>No recorded fruits found in this Zion.</Text>
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { color: '#26f7ff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  zionBadge: { backgroundColor: 'rgba(38, 247, 255, 0.12)', color: '#26f7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '900', borderWidth: 1, borderColor: '#26f7ff' },
  miniLabel: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#121214', color: '#FFFFFF', padding: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#2c303b' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  webDate: { backgroundColor: '#121214', color: '#FFFFFF', border: '1px solid #2c303b', padding: '12px', borderRadius: '8px', width: '100%', fontSize: '14px', outline: 'none' },
  webSelect: { backgroundColor: '#121214', color: '#FFFFFF', border: '1px solid #2c303b', padding: '12px', borderRadius: '8px', width: '100%', fontSize: '14px', outline: 'none' },
  saveBtn: { backgroundColor: '#26f7ff', padding: 18, borderRadius: 12, marginTop: 25, alignItems: 'center', elevation: 4 },
  saveBtnText: { color: '#000000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2d313d', paddingBottom: 12, marginTop: 20 },
  th: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, // High-contrast headers mula sa dating #555
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  td: { color: '#ffffff', fontSize: 11, fontWeight: '500' }
});