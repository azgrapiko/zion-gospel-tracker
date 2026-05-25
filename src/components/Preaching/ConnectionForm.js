import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';

export default function ConnectionForm({
  // Shared States from HubNavigator
  dateMet, setDateMet,
  promiseDate, setPromiseDate,
  listener, setListener,
  contact, setContact,
  location, setLocation,
  age, setAge,
  inviteeType, setInviteeType,
  preachType, setPreachType,
  tool, setTool,
  isValid, setIsValid,
  m1, setM1,
  m2, setM2,
  m3, setM3,
  
  // Actions
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
          {editId ? "⚡ EDITING CONNECTION" : "🤝 CONNECTION > VALID FORM"}
        </Text>
        <Text style={styles.zionBadge}>{zionCode || 'PLA'}</Text>
      </View>

      {/* 1. DATE SECTION - COMPACT ROW */}
      <View style={styles.infoGrid}>
        <View style={{flex: 1, marginRight: 8}}>
          <Text style={styles.miniLabel}>FIRST MEET</Text>
          {Platform.OS === 'web' ? (
            <input 
              type="date" 
              value={dateMet || ''} 
              onChange={(e) => setDateMet(e.target.value)} 
              style={styles.webDate} 
            />
          ) : (
            <TextInput 
              style={styles.input}
              value={dateMet}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
              onChangeText={setDateMet}
            />
          )}
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.miniLabel}>PROMISE DATE</Text>
          {Platform.OS === 'web' ? (
            <input 
              type="date" 
              value={promiseDate || ''} 
              onChange={(e) => setPromiseDate(e.target.value)} 
              style={styles.webDate} 
            />
          ) : (
            <TextInput 
              style={styles.input}
              value={promiseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
              onChangeText={setPromiseDate}
            />
          )}
        </View>
      </View>

      {/* 2. BASIC INFO */}
      <Text style={styles.miniLabel}>LISTENER & CONTACT INFO</Text>
      <View style={styles.infoGrid}>
        <TextInput 
          style={[styles.input, {flex: 1, marginRight: 8}]} 
          placeholder="First Name" 
          value={listener} 
          onChangeText={setListener} 
          placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
        />
        <TextInput 
          style={[styles.input, {flex: 1}]} 
          placeholder="Phone / Messenger" 
          value={contact} 
          onChangeText={setContact} 
          placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
        />
      </View>

      <Text style={styles.miniLabel}>LOCATION</Text>
      <TextInput 
        style={[styles.input, {marginBottom: 12}]} 
        placeholder="Location of Listener" 
        value={location} 
        onChangeText={setLocation} 
        placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
      />

      {/* 3. DROPDOWNS ROW 1 */}
      <View style={styles.infoGrid}>
        <View style={{flex: 1, marginRight: 8}}>
          <Text style={styles.miniLabel}>AGE CATEGORY</Text>
          <select value={age} onChange={(e) => setAge(e.target.value)} style={styles.webSelect}>
            {['','MA','FA','MYW','FYW','MYU','FYU','MSH','FSH','MMS','FMS','M Elem','F Elem','ME','FE'].map(opt => (
              <option key={opt} value={opt}>{opt || 'Select Age'}</option>
            ))}
          </select>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.miniLabel}>INVITEE TYPE</Text>
          <select value={inviteeType} onChange={(e) => setInviteeType(e.target.value)} style={styles.webSelect}>
            {['','Family','Work','School','Friend','Neighbor','Public','Other'].map(opt => (
              <option key={opt} value={opt}>{opt || 'Select Type'}</option>
            ))}
          </select>
        </View>
      </View>

      {/* 4. DROPDOWNS ROW 2 */}
      <View style={styles.infoGrid}>
        <View style={{flex: 1, marginRight: 8}}>
          <Text style={styles.miniLabel}>PREACHING TYPE</Text>
          <select value={preachType} onChange={(e) => setPreachType(e.target.value)} style={styles.webSelect}>
            {['','Door-to-door','Street','Event','Acquaintance'].map(opt => (
              <option key={opt} value={opt}>{opt || 'Select Type'}</option>
            ))}
          </select>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.miniLabel}>TOOLS USED</Text>
          <select value={tool} onChange={(e) => setTool(e.target.value)} style={styles.webSelect}>
            {['','Bible','Binder','Card News','Feed My Sheep','Pamphlet','Post Card','UCC Video','Intro. Video'].map(opt => (
              <option key={opt} value={opt}>{opt || 'Select Tool'}</option>
            ))}
          </select>
        </View>
      </View>

      {/* 5. TEAM MEMBERS */}
      <Text style={styles.miniLabel}>TEAM MEMBERS</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Member 1 (Lead)" 
        value={m1} 
        onChangeText={setM1} 
        placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
      />
      <View style={styles.infoGrid}>
        <TextInput 
          style={[styles.input, {flex: 1, marginRight: 8, marginTop: 8}]} 
          placeholder="Member 2" 
          value={m2} 
          onChangeText={setM2} 
          placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
        />
        <TextInput 
          style={[styles.input, {flex: 1, marginTop: 8}]} 
          placeholder="Member 3" 
          value={m3} 
          onChangeText={setM3} 
          placeholderTextColor="#8a8f9e" // HIGH CONTRAST FIXED
        />
      </View>

      {/* 6. POTENTIAL / VALID SWITCH */}
      <View style={styles.switchRow}>
        <View style={{flex: 1}}>
          <Text style={[styles.statusText, {color: isValid ? '#26f7ff' : '#ffaa00'}]}>
            {isValid ? "VALID PREACHING" : "POTENTIAL VALID"}
          </Text>
          <Text style={{color: '#a2a8b6', fontSize: 11, fontWeight: '900', marginTop: 2}}>
            I-switch kung ito ay naging Valid na.
          </Text>
        </View>
        <Switch 
          value={Boolean(isValid)} 
          onValueChange={(val) => setIsValid(val)} 
          trackColor={{ false: "#232329", true: "rgba(38, 247, 255, 0.4)" }} 
          thumbColor={isValid ? "#26f7ff" : "#8a8f9e"} 
        />
      </View>

      {/* 7. SAVE BUTTON */}
      <TouchableOpacity 
        style={[styles.saveBtn, editId && {backgroundColor: '#ffaa00'}]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.saveBtnText}>
            {editId ? "UPDATE CONNECTION" : "SAVE CONNECTION"}
          </Text>
        )}
      </TouchableOpacity>

      {/* 8. LOGS TABLE */}
      {/* HIGH CONTRAST FIXED: Iniangat ang kulay ng section label mula sa madilim na #444 */}
      <Text style={[styles.sectionLabel, {marginTop: 40, color: '#a2a8b6'}]}>CONNECTION LOGS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{paddingBottom: 40}}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, {width: 60}]}>DATE</Text>
            <Text style={[styles.th, {width: 100}]}>LISTENER</Text>
            <Text style={[styles.th, {width: 50}]}>AGE</Text>
            <Text style={[styles.th, {width: 120}]}>LOCATION</Text>
            <Text style={[styles.th, {width: 120}]}>STATUS</Text>
            <Text style={[styles.th, {width: 80, textAlign: 'center'}]}>ACTION</Text>
          </View>
          
          {logs && logs.length > 0 ? (
            logs.map(log => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={[styles.td, {width: 60}]}>{log.date ? log.date.slice(5) : '--'}</Text>
                <Text style={[styles.td, {width: 100, color: '#ffffff', fontWeight: '900'}]}>{log.listener}</Text>
                <Text style={[styles.td, {width: 50, color: '#ffffff', fontWeight: '500'}]}>{log.age}</Text>
                <Text style={[styles.td, {width: 120, fontSize: 10, color: '#ffffff'}]}>{log.location}</Text>
                <Text style={[styles.td, {width: 120, color: log.isValid ? '#26f7ff' : '#ffaa00', fontWeight: '900'}]}>
                  {log.isValid ? 'VALID' : 'POTENTIAL'}
                </Text>
                <View style={{width: 80, flexDirection: 'row', justifyContent: 'space-evenly'}}>
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
            <Text style={{ color: '#a2a8b6', fontSize: 11, marginTop: 15, fontWeight: '700' }}>No connection logs found.</Text>
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
  miniLabel: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 8, marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#121214', color: '#FFFFFF', padding: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#2c303b' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  webDate: { backgroundColor: '#121214', color: '#FFFFFF', border: '1px solid #2c303b', padding: '12px', borderRadius: '8px', width: '100%', fontSize: '14px', fontFamily: 'inherit', outline: 'none' },
  webSelect: { backgroundColor: '#121214', color: '#FFFFFF', border: '1px solid #2c303b', padding: '12px', borderRadius: '8px', width: '100%', fontSize: '14px', fontFamily: 'inherit', outline: 'none' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181c', padding: 16, borderRadius: 12, marginTop: 25, borderWidth: 1, borderColor: '#232329' },
  statusText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  saveBtn: { backgroundColor: '#26f7ff', padding: 18, borderRadius: 12, marginTop: 25, alignItems: 'center' },
  saveBtnText: { color: '#000000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2d313d', paddingBottom: 12, marginTop: 20 },
  th: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, // High-contrast headers mula sa dating #555
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  td: { color: '#ffffff', fontSize: 11, fontWeight: '500' },
  inputWrapper: { width: '100%' }
});