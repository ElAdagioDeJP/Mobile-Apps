import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_URL } from '../config';

function AtletismoCard({ item }) {
  const genderIcon = item.gender === 'femenino' ? 'gender-female' : 'gender-male';
  const pruebaLabel = item.category.replace('atletismo_', '').toUpperCase();
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.categoryText}>{`Atletismo: ${pruebaLabel}`}</Text>
        <Text style={styles.status}>{item.finished ? 'Cerrado' : 'En curso'}</Text>
      </View>
      <View style={styles.genderRow}>
        <Icon name={genderIcon} size={24} style={styles.genderIcon} />
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

function MatchCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.categoryText}>{item.categoryLabel}</Text>
        <Text style={styles.status}>{item.finished ? 'Finalizado' : 'En juego'}</Text>
      </View>
      <View style={styles.matchContainer}>
        {/* Puntaje centralizado y destacado */}
        <View style={styles.scoreBox}>
          <Text style={styles.matchScore}>
            {item.scoreA} <Text style={styles.dash}>–</Text> {item.scoreB}
          </Text>
        </View>
        {/* Nombres de equipos en una sola fila */}
        <View style={styles.teamsRow}>
          <Text style={styles.teamName}>{item.codeA}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.teamName}>{item.codeB}</Text>
        </View>
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
        const grouped = data.reduce((acc, item) => {
          const date = new Date(item.date).toLocaleDateString('es-ES');
          if (!acc[date]) acc[date] = [];
          acc[date].push({ ...item });
          return acc;
        }, {});
        const formatted = Object.keys(grouped)
          .sort((a, b) =>
            new Date(b.split('/').reverse().join('-'))
            - new Date(a.split('/').reverse().join('-'))
          )
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
            <MatchCard
              item={{
                ...item,
                categoryLabel: item.category.replace(/_/g, ' ')
              }}
            />
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
    fontSize: 28,
    fontWeight: '900',
    color: '#FBBF09',
    marginTop: 16,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: '#2D529F',
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF09',
    textTransform: 'uppercase',
  },
  genderRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
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
  matchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchScore: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  dash: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FBBF09',
    marginHorizontal: 4,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E8E8E8',
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FBBF09',
  },
});