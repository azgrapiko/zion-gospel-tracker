import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#26f7ff',
  card: '#111',
  text: '#ffffff',
  subtext: '#444',
  border: '#222'
};

export default function AttendanceCard() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Attendance Update</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholderIconBox}>
          <MaterialCommunityIcons name="hammer-wrench" size={40} color={COLORS.subtext} />
        </View>
        <Text style={styles.mainText}>Attendance Update Coming Soon</Text>
        <Text style={styles.subText}>
          Kasalukuyang dine-develop ang feature na ito para sa mas mabilis na pag-track ng attendance sa Zion.
        </Text>
      </View>
      
      <View style={styles.footerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  placeholderIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    marginBottom: 15,
  },
  mainText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  subText: {
    color: COLORS.subtext,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  footerLine: {
    height: 2,
    backgroundColor: COLORS.primary,
    width: '30%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 1,
    opacity: 0.3,
  }
});