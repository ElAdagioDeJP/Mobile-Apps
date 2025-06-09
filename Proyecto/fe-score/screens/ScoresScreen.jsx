import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_URL } from '../config';

// Card para atletismo: muestra posiciones y género como ícono
function AtletismoCard({ item }) {
  const genderIcon = item.gender === 'femenino' ? 'gender-female' : 'gender-male';
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.status}>{item.finished ? 'Cerrado' : 'En curso'}</Text>
        <Icon name={genderIcon} size={20} style={styles.genderIcon} />
      </View>
      {item.positions.map((pos, idx) => (
        <View key={idx} style={styles.positionRow}>
          <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
          <Text style={styles.positionValue}>{pos}</Text>
        </View>
      ))}
    </View>
  );
}

// Card para otras categorías: muestra código y marcador
function MatchCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.categoryText}>{item.categoryLabel}</Text>
        <Text style={styles.status}>{item.finished ? 'Finalizado' : 'En juego'}</Text>
      </View>
      <View style={styles.matchRow}>
        <Text style={styles.matchTeams}>{item.codeA} - {item.codeB}</Text>
        <Text style={styles.matchScore}>{item.scoreA} <Text style={styles.dash}>–</Text> {item.scoreB}</Text>
      </View>
    </View>
  );
}

export default function ScoresScreen() {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/scores/`);
        if (!res.ok) throw new Error('No se pudieron cargar los puntajes');
        const data = await res.json();
        // Agrupar por fecha dd/MM/yyyy
        const grouped = data.reduce((acc, item) => {
          const date = new Date(item.date).toLocaleDateString('es-ES');
          if (!acc[date]) acc[date] = [];
          // añade etiqueta de categoría legible
          acc[date].push({ ...item });
          return acc;
        }, {});
        const formatted = Object.keys(grouped)
          .sort((a, b) => new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-')))
          .map(date => ({ title: date, data: grouped[date] }));
        setSections(formatted);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) =>
          item.category.startsWith('atletismo_') ? (
            <AtletismoCard item={item} />
          ) : (
            <MatchCard item={{
              ...item,
              categoryLabel: item.category.replace(/_/g, ' ')
            }} />
          )
        }
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
  },
  card: {
    backgroundColor: '#2D529F',
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF09',
    textTransform: 'uppercase',
  },
  genderIcon: {
    color: '#E8E8E8',
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
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTeams: {
    fontSize: 18,
    color: '#E8E8E8',
    flex: 1,
  },
  matchScore: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  dash: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FBBF09',
    marginHorizontal: 6,
  },
});
