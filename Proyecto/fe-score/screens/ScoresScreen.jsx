import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from '../components/Main';
const database = require('../database.json');

// Componente para mostrar cada partido con estilo de tarjeta
function MatchCard({ match, onToggle }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.card}>
        {/* Header: fecha y estado */}
        <View style={styles.header}>
          <Text style={styles.date}>{match.date}</Text>
          <Text style={styles.status}>{match.finished ? 'Finalizado' : 'En juego'}</Text>
        </View>

        {/* Equipos y marcador */}
        <View style={styles.scoreRow}>
          <View style={styles.team}>
            <Image source={match.homeLogo} style={styles.logo} />
            <Text style={styles.teamName}>{match.homeName}</Text>
          </View>

          <Text style={styles.score}>
            {match.scoreA} <Text style={styles.dash}>–</Text> {match.scoreB}
          </Text>

          <View style={styles.team}>
            <Image source={match.awayLogo} style={styles.logo} />
            <Text style={styles.teamName}>{match.awayName}</Text>
          </View>
        </View>

        {/* Goleadores */}
        <View style={styles.scorers}>
          {match.goals.map((g, i) => (
            <Text key={i} style={styles.scorerText}>
              {g.player} {g.minute}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ScoresScreen() {
  const [sections, setSections] = useState([]);

  // Carga y prepara secciones desde AsyncStorage o database.json
  const loadSections = useCallback(async () => {
    try {
      const fetched = await Promise.all(
        categories.map(async cat => {
          const key = `sections_${cat.key}`;
          const stored = await AsyncStorage.getItem(key);
          let list = stored ? JSON.parse(stored) : database[cat.key] || [];
          const finished = list.filter(s => s.finished);
          const data = finished.map(s => ({
            id: s.id.toString(),
            catKey: cat.key,
            date: s.date || '',           // debe existir en tus datos
            finished: s.finished,
            homeLogo: { uri: s.logoA },  // URL o asset local
            awayLogo: { uri: s.logoB },
            homeName: s.codeA,
            awayName: s.codeB,
            scoreA: s.scoreA,
            scoreB: s.scoreB,
            goals: s.goals || []         // array de { player, minute }
          }));
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

  // Alterna finished y recarga
  const toggleFinished = async item => {
    try {
      const key = `sections_${item.catKey}`;
      const stored = await AsyncStorage.getItem(key);
      let list = stored ? JSON.parse(stored) : database[item.catKey] || [];
      list = list.map(match =>
        match.id.toString() === item.id
          ? { ...match, finished: !match.finished }
          : match
      );
      await AsyncStorage.setItem(key, JSON.stringify(list));
      loadSections();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del partido');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section: { title, data } }) =>
          data.length > 0 ? <Text style={styles.sectionHeader}>{title}</Text> : null
        }
        renderItem={({ item }) => (
          <MatchCard match={item} onToggle={() => toggleFinished(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 16,
    paddingTop: 16
  },
  list: {
    paddingBottom: 16
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginVertical: 8,
    padding: 12,
    // sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // sombra Android
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#555',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    alignItems: 'center',
    width: 80,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  dash: {
    fontSize: 28,
    fontWeight: '300',
    color: '#AAA',
  },
  scorers: {
    marginTop: 8,
  },
  scorerText: {
    fontSize: 12,
    color: '#444',
    marginVertical: 2,
  },
  separator: {
    height: 8,
  },
});