// src/screens/CategoryScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CategoryScreen({ route }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categoría: {route.params.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' },
  title: { fontSize:22, fontWeight:'600' }
});
