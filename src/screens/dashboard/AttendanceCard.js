import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// MATERIAL DARK UI: Pinataas ang contrast ng slate at system borders para sa pinakamataas na readability
const COLORS = {
  primary: '#26f7ff',
  card: '#121214',          // Swapped mula #111 para sumabay sa bagong Dashboard elevation
  text: '#ffffff',          // Pure White
  subtext: '#a0a5b5',       // Mula #444, iniangat sa maliwanag na Slate Gray para sa madaling pagbasa
  border: '#232329'         // Higit na litaw na border framing kumpara sa #222
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
          <MaterialCommunityIcons name="hammer-wrench" size={40} color={COLORS.primary} />
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
    backgroundColor: '#16161a', // Mula #0a0a0a, itinaas ang depth ng container fill
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3139',     // Mas malinaw na line alignment ring
    marginBottom: 15,
  },
  mainText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  subText: {
    color: COLORS.subtext, // Pinalinaw ang paragraph text para madaling basahin ang dev advisory
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 20,
    fontWeight: '500'
  },
  footerLine: {
    height: 2,
    backgroundColor: COLORS.primary,
    width: '30%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 1,
    opacity: 0.5, // Bahagyang tinaasan ang visibility mula sa 0.3 para maging solid accent ribbon
  }
});