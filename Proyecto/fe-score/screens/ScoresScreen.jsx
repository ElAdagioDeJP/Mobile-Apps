import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from '../components/Main';
const database = require('../database.json');

// Card para atletismo: muestra posiciones y género como ícono
function AtletismoCard({ item }) {
  const genderIcon = item.gender === 'femenino' ? 'gender-female' : 'gender-male';
  return (
    <View style={styles.card}>
      <View style={styles.header}>  
        <Text style={styles.status}>{item.finished ? 'Cerrado' : 'En curso'}</Text>
        <Icon name={genderIcon} size={20} style={styles.genderIcon} />
      </View>
      <FlatList
        data={item.positions}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item: pos, index }) => (
          <View style={styles.positionRow}>
            <Text style={styles.positionLabel}>{`${index + 1}°:`}</Text>
            <Text style={styles.positionValue}>{pos}</Text>
          </View>
        )}
      />
    </View>
  );
}

// Card para otros deportes: marcador, goleadores y género como ícono
function MatchCard({ match }) {
  const genderIcon = match.gender
    ? match.gender === 'femenino'
      ? 'gender-female'
      : 'gender-male'
    : null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{match.date}</Text>
        <Text style={styles.status}>{match.finished ? 'Finalizado' : 'En juego'}</Text>
        {genderIcon && <Icon name={genderIcon} size={20} style={styles.genderIcon} />}
      </View>
      <View style={styles.scoreRow}>
        <View style={styles.team}>
          <Image source={match.homeLogo} style={styles.logo} />
          <Text style={styles.teamName}>{match.homeName}</Text>
        </View>
        <Text style={styles.score}>{match.scoreA} <Text style={styles.dash}>–</Text> {match.scoreB}</Text>
        <View style={styles.team}>
          <Image source={match.awayLogo} style={styles.logo} />
          <Text style={styles.teamName}>{match.awayName}</Text>
        </View>
      </View>
      <View style={styles.scorers}>
        {match.goals.map((g, i) => (
          <Text key={i} style={styles.scorerText}>
            {g.player} {g.minute}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function ScoresScreen() {
  const [sections, setSections] = useState([]);

  const loadSections = useCallback(async () => {
    try {
      const fetched = await Promise.all(
        categories.map(async cat => {
          const key = `sections_${cat.key}`;
          const stored = await AsyncStorage.getItem(key);
          const list = stored ? JSON.parse(stored) : database[cat.key] || [];
          const finished = list.filter(s => s.finished);

          const data = finished.map(s => {
            if (cat.key.startsWith('atletismo_')) {
              return {
                id: s.id.toString(),
                catKey: cat.key,
                finished: s.finished,
                positions: s.positions || [],
                gender: s.gender,
              };
            }
            return {
              id: s.id.toString(),
              catKey: cat.key,
              date: s.date || '',
              finished: s.finished,
              homeLogo: { uri: s.logoA },
              awayLogo: { uri: s.logoB },
              homeName: s.codeA,
              awayName: s.codeB,
              scoreA: s.scoreA,
              scoreB: s.scoreB,
              goals: s.goals || [],
              gender: s.gender || null,
            };
          });
          return { title: cat.label, data };
        })
      );
      setSections(fetched);
    } catch (error) {
      console.error('Error cargando secciones:', error);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section: { title, data } }) =>
          data.length > 0 && <Text style={styles.sectionHeader}>{title}</Text>
        }
        renderItem={({ item }) =>
          item.catKey.startsWith('atletismo_') ? (
            <AtletismoCard item={item} />
          ) : (
            <MatchCard match={item} />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B39',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  list: {
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FBBF09',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#2D529F',
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#AAA',
    opacity: 0.9,
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF09',
    textTransform: 'uppercase',
  },
  genderIcon: {
    color: '#E8E8E8',
    marginLeft: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  team: {
    alignItems: 'center',
    width: 100,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FBBF09',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  score: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'center',
  },
  dash: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FBBF09',
    marginHorizontal: 10,
  },
  scorers: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 9, 0.2)',
    paddingTop: 10,
  },
  scorerText: {
    fontSize: 13,
    color: '#E8E8E8',
    marginVertical: 3,
    fontWeight: '500',
  },
  separator: {
    height: 10,
    backgroundColor: 'transparent',
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  positionLabel: {
    width: 30,
    fontSize: 18,
    color: '#FBBF09',
  },
  positionValue: {
    fontSize: 18,
    color: '#E8E8E8',
    fontWeight: '700',
  },
});