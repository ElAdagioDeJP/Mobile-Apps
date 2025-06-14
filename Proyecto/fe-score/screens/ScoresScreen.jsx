import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_URL } from '../config';

// --- COMPONENTES DE TARJETAS (SIN CAMBIOS) ---

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

function AvionCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.avionHeader}>
        <Text style={styles.categoryText}>Vuelo de Avión</Text>
        <Text style={styles.status}>{item.finished ? 'Finalizado' : 'En curso'}</Text>
      </View>
      <View style={styles.avionResultsContainer}>
        <View style={styles.avionRow}>
          <Icon name="gender-male" size={24} style={styles.avionGenderIcon} />
          <Text style={styles.avionLabel}>1er Lugar Masculino:</Text>
          <Text style={styles.avionValue}>{item.positions[0] || 'N/A'}</Text>
        </View>
        <View style={styles.avionRow}>
          <Icon name="gender-female" size={24} style={styles.avionGenderIcon} />
          <Text style={styles.avionLabel}>1er Lugar Femenino:</Text>
          <Text style={styles.avionValue}>{item.positions[1] || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );
}

function ChessCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.avionHeader}>
        <Text style={styles.categoryText}>Ajedrez</Text>
        <Text style={styles.status}>{item.finished ? 'Finalizado' : 'En curso'}</Text>
      </View>
      <View style={styles.avionResultsContainer}>
        {/* 1° y 2° Lugar Masculino */}
        <View style={styles.avionRow}>
          <Icon name="gender-male" size={24} style={styles.avionGenderIcon} />
          <Text style={styles.avionLabel}>1er Lugar Masculino:</Text>
          <Text style={styles.avionValue}>{item.positions[0] || 'N/A'}</Text>
        </View>
        <View style={styles.avionRow}>
          <Icon name="gender-male" size={24} style={styles.avionGenderIcon} />
          <Text style={styles.avionLabel}>2do Lugar Masculino:</Text>
          <Text style={styles.avionValue}>{item.positions[1] || 'N/A'}</Text>
        </View>
        {/* 1° y 2° Lugar Femenino */}
        <View style={styles.avionRow}>
          <Icon name="gender-female" size={24} style={styles.avionGenderIcon} />
          <Text style={styles.avionLabel}>1er Lugar Femenino:</Text>
          <Text style={styles.avionValue}>{item.positions[2] || 'N/A'}</Text>
        </View>
        <View style={styles.avionRow}>
          <Icon name="gender-female" size={24} style={styles.avionGenderIcon} />
          <Text style={styles.avionLabel}>2do Lugar Femenino:</Text>
          <Text style={styles.avionValue}>{item.positions[3] || 'N/A'}</Text>
        </View>
      </View>
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
        <View style={styles.scoreBox}>
          <Text style={styles.matchScore}>
            {item.scoreA} <Text style={styles.dash}>–</Text> {item.scoreB}
          </Text>
        </View>
        <View style={styles.teamsRow}>
          <Text style={styles.teamName}>{item.codeA}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.teamName}>{item.codeB}</Text>
        </View>
      </View>
    </View>
  );
}

// --- COMPONENTE PRINCIPAL DE LA PANTALLA (MODIFICADO) ---

export default function ScoresScreen() {
  const [sections, setSections] = useState([]);

  // Función para obtener y procesar los datos de la API
  const fetchData = async () => {
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
        .sort(
          (a, b) =>
            new Date(b.split('/').reverse().join('-')) -
            new Date(a.split('/').reverse().join('-'))
        )
        .map(date => ({ title: date, data: grouped[date] }));
      setSections(formatted);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // 1. Llama a la API inmediatamente al montar el componente
    fetchData(); 

    // 2. Establece un intervalo para llamar a la API cada 5 segundos
    const intervalId = setInterval(fetchData, 5000); 

    // 3. Limpia el intervalo cuando el componente se desmonte para evitar fugas de memoria
    return () => clearInterval(intervalId); 
  }, []); // El array vacío asegura que el efecto se ejecute solo una vez (al montar y desmontar)

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => {
          if (item.category.startsWith('atletismo_')) {
            return <AtletismoCard item={item} />;
          } else if (item.category === 'vuelo_avion') {
            return <AvionCard item={item} />;
          } else if (item.category === 'ajedrez') {
            return <ChessCard item={item} />;
          } else {
            return (
              <MatchCard
                item={{
                  ...item,
                  categoryLabel: item.category.replace(/_/g, ' '),
                }}
              />
            );
          }
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

// --- ESTILOS (SIN CAMBIOS) ---

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
  // Atletismo
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
  // Vuelo Avión y Ajedrez
  avionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avionResultsContainer: {
    paddingLeft: 8,
  },
  avionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  avionGenderIcon: {
    color: '#E8E8E8',
    marginRight: 12,
  },
  avionLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  avionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FBBF09',
    marginLeft: 8,
  },
  // Partidos
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