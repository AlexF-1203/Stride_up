import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { auth } from './firebase.config';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  
  // Fonction pour gérer les changements d'état d'authentification
  function onAuthStateChanged(user) {
    console.log("État d'authentification changé:", user ? "Connecté" : "Déconnecté");
    setUser(user);
    if (initializing) setInitializing(false);
  }
  
  useEffect(() => {
    // Vérifier si l'utilisateur veut rester connecté
    const checkRememberMe = async () => {
      try {
        const rememberMe = await AsyncStorage.getItem('@rememberMe');
        console.log("Préférence 'rester connecté':", rememberMe);
        
        // Si l'utilisateur ne veut pas rester connecté, on s'assure qu'il est déconnecté
        if (rememberMe === 'false') {
          console.log("L'utilisateur ne veut pas rester connecté, vérification de la déconnexion");
          const currentUser = auth.currentUser;
          if (currentUser) {
            console.log("Déconnexion forcée de l'utilisateur");
            await auth.signOut();
          }
        }
      } catch (e) {
        console.error("Erreur lors de la vérification des préférences:", e);
      }
    };
    
    checkRememberMe();
    
    // Abonnement aux changements d'état d'authentification
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // Désabonnement lors du démontage
  }, []);
  
  // Afficher un indicateur de chargement pendant l'initialisation
  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <AppNavigator initialRoute={user ? 'Home' : 'Login'} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1B1E',
  },
  loadingText: {
    color: '#F3F4F6',
    marginTop: 10,
    fontSize: 16,
  }
});