import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// MATERIAL DARK UI: Pinataas ang contrast ng text colors at panel strokes para sa madaling pagbasa
const COLORS = {
  primary: '#26f7ff',
  card: '#121214',          // Swapped mula #111 para sa tamang material depth consistency
  itemBg: '#18181c',        // Itinaas ng kaunti mula #161616 para mabigyan ng lunas ang eye strain
  text: '#ffffff',          // Pure White mula #eee
  subtext: '#a0a5b5',       // Iniahon mula #666 patungong readable Slate Gray
  silver: '#d1d4dc',        // Bagong contrast tier para sa list text blocks
  gold: '#f1c40f',
  rankCyan: '#26f7ff'
};

// Assets mapping para sa stars - Nananatiling intact
const RANK_ICONS = {
  1: require('../../../assets/1st_star.png'),
  2: require('../../../assets/2nd_star.png'),
  3: require('../../../assets/3rd_star.png'),
  4: require('../../../assets/4th_star.png'),
  5: require('../../../assets/5th_star.png'),
};

export default function RankingCard({ rankingData }) {
  
  const renderMember = ({ item, index }) => {
    const rank = index + 1;
    const hasStar = rank <= 5; // Top 1 to 5 lang ang may star icon

    // DATABASE COMPATIBILITY DATA MAPPING
    // Isinasalin ang real database structure (user_name at group_age) mula sa Supabase table profiles
    const memberName = item.user_name || 'Gospel Worker';
    const groupAge = item.group_age || item.groupAge || ''; 
    const preachPct = item.preach_pct ?? item.preachPct ?? '0';
    const activityPct = item.activity_pct ?? item.activityPct ?? '0';

    return (
      <View style={[styles.rankRow, rank === 1 && styles.topRankBorder]}>
        <View style={styles.leftInfo}>
          <Text style={styles.rankNumber}>{rank}</Text>
          <View style={styles.nameGroup}>
            <View style={styles.nameHeader}>
              <Text 
                style={styles.memberName} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {memberName}
              </Text>
              {groupAge !== '' && (
                <Text style={styles.groupAgeText}> • {groupAge}</Text>
              )}
            </View>
            
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Preach: </Text>
              <Text style={styles.statValue}>{preachPct}%</Text>
              <Text style={[styles.statLabel, {marginLeft: 8}]}>Activity: </Text>
              <Text style={styles.statValue}>{activityPct}%</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.rightInfo}>
          {hasStar ? (
            <Image source={RANK_ICONS[rank]} style={styles.starIcon} />
          ) : (
            // Empty view para sa rank 6-10 para pantay ang layout
            <View style={{width: 22}} />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="trophy-variant" size={18} color={COLORS.gold} />
          <Text style={styles.cardTitle}>Top Active Workers</Text>
        </View>
        <Text style={styles.subLabel}>The Top Gospel Worker this Week</Text>
        <Text style={styles.updateNote}>Updates: Every Friday 11:59PM</Text>
      </View>

      <FlatList
        data={rankingData?.slice(0, 10)} // Kukuha na ng Top 10
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderMember}
        scrollEnabled={true} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="timer-sand" size={30} color="#444" />
            <Text style={styles.emptyText}>Calculating weekly rankings...</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#232329', // Mas litaw na framework boarder ring
    height: '100%',
    flex: 1,
  },
  header: {
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  subLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  updateNote: {
    color: COLORS.subtext, // Slate gray para hindi maglaho sa dilim
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 1,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.itemBg,
    paddingVertical: 10, // Optimized spacing
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#25252b', // Binigyan ng banayad na inner border separation
  },
  topRankBorder: {
    borderColor: COLORS.primary + '55', // Bahagyang pinalakas ang glow factor para sa Rank 1
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Powering the flex expansion
    marginRight: 5,
  },
  rankNumber: {
    color: COLORS.rankCyan,
    fontSize: 16,
    fontWeight: '900',
    width: 25,
    textAlign: 'center'
  },
  nameGroup: {
    marginLeft: 10,
    flex: 1, // Essential para sa automatic text wrapping
  },
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // UI Fix: Pinapababa ang GroupAge kung siksikan
  },
  memberName: {
    color: '#ffffff', // Solid pure white para sa pangalan ng live users
    fontSize: 12, // Adjusted size para sa better fit
    fontWeight: 'bold',
    flexShrink: 1, // UI Fix: Pinipigilan ang pagtulak sa Star Icon
  },
  groupAgeText: {
    color: COLORS.silver, // Iniahon mula #666 para madaling mabasa ang age tier ng rankers
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 2,
    alignItems: 'center'
  },
  statLabel: {
    color: COLORS.subtext, // Pinalinaw mula #555 para madaling makita ang "Preach:" at "Activity:" markers
    fontSize: 8,
    fontWeight: 'bold',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
  },
  rightInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 30, // Fixed width para pantay ang vertical alignment ng stars
  },
  starIcon: {
    width: 20, // UI Fix: Resized mula 24 para hindi siksikan
    height: 20,
    resizeMode: 'contain',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: COLORS.subtext, // Madaling basahin kapag walang loading blocks
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center'
  }
});