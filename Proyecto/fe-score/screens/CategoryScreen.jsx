import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const database = require("../database.json");

export default function CategoryScreen({ route, navigation }) {
  const { key, label } = route.params;
  const storageKey = `sections_${key}`;

  const isAtletismo = key.startsWith("atletismo_");
  const isMaraton = key === "atletismo_maraton";
  const isVelocidad = key === "atletismo_velocidad";
  const isRelevo = key === "atletismo_relevo";

  const positionsCount = isMaraton
    ? 8
    : isVelocidad
    ? 4
    : isRelevo
    ? 3
    : 0;

  const [sections, setSections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [positions, setPositions] = useState(
    Array(positionsCount).fill("")
  );
  const [gender, setGender] = useState("femenino");

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) setSections(JSON.parse(stored));
      else if (database[key]) setSections(database[key]);
    })();
  }, []);

  const persist = async (list) => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(list));
    setSections(list);
  };

  const saveSection = async () => {
    let newSection = { id: Date.now().toString(), finished: false };
    if (isAtletismo) {
      newSection = {
        ...newSection,
        gender,
        positions: positions.map((p) => p.toUpperCase()),
      };
    } else {
      newSection = {
        ...newSection,
        codeA,
        codeB,
        gender: null,
        scoreA: 0,
        scoreB: 0,
      };
    }
    await persist([...sections, newSection]);
    setShowForm(false);
    setCodeA("");
    setCodeB("");
    setPositions(Array(positionsCount).fill(""));
    setGender("femenino");
  };

  const deleteSection = async (id) => {
    try {
      const newList = sections.filter((s) => s.id !== id);
      await persist(newList);
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar la sección");
      console.error(error);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "Eliminar sección",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteSection(id) },
      ]
    );
  };

  const toggleFinished = async (id) => {
    const updated = sections.map((s) =>
      s.id === id ? { ...s, finished: !s.finished } : s
    );
    await persist(updated);
  };

  const changeScore = async (id, side, delta) => {
    const updated = sections.map((s) => {
      if (s.id !== id) return s;
      const key = side === "A" ? "scoreA" : "scoreB";
      const next = Math.max(0, s[key] + delta);
      return { ...s, [key]: next };
    });
    await persist(updated);
  };

  const changeScoreDirect = async (id, side, text) => {
    const val = parseInt(text, 10);
    const updated = sections.map((s) => {
      if (s.id !== id) return s;
      const key = side === "A" ? "scoreA" : "scoreB";
      return { ...s, [key]: isNaN(val) ? 0 : val };
    });
    await persist(updated);
  };

  const renderPositions = (item) => (
    <View style={styles.positionsContainer}>
      {item.positions.map((pos, idx) => (
        <View key={idx} style={styles.positionRow}>
          <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
          <TextInput
            style={[styles.positionInput, item.finished && styles.disabledInput]}
            value={pos}
            editable={!item.finished}
          />
        </View>
      ))}
    </View>
  );

  const renderSection = ({ item }) => (
    <View style={styles.card}>

      {/* Íconos centrados arriba solo no-atletismo */}
      {!isAtletismo && (
        <View style={styles.topIcons}>
          <TouchableOpacity
            onPress={() => toggleFinished(item.id)}
            disabled={false}
          >
            <Icon
              name={item.finished ? "flag-checkered" : "flag-outline"}
              size={28}
              color={item.finished ? "#4CAF50" : "#FFF"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => confirmDelete(item.id)}
            style={styles.iconSpacing}
          >
            <Icon name="trash-can-outline" size={28} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.matchHeader}>
        {!isAtletismo && <Text style={styles.teamText}>{item.codeA}</Text>}
        {isAtletismo && <Text style={styles.teamText}>Atletismo</Text>}

        {isAtletismo ? (
          renderPositions(item)
        ) : (
          <View style={styles.scoreControls}>
            {/* – / + A */}
            <TouchableOpacity
              onPress={() => changeScore(item.id, "A", -1)}
              disabled={item.finished}
              style={item.finished && styles.disabledBtn}
            >
              <Icon name="minus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.scoreInput,
                item.finished && styles.disabledInput,
              ]}
              keyboardType="numeric"
              value={String(item.scoreA)}
              editable={!item.finished}
              onChangeText={(t) => changeScoreDirect(item.id, "A", t)}
            />
            <TouchableOpacity
              onPress={() => changeScore(item.id, "A", +1)}
              disabled={item.finished}
              style={item.finished && styles.disabledBtn}
            >
              <Icon name="plus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.vsText}>–</Text>

            {/* – / + B */}
            <TouchableOpacity
              onPress={() => changeScore(item.id, "B", -1)}
              disabled={item.finished}
              style={item.finished && styles.disabledBtn}
            >
              <Icon name="minus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.scoreInput,
                item.finished && styles.disabledInput,
              ]}
              keyboardType="numeric"
              value={String(item.scoreB)}
              editable={!item.finished}
              onChangeText={(t) => changeScoreDirect(item.id, "B", t)}
            />
            <TouchableOpacity
              onPress={() => changeScore(item.id, "B", +1)}
              disabled={item.finished}
              style={item.finished && styles.disabledBtn}
            >
              <Icon name="plus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {!isAtletismo && <Text style={styles.teamText}>{item.codeB}</Text>}
      </View>
    </View>
  );

  const validateCode = (text) =>
    text.toLowerCase().replace(/[^1-6ab]/g, "").slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left-bold" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label}</Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Icon name="plus-circle" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderSection}
        contentContainerStyle={!sections.length && styles.emptyContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Sin secciones aún</Text>
        }
      />

      <Modal visible={showForm} animationType="fade" transparent>
        <ScrollView contentContainerStyle={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear Sección</Text>

            {isAtletismo ? (
              <>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    onPress={() => setGender("femenino")}
                    style={[
                      styles.genderBtn,
                      gender === "femenino" && styles.genderSelected,
                    ]}
                  >
                    <Icon
                      name="gender-female"
                      size={24}
                      color={gender === "femenino" ? "#2D529F" : "#FFF"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setGender("masculino")}
                    style={[
                      styles.genderBtn,
                      gender === "masculino" && styles.genderSelected,
                    ]}
                  >
                    <Icon
                      name="gender-male"
                      size={24}
                      color={gender === "masculino" ? "#2D529F" : "#FFF"}
                    />
                  </TouchableOpacity>
                </View>

                {positions.map((pos, idx) => (
                  <View key={idx} style={styles.positionRow}>
                    <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
                    <TextInput
                      placeholder={`${idx + 1}A`}
                      style={styles.positionInput}
                      value={positions[idx]}
                      onChangeText={(t) =>
                        setPositions((prev) => {
                          const copy = [...prev];
                          copy[idx] = t.toUpperCase().slice(0, 2);
                          return copy;
                        })
                      }
                      maxLength={2}
                    />
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="1A"
                  style={styles.codeInput}
                  value={codeA}
                  onChangeText={(t) => setCodeA(validateCode(t))}
                  maxLength={2}
                />
                <TextInput
                  placeholder="1B"
                  style={styles.codeInput}
                  value={codeB}
                  onChangeText={(t) => setCodeB(validateCode(t))}
                  maxLength={2}
                />
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveSection}
                disabled={
                  isAtletismo
                    ? positions.some((p) => p.length < 1)
                    : !(codeA.length === 2 && codeB.length === 2)
                }
              >
                <Text
                  style={[
                    styles.saveText,
                    (isAtletismo
                      ? positions.some((p) => p.length < 1)
                      : !(codeA.length === 2 && codeB.length === 2)) &&
                      styles.disabled,
                  ]}
                >
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1D1B39" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#2D529F",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FBBF09",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#E8E8E8", fontSize: 18 },

  card: {
    backgroundColor: "#2D529F",
    margin: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
  },

  topIcons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconSpacing: { marginLeft: 16 },

  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FBBF09",
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  scoreControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  vsText: {
    marginHorizontal: 12,
    fontSize: 28,
    fontWeight: "800",
    color: "#FBBF09",
  },
  scoreInput: {
    width: 50,
    marginHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: "#FFF",
    textAlign: "center",
    fontSize: 20,
    color: "#FFF",
    paddingVertical: Platform.OS === "android" ? 2 : 6,
  },

  // Botón deshabilitado
  disabledBtn: { opacity: 0.4 },

  // Inputs deshabilitados
  disabledInput: { backgroundColor: "#3B3A5A", color: "#777" },

  positionsContainer: { marginTop: 12 },
  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  positionLabel: {
    width: 30,
    fontSize: 18,
    color: "#FBBF09",
  },
  positionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FBBF09",
    borderRadius: 6,
    padding: Platform.OS === "android" ? 10 : 14,
    color: "#E8E8E8",
    fontSize: 18,
    fontWeight: "700",
    backgroundColor: "#1D1B39",
    textAlign: "center",
  },

  modalBg: {
    flexGrow: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#1D1B39",
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
    color: "#FBBF09",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  codeInput: {
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#FBBF09",
    borderRadius: 6,
    padding: Platform.OS === "android" ? 10 : 14,
    color: "#E8E8E8",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "#2D529F",
  },
  genderRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  genderBtn: {
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#FBBF09",
  },
  genderSelected: { backgroundColor: "#FBBF09" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelText: { fontSize: 18, color: "#E8E8E8" },
  saveText: { fontSize: 18, fontWeight: "700", color: "#FBBF09" },
  disabled: { color: "#777" },
});
