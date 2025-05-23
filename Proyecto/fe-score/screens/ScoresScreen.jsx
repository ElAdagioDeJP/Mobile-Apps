import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from '../components/Main';
const database = require('../database.json');

export default function ScoresScreen() {
  const [sections, setSections] = useState([]);

  // Función para obtener y preparar las secciones
  const loadSections = useCallback(async () => {
    const fetched = await Promise.all(
      categories.map(async cat => {
        const key = `sections_${cat.key}`;
        const stored = await AsyncStorage.getItem(key);
        let list = stored ? JSON.parse(stored) : (database[cat.key] || []);
        const finished = list.filter(s => s.finished);
        const data = finished.map(s => ({
          id: s.id.toString(),
          home: s.codeA,
          away: s.codeB,
          score: `${s.scoreA} - ${s.scoreB}`,
          catKey: cat.key
        }));
        return { title: cat.label, data };
      })
    );
    setSections(fetched);
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Función para marcar/desmarcar terminado
  const toggleFinished = async item => {
    try {
      const key = `sections_${item.catKey}`;
      const stored = await AsyncStorage.getItem(key);
      let list = stored ? JSON.parse(stored) : (database[item.catKey] || []);
      // Buscar el partido y alternar finished
      list = list.map(match =>
        match.id.toString() === item.id
          ? { ...match, finished: !match.finished }
          : match
      );
      await AsyncStorage.setItem(key, JSON.stringify(list));
      loadSections(); // recargar datos
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
        renderSectionHeader={({ section: { title, data } }) => (
          data.length > 0 ? <Text style={styles.header}>{title}</Text> : null
        )}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleFinished(item)}>
            <View style={styles.matchRow}>
              <Text style={styles.matchText}>{item.home} vs {item.away}</Text>
              <Text style={styles.scoreText}>{item.score}</Text>
            </View>
          </TouchableOpacity>
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
  header: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    // sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // sombra Android
    elevation: 2
  },
  matchText: {
    fontSize: 16,
    color: '#333'
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C5CE7'
  },
  separator: {
    height: 8
  }
});