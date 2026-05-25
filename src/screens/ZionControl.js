import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, TextInput, Modal, ScrollView 
} from 'react-native';
import { supabase } from '../utils/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore'; 

// MATERIAL DARK UI: Pinataas ang contrast boundaries para sa siksik na row operations ng admin center
const COLORS = {
  primary: '#26f7ff',
  background: '#050505',    // Swapped mula #0f0f0f para sumabay sa deep canvas ng dashboard
  card: '#121214',          // Bahagyang iniangat ang depth tier
  surface: '#18181c',       // Elevated panel grid fill para sa structural rows
  text: '#ffffff',          // Pure White
  subtext: '#a0a5b5',       // Iniahon mula sa malalabong gray para sa secondary control legends
  silver: '#d1d4dc',        // High-contrast font para sa value data chips
  danger: '#ff4444',
  success: '#00c853',
  border: '#232329',        // Mas litaw na layout boundary ring kumpara sa #222
  input: '#16161a',         // Mas malinis na fill for entry fields mula sa #1a1a1a
  overlay: 'rgba(0,0,0,0.85)'
};

const OPTIONS = {
  group: ["Male Adult", "Female Adult", "Male Young", "Female Young", "Male Highschool", "Female Highschool"],
  unit: ["1", "2", "3", "4", "5"],
  level: ["New Member", "Member 1", "Member 2", "Evangelist", "Deacon(ess)", "Missionary"]
};

export default function ZionControl() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true); 
  
  // Nananatiling intact ang userProfile data checking system
  const { zionCode, userProfile } = useAuthStore();
  
  const [searchGroup, setSearchGroup] = useState('');
  const [searchUnit, setSearchUnit] = useState('');
  const [searchLevel, setSearchLevel] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [activeSelection, setActiveSelection] = useState({ id: null, field: null, title: '', options: [] });

  const fetchMembers = useCallback(async () => {
    console.log("===== ZION CONTROL FETCH DEBUG =====");
    
    if (!userProfile?.id || !zionCode) {
      console.warn("Fetch waiting: Admin Profile or Zion Code is missing.");
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase.from('profiles').select('*');
      
      const isAdmin = userProfile?.role === 'super_admin' || 
                      userProfile?.user_name === 'admin_plaridel';
      
      console.log("Filtering for Zion:", zionCode, "as Admin:", isAdmin);

      if (isAdmin) {
        /**
         * MULTI-TENANCY FILTER (Strict Isolation):
         * Ang Admin ay makakakita lamang ng mga ka-branch o super_admins.
         */
        query = query.or(`zion_code.eq.${zionCode},role.eq.super_admin`);
      } else {
        query = query.eq('zion_code', zionCode);
      }

      const { data, error } = await query.order('full_name', { ascending: true });
      
      if (error) throw error;
      
      if (isMounted.current) {
        console.log(`Successfully fetched ${data?.length || 0} members for ${zionCode}.`);
        setMembers(data || []);
      }
    } catch (error) { 
      console.error("Fetch Members Error:", error.message); 
    } finally { 
      if (isMounted.current) {
        setLoading(false); 
      }
    }
  }, [zionCode, userProfile]);

  useEffect(() => { 
    isMounted.current = true;
    
    if (userProfile?.id) {
      fetchMembers();
    }

    const timer = setTimeout(() => {
      if (loading && isMounted.current) {
        console.log("Forcing loading to false (Safety Timeout)...");
        setLoading(false);
      }
    }, 4000);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [userProfile?.id, fetchMembers]);
  
  useEffect(() => {
    let result = [...members];
    if (searchGroup) result = result.filter(m => m.group_age?.toLowerCase().includes(searchGroup.toLowerCase()));
    if (searchUnit) result = result.filter(m => String(m.unit).includes(searchUnit));
    if (searchLevel) result = result.filter(m => m.lms_level?.toLowerCase().includes(searchLevel.toLowerCase()));
    setFilteredMembers(result);
  }, [members, searchGroup, searchUnit, searchLevel]);

  const updateField = async (id, field, val) => {
    try {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
      const { error } = await supabase.from('profiles').update({ [field]: val }).eq('id', id);
      if (error) throw error;
    } catch (error) { 
      Alert.alert("Sync Failed", error.message); 
      fetchMembers(); 
    }
  };

  const toggleTab = async (id, currentAccess, tab) => {
    const safeAccess = currentAccess || { dashboard: true, attendance: false, gospel: true, profile: true };
    const newAccess = { ...safeAccess, [tab]: !safeAccess?.[tab] };
    await updateField(id, 'tab_access', newAccess);
  };

  const bulkApprove = async () => {
    if (filteredMembers.length === 0) return;
    const pendingCount = filteredMembers.filter(m => !m.is_approved).length;
    if (pendingCount === 0) {
      Alert.alert("Notice", "No pending approvals found.");
      return;
    }

    Alert.alert(
      "Bulk Approval",
      `Approve ${pendingCount} pending accounts?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              const idsToUpdate = filteredMembers.filter(m => !m.is_approved).map(m => m.id);
              const { error } = await supabase.from('profiles').update({ is_approved: true }).in('id', idsToUpdate);
              if (error) throw error;
              setMembers(prev => prev.map(m => idsToUpdate.includes(m.id) ? { ...m, is_approved: true } : m));
            } catch (error) { Alert.alert("Error", error.message); }
          } 
        }
      ]
    );
  };

  const openPicker = (id, title, field, options) => {
    setActiveSelection({ id, title, field, options });
    setModalVisible(true);
  };

  const handleSelect = (val) => {
    updateField(activeSelection.id, activeSelection.field, val);
    setModalVisible(false);
  };

  const renderMember = ({ item }) => (
    <View style={styles.ultraCard}>
      {/* 1 & 2. Username (Bold White) and Role (Cyan) */}
      <View style={styles.nameSection}>
        <Text style={styles.nameText} numberOfLines={1}>{item.user_name || 'no_username'}</Text>
        <Text style={styles.roleText}>{item.role?.toUpperCase() || 'MEMBER'}</Text>
      </View>

      {/* 3. Categories: Group, Unit, LMS */}
      <View style={styles.categorySection}>
        <TouchableOpacity style={styles.catBox} onPress={() => openPicker(item.id, "Age Group", "group_age", OPTIONS.group)}>
          <Text style={styles.catLabel}>GRP</Text>
          <Text style={styles.catVal} numberOfLines={1}>{item.group_age || 'Set'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.catBox} onPress={() => openPicker(item.id, "Unit", "unit", OPTIONS.unit)}>
          <Text style={styles.catLabel}>UNIT</Text>
          <Text style={styles.catVal}>{item.unit || '0'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.catBox} onPress={() => openPicker(item.id, "LMS Level", "lms_level", OPTIONS.level)}>
          <Text style={styles.catLabel}>LMS</Text>
          <Text style={styles.catVal} numberOfLines={1}>{item.lms_level || 'Set'}</Text>
        </TouchableOpacity>
      </View>

      {/* 4. ACCESS Section */}
      <View style={styles.accessWrapper}>
        <Text style={styles.accessTitle}>ACCESS</Text>
        <View style={styles.accessSection}>
          {[
            { id: 'dashboard', icon: 'view-dashboard' },
            { id: 'attendance', icon: 'calendar-check' },
            { id: 'gospel', icon: 'chart-line' },
            { id: 'profile', icon: 'account' }
          ].map((tab) => (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.accessIcon} 
              onPress={() => toggleTab(item.id, item.tab_access, tab.id)}
            >
              <MaterialCommunityIcons 
                name={tab.icon} 
                size={14} 
                color={item.tab_access?.[tab.id] ? COLORS.primary : '#323640'} // Iniahon mula #333 para matukoy agad kung patay ang feature access
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Assigned as Group Admin (Switch Button) */}
      <View style={styles.switchSection}>
        <Text style={styles.switchLabel}>ADMIN</Text>
        <TouchableOpacity 
          onPress={() => {
            const newRole = item.role === 'super_admin' ? 'member' : 'super_admin';
            updateField(item.id, 'role', newRole);
          }}
        >
          <MaterialCommunityIcons 
            name={item.role === 'super_admin' ? "toggle-switch" : "toggle-switch-off-outline"} 
            size={28} 
            color={item.role === 'super_admin' ? COLORS.primary : '#444a57'} // Mas litaw mula sa #444 kapag naka-disable
          />
        </TouchableOpacity>
      </View>

      {/* 6. Check-Circle for Member's Approval */}
      <View style={styles.actionSection}>
        <TouchableOpacity onPress={() => updateField(item.id, 'is_approved', !item.is_approved)}>
          <MaterialCommunityIcons 
            name={item.is_approved ? "check-circle" : "clock-alert-outline"} 
            size={22} 
            color={item.is_approved ? COLORS.success : COLORS.danger} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{activeSelection.title}</Text>
              <ScrollView style={{maxHeight: 250}}>
                {activeSelection.options.map((opt, index) => (
                  <TouchableOpacity key={index} style={styles.modalOption} onPress={() => handleSelect(opt)}>
                    <Text style={styles.modalOptionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.titleRow}>
           <Text style={styles.title}>Zion Control Center</Text>
           <TouchableOpacity onPress={fetchMembers}>
             <MaterialCommunityIcons name="refresh" size={20} color={COLORS.primary} />
           </TouchableOpacity>
        </View>
        
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TextInput style={styles.filterInput} placeholder="Group" placeholderTextColor="#5c6270" value={searchGroup} onChangeText={setSearchGroup} />
            <TextInput style={[styles.filterInput, {flex: 0.4}]} placeholder="Unit" placeholderTextColor="#5c6270" keyboardType="numeric" value={searchUnit} onChangeText={setSearchUnit} />
            <TextInput style={styles.filterInput} placeholder="LMS" placeholderTextColor="#5c6270" value={searchLevel} onChangeText={setSearchLevel} />
          </View>
          <TouchableOpacity style={styles.bulkBtn} onPress={bulkApprove}>
            <MaterialCommunityIcons name="check-all" size={20} color={COLORS.success} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="small" color={COLORS.primary} /></View>
      ) : (
        <FlatList 
          data={filteredMembers} 
          renderItem={renderMember} 
          keyExtractor={item => item.id} 
          ListEmptyComponent={<Text style={{color: COLORS.subtext, textAlign: 'center', marginTop: 20, fontWeight: '600'}}>No members found for Zion [{zionCode}].</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    padding: 8 
  },
  header: { 
    marginBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#16161a', 
    paddingBottom: 12 
  },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  title: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '900',
    letterSpacing: 0.5
  },
  filterContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    width: '100%' 
  },
  filterRow: { 
    flexDirection: 'row', 
    gap: 5, 
    flex: 1 
  },
  filterInput: { 
    flex: 1, 
    backgroundColor: COLORS.input, 
    color: '#fff', 
    fontSize: 11, 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  bulkBtn: { 
    padding: 8, 
    backgroundColor: '#16161a', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    justifyContent: 'center' 
  },
  ultraCard: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.card, 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 6, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#232329' 
  },
  nameSection: { 
    flex: 1.2 
  },
  nameText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '900' 
  }, 
  roleText: { 
    color: COLORS.primary, 
    fontSize: 8, 
    fontWeight: '800', 
    marginTop: 2,
    letterSpacing: 0.3
  }, 
  categorySection: { 
    flex: 2, 
    flexDirection: 'row', 
    gap: 4, 
    marginHorizontal: 4 
  },
  catBox: { 
    backgroundColor: COLORS.surface, 
    padding: 5, 
    borderRadius: 6, 
    flex: 1, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    minHeight: 35, 
    justifyContent: 'center' 
  },
  catLabel: { 
    fontSize: 7, 
    fontWeight: '900', 
    color: COLORS.primary 
  },
  catVal: { 
    fontSize: 9, 
    fontWeight: '700', 
    color: COLORS.silver 
  },
  accessWrapper: { 
    flex: 1, 
    alignItems: 'center', 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border, 
    paddingHorizontal: 4 
  },
  accessTitle: { 
    color: COLORS.subtext, 
    fontSize: 7, 
    fontWeight: '900', 
    marginBottom: 4,
    letterSpacing: 0.3
  },
  accessSection: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 6 
  },
  accessIcon: { 
    padding: 2 
  },
  switchSection: { 
    flex: 0.8, 
    alignItems: 'center', 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border 
  },
  switchLabel: { 
    color: COLORS.subtext, 
    fontSize: 7, 
    fontWeight: '900',
    marginBottom: 2
  },
  actionSection: { 
    flex: 0.5, 
    alignItems: 'flex-end' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: COLORS.overlay, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContainer: { 
    width: '85%', 
    maxWidth: 350 
  },
  modalContent: { 
    backgroundColor: COLORS.card, 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  modalTitle: { 
    color: COLORS.primary, 
    fontSize: 16, 
    fontWeight: '900', 
    marginBottom: 15, 
    textAlign: 'center',
    letterSpacing: 0.5
  },
  modalOption: { 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#232329' 
  },
  modalOptionText: { 
    color: COLORS.silver, 
    fontSize: 14, 
    textAlign: 'center',
    fontWeight: '600'
  },
  closeBtn: { 
    marginTop: 15, 
    padding: 12, 
    backgroundColor: '#16161a', 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329'
  },
  closeBtnText: { 
    color: COLORS.danger, 
    textAlign: 'center', 
    fontWeight: '900' 
  }
});