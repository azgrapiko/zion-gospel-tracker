import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#26f7ff',
  card: '#111',
  itemBg: '#161616',
  text: '#eee',
  subtext: '#666',
  gold: '#f1c40f',
  rankCyan: '#26f7ff'
};

// Assets mapping para sa stars
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

    return (
      <View style={[styles.rankRow, rank === 1 && styles.topRankBorder]}>
        <View style={styles.leftInfo}>
          <Text style={styles.rankNumber}>{rank}</Text>
          <View style={styles.nameGroup}>
            <View style={styles.nameHeader}>
              <Text style={styles.memberName} numberOfLines={1}>
                {item.name || 'Gospel Worker'}
              </Text>
              {item.groupAge && (
                <Text style={styles.groupAgeText}> • {item.groupAge}</Text>
              )}
            </View>
            
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Preach: </Text>
              <Text style={styles.statValue}>{item.preachPct || '0'}%</Text>
              <Text style={[styles.statLabel, {marginLeft: 8}]}>Activity: </Text>
              <Text style={styles.statValue}>{item.activityPct || '0'}%</Text>
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
        scrollEnabled={true} // In-enable ko para ma-scroll ang top 10 list
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="timer-sand" size={30} color="#333" />
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
    borderColor: '#222',
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
    color: COLORS.subtext,
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 1,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.itemBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  topRankBorder: {
    borderColor: COLORS.primary + '44', // Slight glow para sa Rank 1
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    color: COLORS.rankCyan,
    fontSize: 16,
    fontWeight: '900',
    width: 25,
    textAlign: 'center'
  },
  nameGroup: {
    marginLeft: 12,
    flex: 1,
  },
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  memberName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  groupAgeText: {
    color: COLORS.subtext,
    fontSize: 10,
    fontWeight: '600'
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  statLabel: {
    color: '#555',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  rightInfo: {
    marginLeft: 10,
  },
  starIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#444',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center'
  }
});