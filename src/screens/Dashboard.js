import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TouchableOpacity, Dimensions, Modal 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';

// SIGURADONG TAMA NA PATHS PARA SA COMPONENTS
import GoalForm from './dashboard/GoalForm';
import RankingCard from './dashboard/RankingCard';
import AttendanceCard from './dashboard/AttendanceCard';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#26f7ff',
  background: '#050505',
  card: '#111',
  text: '#ffffff',
  accent: '#ff4d4d',
  subtext: '#666',
  white: '#ffffff'
};

export default function Dashboard() {
  /**
   * GLOBAL STORE INTEGRATION
   * loadSavedGoal: Kinukuha ang data mula sa Supabase branch_goals table.
   * role: Ginagamit para sa conditional rendering ng Set Goal button.
   */
  const { userProfile, role, savedGoal, setSavedGoal, loadSavedGoal } = useAuthStore();
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  /**
   * INITIAL LOAD & SYNC
   * Kukunin ang goal data mula sa cloud pagka-load ng dashboard.
   * Mag-re-run ito kung sakaling magbago ang zion_code ng profile.
   */
  useEffect(() => {
    if (userProfile?.zion_code) {
      console.log("📡 DASHBOARD: Fetching goals for branch:", userProfile.zion_code);
      loadSavedGoal();
    }
  }, [userProfile?.zion_code]);

  // DATA PARA SA RANKING (Top 10 Gospel Workers)
  const TOP_WORKERS_DATA = [
    { id: 1, name: 'Bro. Edgar', groupAge: 'MA', preachPct: '98', activityPct: '95' },
    { id: 2, name: 'Sis. Maria', groupAge: 'FA', preachPct: '92', activityPct: '88' },
    { id: 3, name: 'Bro. Juan', groupAge: 'MA', preachPct: '89', activityPct: '90' },
    { id: 4, name: 'Sis. Elena', groupAge: 'FYW', preachPct: '85', activityPct: '82' },
    { id: 5, name: 'Bro. Luis', groupAge: 'MYW', preachPct: '80', activityPct: '75' },
    { id: 6, name: 'Sis. Ana', groupAge: 'FA', preachPct: '78', activityPct: '80' },
    { id: 7, name: 'Bro. Mark', groupAge: 'MYU', preachPct: '75', activityPct: '70' },
    { id: 8, name: 'Sis. Joy', groupAge: 'FYU', preachPct: '72', activityPct: '74' },
    { id: 9, name: 'Bro. Sam', groupAge: 'MMS', preachPct: '70', activityPct: '68' },
    { id: 10, name: 'Sis. Lea', groupAge: 'FMS', preachPct: '65', activityPct: '60' },
  ];

  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());

  const userAvatar = (userProfile?.avatar_url && userProfile.avatar_url !== "[object Object]") 
    ? (typeof userProfile.avatar_url === 'number' ? userProfile.avatar_url : { uri: String(userProfile.avatar_url) })
    : require('../../assets/man5.png');

  /**
   * UPDATED SAVE HANDLER
   * Ngayon ay async na ito para matiyak na tapos ang upload sa Supabase bago isara ang modal.
   */
  const handleSaveGoal = async (newData) => {
    console.log("💾 DASHBOARD: Initiating Cloud Save...");
    await setSavedGoal(newData);
    setGoalModalVisible(false);
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeTitle}>Welcome to Tracker Dashboard</Text>
            <Text style={styles.userName}>{userProfile?.user_name || 'Username'}</Text>
            <div style={{ display: 'none' }}></div>
            <View style={styles.zionBadge}>
              <MaterialCommunityIcons name="office-building" size={14} color={COLORS.primary} />
              <Text style={styles.zionCodeText}>{userProfile?.zion_code || 'PLA'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.avatarWrapper}>
              <Image source={userAvatar} style={styles.avatarImg} />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{userProfile?.lms_level || 'L1'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* TOP CARDS GRID */}
        <View style={styles.cardsGrid}>
          
          {/* 1. LAYERED GOAL CARD VIEW */}
          <View style={styles.goalCardContainer}>
            <View style={styles.goalHeaderRow}>
              <Text style={styles.goalCardMainTitle}>Goal Card</Text>
              <Text style={styles.goalMonthSub}>{`Goal for Month of ${currentMonth}`}</Text>
            </View>
            
            <ScrollView style={styles.goalLayersScroll} showsVerticalScrollIndicator={false}>
                <View>
                  {/* LAYER 1: ATTENDANCE */}
                  <View style={styles.goalLayer}>
                    <Text style={styles.layerTitleText}>ATTENDANCE GOAL</Text>
                    
                    <View style={styles.attCenterBlock}>
                      <Text style={styles.attSubLabel}>Stu & Above:</Text>
                      <View style={styles.attValueRow}>
                        <Text style={styles.attPrefix}>1Time - </Text><Text style={styles.attNumber}>{savedGoal?.attStu1 || 0}</Text>
                        <Text style={styles.attPrefix}>  4Times - </Text><Text style={styles.attNumber}>{savedGoal?.attStu4 || 0}</Text>
                        <Text style={styles.attPrefix}>  Tithes - </Text><Text style={styles.attNumber}>{savedGoal?.attStuT || 0}</Text>
                      </View>
                    </View>

                    <View style={[styles.attCenterBlock, {marginTop: 10}]}>
                      <Text style={styles.attSubLabel}>Overall:</Text>
                      <View style={styles.attValueRow}>
                        <Text style={styles.attPrefix}>1Time - </Text><Text style={styles.attNumber}>{savedGoal?.attOver1 || 0}</Text>
                        <Text style={styles.attPrefix}>  4Times - </Text><Text style={styles.attNumber}>{savedGoal?.attOver4 || 0}</Text>
                        <Text style={styles.attPrefix}>  Tithes - </Text><Text style={styles.attNumber}>{savedGoal?.attOverT || 0}</Text>
                      </View>
                    </View>
                  </View>

                  {/* LAYER 2: PREACHING */}
                  <View style={styles.goalLayer}>
                    <Text style={styles.layerTitleText}>PREACHING GOAL</Text>
                    <View style={styles.preachGrid}>
                      <View style={styles.preachItem}><Text style={styles.numValue}>{savedGoal?.simpleP || 0}</Text><Text style={styles.whiteMiniLabel}>Simple</Text></View>
                      <View style={styles.preachItem}><Text style={styles.numValue}>{savedGoal?.validP || 0}</Text><Text style={styles.whiteMiniLabel}>Valid</Text></View>
                      <View style={styles.preachItem}><Text style={styles.numValue}>{savedGoal?.fruitB || 0}</Text><Text style={styles.whiteMiniLabel}>Fruit</Text></View>
                    </View>
                  </View>

                  {/* LAYER 3: EVANGELIST */}
                  <View style={[styles.goalLayer, {borderBottomWidth: 0}]}>
                    <Text style={styles.layerTitleText}>EVANGELIST GOAL</Text>
                    {savedGoal?.evangelists && savedGoal.evangelists.length > 0 ? (
                      savedGoal.evangelists.map((eva, index) => (
                        <View key={index} style={styles.evaEntry}>
                          <Text style={styles.evaNameText}>{`${index + 1}. ${eva.name.toUpperCase()}`}</Text>
                          <Text style={styles.evaDetailText}>{`${eva.groupAge || 'N/A'} - ${eva.schedule?.join(', ') || 'No Schedule'}`}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No Evangelists set.</Text>
                    )}
                  </View>
                </View>
            </ScrollView>

            {/* CONDITIONAL RENDERING: Admin lang ang may access sa Set Goal button */}
            {role === 'super_admin' && (
              <TouchableOpacity 
                style={styles.setGoalBtn} 
                onPress={() => setGoalModalVisible(true)}
              >
                <Text style={styles.setGoalText}>Set a Goal</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 2. RANKING CARD (Top Active Workers) */}
          <View style={styles.rankingHalfCard}>
             <RankingCard rankingData={TOP_WORKERS_DATA} />
          </View>

        </View>

        {/* LONG ATTENDANCE CARD */}
        <AttendanceCard />

        <View style={styles.footerBrandWrapper}>
          <Text style={styles.footerBrand}>Gem-tech Alpha System v2.0</Text>
        </View>
      </ScrollView>

      {/* GOAL SETTING MODAL */}
      <Modal 
        visible={goalModalVisible} 
        animationType="slide" 
        transparent={false}
      >
        <GoalForm 
          onSave={handleSaveGoal} 
          onClose={() => setGoalModalVisible(false)} 
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 100 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 15, marginBottom: 25, paddingTop: 5 },
  welcomeTitle: { color: COLORS.subtext, fontSize: 14, fontWeight: '800' },
  userName: { color: '#f4f1f1', fontSize: 26, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  zionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#222' },
  zionCodeText: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold', marginLeft: 5 },
  avatarWrapper: { position: 'relative', marginTop: 2 },
  avatarImg: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 2, borderColor: COLORS.primary },
  levelBadge: { position: 'absolute', bottom: -8, right: -2, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 0.5, borderRadius: 12, elevation: 5 },
  levelText: { color: '#000', fontSize: 11, fontWeight: '900' },
  
  cardsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  goalCardContainer: { 
    backgroundColor: COLORS.card, 
    width: '56%', 
    borderRadius: 20, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#222',
    minHeight: 400, 
  },
  rankingHalfCard: { width: '41%' },
  goalHeaderRow: { marginBottom: 12 },
  goalCardMainTitle: { color: '#eee', fontSize: 13, fontWeight: '700' },
  goalMonthSub: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
  
  goalLayersScroll: { flex: 1, marginVertical: 5 },
  goalLayer: { borderBottomWidth: 1, borderBottomColor: '#222', paddingVertical: 12 },
  layerTitleText: { color: COLORS.subtext, fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 0.5 },
  
  attCenterBlock: { alignItems: 'center', justifyContent: 'center' },
  attSubLabel: { color: '#888', fontSize: 10, marginBottom: 4, fontWeight: '700' },
  attValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  attPrefix: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  attNumber: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  
  preachGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 },
  preachItem: { alignItems: 'center' },
  numValue: { color: COLORS.primary, fontSize: 20, fontWeight: '900' },
  whiteMiniLabel: { color: COLORS.white, fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  
  evaEntry: { marginBottom: 12, paddingLeft: 5 },
  evaNameText: { color: COLORS.primary, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  evaDetailText: { color: '#888', fontSize: 10, fontWeight: '700', marginTop: 1 },

  emptyText: { color: '#333', fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  setGoalBtn: { backgroundColor: 'rgba(38, 247, 255, 0.1)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(38, 247, 255, 0.3)', marginTop: 10 },
  setGoalText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  footerBrandWrapper: { marginTop: 10 },
  footerBrand: { color: '#1a1a1a', textAlign: 'center', fontSize: 10, fontWeight: 'bold' }
});