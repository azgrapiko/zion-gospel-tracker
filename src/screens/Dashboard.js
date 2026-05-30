import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TouchableOpacity, Dimensions, Modal 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../store/authStore';
import { supabase } from '../utils/supabase'; // Tiyak na koneksyon para sa live branch ranking data

// SIGURADONG TAMA NA PATHS PARA SA COMPONENTS
import GoalForm from './dashboard/GoalForm';
import RankingCard from './dashboard/RankingCard';
import AttendanceCard from './dashboard/AttendanceCard';

const { width } = Dimensions.get('window');

// MATERIAL DARK UI: Pinataas ang contrast ng text at subtext para sa malinis na readability
const COLORS = {
  primary: '#26f7ff',       // Cyan Highlight
  background: '#050505',    // Deep Canvas Background
  card: '#121214',          // Slightly elevated Material Dark Card background
  text: '#ffffff',          // Pure White for Main Headings
  accent: '#ff4d4d',
  subtext: '#a0a5b5',       // Mula #666, itinaas sa Soft Slate Gray para mas madaling mabasa ang mga labels
  silver: '#e1e4ed',        // Bagong dagdag para sa high-contrast body text
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

  // REALTIME STATE PARA SA LIVE RANKING CARD
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  // --- ENGINE STATES PARA SA ROTATING BUBBLE REMINDER ---
  const [reminderText, setReminderText] = useState('');
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [hasClosedManually, setHasClosedManually] = useState(false);

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

  /**
   * DYNAMIC MULTI-TENANCY FETCHING LOGIC
   * Hinahatak ang totoong profiles data base sa branch isolation (zion_code) ng naka-login na admin.
   */
  const fetchBranchRankings = async () => {
    try {
      if (!userProfile?.zion_code) return;
      
      console.log("📡 DASHBOARD: Fetching live rankings for branch:", userProfile.zion_code);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_name, group_age, preach_pct, activity_pct')
        .eq('zion_code', userProfile.zion_code)
        .order('preach_pct', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setActiveWorkers(data);
      }
    } catch (err) {
      console.error("❌ DASHBOARD: Error fetching branch rankings:", err.message);
    } finally {
      setLoadingWorkers(false);
    }
  };

  /**
   * RANKING POLLING TIMER
   */
  useEffect(() => {
    fetchBranchRankings();
    const rankInterval = setInterval(fetchBranchRankings, 10000);
    return () => clearInterval(rankInterval);
  }, [userProfile?.zion_code]);

  // --- ADVANCED ROTATION ENGINE FOR PAALALA BUBBLE ---
  useEffect(() => {
    if (hasClosedManually) return;

    let isMounted = true;
    let timerId = null;

    // Helper to format 24h to 12h display
    const formatTo12Hr = (timeStr) => {
      if (!timeStr) return "8:00pm";
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours);
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12 || 12;
      return `${h}:${minutes}${ampm}`;
    };

    // Main execution function for running the sequence steps
    const runSequence = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('@notif_settings');
        const savedTimes = await AsyncStorage.getItem('@notif_times');

        if (!savedSettings || !isMounted) return;

        const settings = JSON.parse(savedSettings);
        const times = JSON.parse(savedTimes) || {};

        // Kuhanin ang lahat ng activities na kasalukuyang naka-ON ang switch
        const enabledActivities = Object.keys(settings).filter(id => settings[id]);

        if (enabledActivities.length === 0) {
          if (isMounted) setIsBubbleVisible(false);
          // Kung walang naka-ON, subukan muli paglipas ng 10 segundo
          timerId = setTimeout(runSequence, 10000);
          return;
        }

        // Sequential text template renderer engine
        const getTemplateText = (id, rawTime) => {
          const time = formatTo12Hr(rawTime);
          if (id === 'sermon') return `Ngayong ${time} nakatakda ang Sermon mo\nANIMO 😊`;
          if (id === 'prayer') return `Malapit na takdang oras ${time} para Player Activity, many blessing po 😊`;
          if (id === 'preaching') return `Preaching schedule niyo ay ${time}, ANIMO🙂`;
          if (id === 'online') return `Oras na para sa iyong Online Mission ngayong ${time}, maging masigasig po! 👍`;
          if (id === 'zion') return `Zion Activity mo sa darating na ${time}, laging maging handa Brother! 🏢`;
          if (id === 'edulms') return `EduLMS Review Time ngayong ${time}, patuloy sa pag-unlad! 📚`;
          return `Paalala para sa iyong Activity ngayong ${time}. Mabiyagang araw po! ✨`;
        };

        // Inner loop function to step through each enabled activity item
        let index = 0;
        const displayNext = () => {
          if (!isMounted) return;

          if (index < enabledActivities.length) {
            const actId = enabledActivities[index];
            const actTime = times[actId] || "20:00";
            
            setReminderText(getTemplateText(actId, actTime));
            setIsBubbleVisible(true);
            
            index++;
            // Manatiling nakabukas ang kasalukuyang bubble sa loob ng 10 segundo bago lumipat sa susunod
            timerId = setTimeout(displayNext, 10000);
          } else {
            // Naitampok na ang lahat ng paalala: Kusang itatago ang bubble sa loob ng 30 segundo
            setIsBubbleVisible(false);
            // Pagkatapos ng 30 segundong cooldown pause, magsisimula muli ang loop mula sa unahan
            timerId = setTimeout(runSequence, 3000); 
          }
        };

        displayNext();

      } catch (e) {
        console.error("❌ DASHBOARD BUBBLE ROTATION ERROR:", e);
        if (isMounted) timerId = setTimeout(runSequence, 10000);
      }
    };

    runSequence();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [hasClosedManually]);

  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());

  const userAvatar = (userProfile?.avatar_url && userProfile.avatar_url !== "[object Object]") 
    ? (typeof userProfile.avatar_url === 'number' ? userProfile.avatar_url : { uri: String(userProfile.avatar_url) })
    : require('../../assets/man5.png');

  /**
   * UPDATED SAVE HANDLER
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

          {/* RIGHT ROW: AVATAR AND ROTATING POP REMINDER BUBBLE */}
          <View style={styles.headerRight}>
            
            {/* DYNAMIC ROTATING SMART REMINDER BUBBLE */}
            {isBubbleVisible && (
              <View style={styles.reminderBubble}>
                {/* Pointer Arrow Tail for Bubble UI positioning */}
                <View style={styles.bubbleArrow} />
                <TouchableOpacity 
                  style={styles.closeBubbleBtn} 
                  onPress={() => {
                    setIsBubbleVisible(false);
                    setHasClosedManually(true);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={12} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.reminderBubbleText}>{reminderText}</Text>
              </View>
            )}

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

            {/* CONDITIONAL RENDERING */}
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
             <RankingCard rankingData={activeWorkers} />
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
  userName: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 }, 
  zionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16161a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#2d3139' },
  zionCodeText: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold', marginLeft: 5 },
  
  headerRight: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  avatarWrapper: { position: 'relative', marginTop: 2 },
  avatarImg: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 2, borderColor: COLORS.primary },
  levelBadge: { position: 'absolute', bottom: -8, right: -2, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 0.5, borderRadius: 12, elevation: 5 },
  levelText: { color: '#000', fontSize: 11, fontWeight: '900' },
  
  // PREMIUM REMINDER POP BUBBLE COMPONENT DESIGN 
  reminderBubble: {
    backgroundColor: '#1c1c24',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    maxWidth: 210,
    marginRight: 14,
    position: 'relative',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8
  },
  bubbleArrow: {
    position: 'absolute',
    right: -8,
    top: '40%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: COLORS.primary
  },
  reminderBubbleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    paddingRight: 10
  },
  closeBubbleBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },

  cardsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  goalCardContainer: { 
    backgroundColor: COLORS.card, 
    width: '56%', 
    borderRadius: 20, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#232329', 
    minHeight: 400, 
  },
  rankingHalfCard: { width: '41%' },
  goalHeaderRow: { marginBottom: 12 },
  goalCardMainTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' }, 
  goalMonthSub: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
  
  goalLayersScroll: { flex: 1, marginVertical: 5 },
  goalLayer: { borderBottomWidth: 1, borderBottomColor: '#232329', paddingVertical: 12 },
  layerTitleText: { color: COLORS.primary, fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 0.5 }, 
  
  attCenterBlock: { alignItems: 'center', justifyContent: 'center' },
  attSubLabel: { color: COLORS.silver, fontSize: 10, marginBottom: 4, fontWeight: '700' }, 
  attValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  attPrefix: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  attNumber: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  
  preachGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 },
  preachItem: { alignItems: 'center' },
  numValue: { color: COLORS.primary, fontSize: 20, fontWeight: '900' },
  whiteMiniLabel: { color: COLORS.white, fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  
  evaEntry: { marginBottom: 12, paddingLeft: 5 },
  evaNameText: { color: COLORS.white, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }, 
  evaDetailText: { color: COLORS.subtext, fontSize: 10, fontWeight: '700', marginTop: 1 }, 

  emptyText: { color: COLORS.subtext, fontSize: 11, fontStyle: 'italic', marginTop: 8 }, 
  setGoalBtn: { backgroundColor: 'rgba(38, 247, 255, 0.1)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(38, 247, 255, 0.4)', marginTop: 10 },
  setGoalText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  footerBrandWrapper: { marginTop: 10 },
  footerBrand: { color: '#33333d', textAlign: 'center', fontSize: 10, fontWeight: 'bold' } 
});