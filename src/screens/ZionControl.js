import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, TextInput, Modal, ScrollView 
} from 'react-native';
import { supabase } from '../utils/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore'; 

const COLORS = {
  primary: '#26f7ff',
  background: '#0f0f0f',
  card: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  danger: '#ff4444',
  success: '#00c853',
  border: '#222',
  input: '#1a1a1a',
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
  
  // Binago: Gagamit tayo ng userProfile directly para sa initial check
  const { zionCode, userProfile } = useAuthStore();
  
  const [searchGroup, setSearchGroup] = useState('');
  const [searchUnit, setSearchUnit] = useState('');
  const [searchLevel, setSearchLevel] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [activeSelection, setActiveSelection] = useState({ id: null, field: null, title: '', options: [] });

  const fetchMembers = useCallback(async () => {
    console.log("===== ZION CONTROL FETCH DEBUG =====");
    
    // 1. Siguraduhin na ang profile at ang zionCode ng Admin ay loaded na
    if (!userProfile?.id || !zionCode) {
      console.warn("Fetch waiting: Admin Profile or Zion Code is missing.");
      return;
    }

    try {
      setLoading(true);
      
      // Simulan ang query sa profiles table
      let query = supabase.from('profiles').select('*');
      
      // 2. Admin Check: Nakabase sa Role at Username
      const isAdmin = userProfile?.role === 'super_admin' || 
                      userProfile?.user_name === 'admin_plaridel';
      
      console.log("Filtering for Zion:", zionCode, "as Admin:", isAdmin);

      if (isAdmin) {
        /**
         * MULTI-TENANCY FILTER (Strict Isolation):
         * Ang Admin ay makakakita lamang ng:
         * - Members na kapareho ng kanyang zion_code (e.g., 'PLA' only)
         * - OR lahat ng accounts na 'super_admin' (para makita ang ibang leaders/admins)
         */
        query = query.or(`zion_code.eq.${zionCode},role.eq.super_admin`);
      } else {
        /**
         * Para sa regular users/members (kung may access sila sa list):
         * Tanging ang sariling branch lang ang makikita nila.
         */
        query = query.eq('zion_code', zionCode);
      }

      // 3. I-sort base sa Full Name para maayos ang listahan
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
    // Dependency array: tatakbo ulit ito kapag nagbago ang zionCode o profile
  }, [zionCode, userProfile]);

  useEffect(() => { 
    isMounted.current = true;
    
    // Trigger fetch kapag may profile na
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
                color={item.tab_access?.[tab.id] ? COLORS.primary : '#333'} 
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
            color={item.role === 'super_admin' ? COLORS.primary : '#444'} 
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
            <TextInput style={styles.filterInput} placeholder="Group" placeholderTextColor="#444" value={searchGroup} onChangeText={setSearchGroup} />
            <TextInput style={[styles.filterInput, {flex: 0.4}]} placeholder="Unit" placeholderTextColor="#444" keyboardType="numeric" value={searchUnit} onChangeText={setSearchUnit} />
            <TextInput style={styles.filterInput} placeholder="LMS" placeholderTextColor="#444" value={searchLevel} onChangeText={setSearchLevel} />
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
          ListEmptyComponent={<Text style={{color: '#444', textAlign: 'center', marginTop: 20}}>No members found for Zion [{zionCode}].</Text>}
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
    borderBottomColor: '#1a1a1a', 
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
    fontWeight: 'bold' 
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
    fontSize: 10, 
    paddingVertical: 6, 
    paddingHorizontal: 8, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#222' 
  },
  bulkBtn: { 
    padding: 6, 
    backgroundColor: '#111', 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#222', 
    justifyContent: 'center' 
  },
  ultraCard: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.card, 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 6, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#1a1a1a' 
  },
  nameSection: { 
    flex: 1.2 
  },
  nameText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '900' 
  }, // Bold White Username
  roleText: { 
    color: COLORS.primary, 
    fontSize: 8, 
    fontWeight: '700', 
    marginTop: 2 
  }, // Cyan Role
  categorySection: { 
    flex: 2, 
    flexDirection: 'row', 
    gap: 4, 
    marginHorizontal: 4 
  },
  catBox: { 
    backgroundColor: COLORS.surface, 
    padding: 5, 
    borderRadius: 4, 
    flex: 1, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#222', 
    minHeight: 35, 
    justifyContent: 'center' 
  },
  catLabel: { 
    fontSize: 7, 
    fontWeight: 'bold', 
    color: COLORS.primary 
  },
  catVal: { 
    fontSize: 9, 
    fontWeight: '600', 
    color: '#fff' 
  },
  accessWrapper: { 
    flex: 1, 
    alignItems: 'center', 
    borderLeftWidth: 1, 
    borderLeftColor: '#222', 
    paddingHorizontal: 4 
  },
  accessTitle: { 
    color: '#fff', 
    fontSize: 7, 
    fontWeight: 'bold', 
    marginBottom: 4 
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
    borderLeftColor: '#222' 
  },
  switchLabel: { 
    color: '#444', 
    fontSize: 6, 
    fontWeight: 'bold' 
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
    borderRadius: 12, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.primary 
  },
  modalTitle: { 
    color: COLORS.primary, 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  modalOption: { 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1a1a1a' 
  },
  modalOptionText: { 
    color: '#fff', 
    fontSize: 14, 
    textAlign: 'center' 
  },
  closeBtn: { 
    marginTop: 15, 
    padding: 10, 
    backgroundColor: '#1a1a1a', 
    borderRadius: 8 
  },
  closeBtnText: { 
    color: COLORS.danger, 
    textAlign: 'center', 
    fontWeight: 'bold' 
  }
});