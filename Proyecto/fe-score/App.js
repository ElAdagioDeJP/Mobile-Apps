// App.js
import 'react-native-gesture-handler';
import React from 'react';
import Router from './components/Router';  // Asegúrate de que la ruta apunte a tu router.jsx
import FlashMessage from "react-native-flash-message";

export default function App() {
  return (
    <><Router /><FlashMessage position="top" /></>
  );
}