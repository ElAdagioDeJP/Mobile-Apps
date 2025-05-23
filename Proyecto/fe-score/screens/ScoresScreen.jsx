// src/screens/ScoresScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
} from 'react-native';

// Reutilizamos categorías definidas en Main.js
import { categories } from '../components/Main';

// Ejemplo de datos de partidos finalizados por categoría
const finishedMatches = {
  futbol: [
    { id: 'f1', home: 'Equipo A', away: 'Equipo B', score: '2 - 1' },
    { id: 'f2', home: 'Equipo C', away: 'Equipo D', score: '0 - 3' },
  ],
  baloncesto: [
    { id: 'b1', home: 'Team X', away: 'Team Y', score: '98 - 95' },
  ],
  ajedrez: [
    { id: 'c1', home: 'Magnus Carlsen', away: 'Hikaru Nakamura', score: '1 - 0' },
  ],
  voleibol: [
    { id: 'v1', home: 'Volley A', away: 'Volley B', score: '3 - 2' },
  ],
  atletismo: [
    { id: 'a1', home: 'Usain Bolt', away: 'Yohan Blake', score: '9.58 s' },
  ],
};

// Generamos sección por categoría con sus partidos
const sections = categories.map(cat => ({
  title: cat.label,
  data: finishedMatches[cat.key] || [],
}));

export default function ScoresScreen() {
  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.matchRow}>
            <Text style={styles.matchText}>
              {item.home} vs {item.away}
            </Text>
            <Text style={styles.scoreText}>{item.score}</Text>
          </View>
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
    paddingTop: 16,
  },
  list: {
    paddingBottom: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchText: {
    fontSize: 16,
    color: '#333',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  separator: {
    height: 8,
  },
});
