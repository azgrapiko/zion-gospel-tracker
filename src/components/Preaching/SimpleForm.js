import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore'; 

export default function SimpleForm({ 
  preachingDate, setPreachingDate,
  location, setLocation,
  partner1, setPartner1,
  partner2, setPartner2,
  reportedBy, setReportedBy,
  preachingType, setPreachingType, 
  simpleData,
  updateCount,
  handleTempSave, 
  handleSubmit,
  loading, 
  editId,
  submittedLogs = [], 
  handleEdit, 
  handleDelete
}) {
  const { userProfile, zionCode } = useAuthStore();

  const renderCounterPair = (maleLabel, femaleLabel) => {
    return (
      <View style={styles.counterRow}>
        <View style={styles.counterBox}>
          <Text style={styles.counterLabel}>{maleLabel.toUpperCase()}</Text>
          <View style={styles.controlGroup}>
            <TouchableOpacity onPress={() => updateCount(maleLabel, -1)} style={styles.miniBtn}>
              <Text style={styles.btnTxt}>-</Text>
            </TouchableOpacity>
            <Text style={styles.countNum}>{simpleData[maleLabel] || 0}</Text>
            <TouchableOpacity onPress={() => updateCount(maleLabel, 1)} style={styles.miniBtn}>
              <Text style={styles.btnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.counterBox}>
          <Text style={styles.counterLabel}>{femaleLabel.toUpperCase()}</Text>
          <View style={styles.controlGroup}>
            <TouchableOpacity onPress={() => updateCount(femaleLabel, -1)} style={styles.miniBtn}>
              <Text style={styles.btnTxt}>-</Text>
            </TouchableOpacity>
            <Text style={styles.countNum}>{simpleData[femaleLabel] || 0}</Text>
            <TouchableOpacity onPress={() => updateCount(femaleLabel, 1)} style={styles.miniBtn}>
              <Text style={styles.btnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>
          {editId ? "⚡ EDITING LOG" : "📊 SIMPLE PREACHING FORM"}
        </Text>
        <Text style={styles.zionBadge}>{zionCode || 'PLA'}</Text>
      </View>
      
      {/* INFO GRID Row 1: DATE ONLY */}
      <View style={styles.infoGrid}>
         <View style={styles.inputWrapper}>
            <Text style={styles.miniLabel}>PREACHING DATE</Text>
            {Platform.OS === 'web' ? (
              <input 
                type="date" 
                value={preachingDate || ''} 
                onChange={(e) => setPreachingDate(e.target.value)} 
                style={styles.webDate} 
              />
            ) : (
              <TextInput 
                style={styles.smallInput}
                value={preachingDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8a8f9e"
                onChangeText={setPreachingDate}
              />
            )}
         </View>
         <View style={styles.inputWrapper} />
      </View>

      {/* INFO GRID Row 2: PREACHING TYPE & LOCATION / AREA */}
      <View style={styles.infoGrid}>
         <View style={styles.inputWrapper}>
            <Text style={styles.miniLabel}>PREACHING TYPE</Text>
            {Platform.OS === 'web' ? (
              <select 
                value={preachingType} 
                onChange={(e) => {
                  if (typeof setPreachingType === 'function') {
                    setPreachingType(e.target.value);
                  } else {
                    console.error("Critical Check: setPreachingType prop ay hindi nakakarating mula kay HubNavigator.");
                  }
                }} 
                style={styles.webSelect}
              >
                {['', 'Door to door', 'Street', 'Event', 'Acquaintance', 'Online'].map(opt => (
                  <option key={opt} value={opt} style={{ color: '#ffffff', backgroundColor: '#121214' }}>
                    {opt || 'Select Type'}
                  </option>
                ))}
              </select>
            ) : (
              <View style={styles.dropdownNativeWrapper}>
                 <TextInput 
                    style={styles.smallInput}
                    value={preachingType}
                    placeholder="Door to door / Street / Event / Online"
                    placeholderTextColor="#4e5464"
                    onChangeText={(val) => {
                      if (typeof setPreachingType === 'function') {
                        setPreachingType(val);
                      }
                    }}
                 />
              </View>
            )}
         </View>

         <View style={styles.inputWrapper}>
            <Text style={styles.miniLabel}>LOCATION / AREA</Text>
            <TextInput 
              value={location} 
              onChangeText={setLocation} 
              style={styles.smallInput} 
              placeholder="Enter Area" 
              placeholderTextColor="#8a8f9e" 
            />
         </View>
      </View>

      {/* TEAM SECTION */}
      <View style={styles.TeamSection}>
         <Text style={styles.miniLabel}>REPORTER: {userProfile?.full_name || 'User'}</Text>
         <TextInput 
              value={reportedBy} 
              onChangeText={setReportedBy} 
              style={[styles.smallInput, {marginBottom: 12}]} 
              placeholder="Your Full Name (Encoded By)" 
              placeholderTextColor="#8a8f9e" 
         />

         <Text style={styles.miniLabel}>TEAM PARTNERS</Text>
         <View style={styles.infoGrid}>
            <TextInput 
              value={partner1} 
              onChangeText={setPartner1} 
              style={[styles.smallInput, {flex: 1, marginRight: 8}]} 
              placeholder="Partner 1" 
              placeholderTextColor="#8a8f9e" 
            />
            <TextInput 
              value={partner2} 
              onChangeText={setPartner2} 
              style={[styles.smallInput, {flex: 1}]} 
              placeholder="Partner 2" 
              placeholderTextColor="#8a8f9e" 
         />
         </View>
      </View>

      {/* COUNTERS SECTION */}
      <View style={styles.counterContainer}>
        <Text style={styles.categoryLabel}>CATEGORY COUNTER</Text>
        {renderCounterPair('Male Adult', 'Female Adult')}
        {renderCounterPair('Male Young Worker', 'Female Young Worker')}
        {renderCounterPair('Male Young University', 'Female Young University')}
        {renderCounterPair('Male Senior Highschool', 'Female Senior Highschool')}
        {renderCounterPair('Male Middle Highschool', 'Female Middle Highschool')}
        {renderCounterPair('Male Elementary', 'Female Elementary')}
        {renderCounterPair('Male Elderly', 'Female Elderly')}
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btnTemp} onPress={handleTempSave}>
          <Text style={styles.btnLabel}>DRAFT</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btnSubmit, editId && {backgroundColor: '#ffaa00'}]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.btnLabel, {color: '#000'}]}>
              {editId ? "UPDATE RECORD" : "SUBMIT TO ZION"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* LOGS TABLE SECTION */}
      <Text style={[styles.sectionLabel, {marginTop: 35, color: '#a2a8b6'}]}>DAILY TOTAL LOGS</Text>
      <View style={styles.tableHeader}>
         <Text style={[styles.th, {flex: 0.4}]}>DATE</Text>
         <Text style={[styles.th, {flex: 0.6}]}>TYPE</Text>
         <Text style={[styles.th, {flex: 0.7}]}>TEAM</Text>
         <Text style={[styles.th, {flex: 0.7}]}>AREA</Text>
         <Text style={[styles.th, {flex: 0.9}]}>BREAKDOWN</Text>
         <Text style={[styles.th, {textAlign: 'right', flex: 0.25}]}>TOT</Text>
         <Text style={[styles.th, {flex: 0.35}]}></Text>
      </View>
      
      {submittedLogs.map((log) => {
        const rawDate = log.log_date || log.date || '';
        const displayDate = rawDate ? rawDate.slice(5) : '---';
        
        const displayType = log.preaching_type || log.preachingType || log.type || preachingType || 'Select Type';
        const displayArea = log.area || log.location || 'No Area';

        return (
          <View key={log.id} style={styles.tableRow}>
             <Text style={[styles.td, {flex: 0.4}]}>{displayDate}</Text>
             <Text style={[styles.td, {flex: 0.6, color: '#ffaa00', fontWeight: '700', fontSize: 9}]}>
               {displayType}
             </Text>
             <Text style={[styles.td, {flex: 0.7, color: '#a2a8b6', fontSize: 10}]} numberOfLines={1}>{log.team}</Text>
             <Text style={[styles.td, {flex: 0.7, color: '#26f7ff', fontWeight: '900'}]} numberOfLines={1}>{displayArea}</Text>
             <Text style={[styles.td, {flex: 0.9, fontSize: 9, color: '#ffffff', fontWeight: '500'}]} numberOfLines={1}>{log.breakdown}</Text>
             <Text style={[styles.td, {textAlign: 'right', flex: 0.25, color: '#26f7ff', fontWeight: '900'}]}>{log.total}</Text>
             <View style={{flex: 0.35, flexDirection: 'row', justifyContent: 'flex-end'}}>
                <TouchableOpacity onPress={() => handleEdit(log)} style={{marginRight: 8}}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#ffaa00" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(log.id)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ff4444" />
                </TouchableOpacity>
             </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionLabel: { color: '#26f7ff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  zionBadge: { backgroundColor: 'rgba(38, 247, 255, 0.12)', color: '#26f7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '900', borderWidth: 1, borderColor: '#26f7ff' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  inputWrapper: { width: '48%' },
  miniLabel: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  smallInput: { backgroundColor: '#121214', color: '#FFFFFF', padding: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#2c303b' },
  webDate: { backgroundColor: '#121214', color: '#FFFFFF', border: '1px solid #2c303b', padding: '10px', borderRadius: '8px', width: '95%', fontSize: '14px', fontFamily: 'inherit' },
  webSelect: { backgroundColor: '#121214', color: '#FFFFFF', border: '1px solid #2c303b', padding: '12px', borderRadius: '8px', width: '100%', fontSize: '14px', fontFamily: 'inherit', outline: 'none' },
  dropdownNativeWrapper: { width: '100%' },
  TeamSection: { marginTop: 10, marginBottom: 20 },
  counterContainer: { backgroundColor: '#121214', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#232329' },
  categoryLabel: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 15, textAlign: 'center', letterSpacing: 2 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  counterBox: { flex: 1, alignItems: 'center' },
  counterLabel: { color: '#ffffff', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 0.3 }, 
  controlGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181c', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: '#3a3e4b' },
  miniBtn: { width: 34, height: 34, backgroundColor: '#232329', borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4a4f5d' },
  btnTxt: { color: '#26f7ff', fontSize: 22, fontWeight: '900' },
  countNum: { color: '#ffffff', fontSize: 18, fontWeight: '900', marginHorizontal: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  btnTemp: { flex: 0.3, backgroundColor: '#18181c', padding: 16, borderRadius: 12, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2c303b' },
  btnSubmit: { flex: 1, backgroundColor: '#26f7ff', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#232329', paddingBottom: 10, marginTop: 20 },
  th: { color: '#a2a8b6', fontSize: 10, fontWeight: '900' }, 
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  td: { color: '#ffffff', fontSize: 10 }
});