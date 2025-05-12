import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Switch } from 'react-native';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../../firebase.config';
import { COLORS, globalStyles } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur a déjà choisi de rester connecté
  useEffect(() => {
    const checkRememberMe = async () => {
      try {
        const value = await AsyncStorage.getItem('@rememberMe');
        if (value !== null) {
          console.log("Préférence 'rester connecté' récupérée:", value);
          setRememberMe(value === 'true');
        }
      } catch (e) {
        console.error('Erreur lors de la récupération des préférences:', e);
      }
    };
    
    checkRememberMe();
  }, []);

  const handleLogin = async () => {
    try {
      // Réinitialiser les erreurs et activer le chargement
      setError('');
      setIsLoading(true);
      
      if (!email || !password) {
        setError('Veuillez remplir tous les champs');
        setIsLoading(false);
        return;
      }
      
      // Sauvegarder la préférence de l'utilisateur
      console.log("Sauvegarde de la préférence 'rester connecté':", rememberMe);
      await AsyncStorage.setItem('@rememberMe', rememberMe.toString());
      
      // Connexion avec Firebase
      console.log("Tentative de connexion avec:", email);
      await signInWithEmailAndPassword(auth, email, password);
      
      // Si l'utilisateur ne veut pas rester connecté, on programme une déconnexion à la fermeture de l'app
      if (!rememberMe) {
        console.log("L'utilisateur ne veut pas rester connecté, session temporaire");
        // Cette information sera utilisée par App.js pour déconnecter l'utilisateur si nécessaire
      }
      
      // Redirection vers l'écran d'accueil
      console.log("Connexion réussie, redirection vers Home");
      navigation.replace('Home');
    } catch (err) {
      console.error("Erreur de connexion:", err.code, err.message);
      
      // Gestion des erreurs d'authentification
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Adresse email invalide';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte associé à cette adresse email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives échouées. Veuillez réessayer plus tard';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Connexion</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.text.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />
        
        <View style={styles.rememberMeContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: COLORS.surface, true: COLORS.primary }}
            thumbColor={rememberMe ? COLORS.accent : COLORS.text.secondary}
            disabled={isLoading}
          />
          <Text style={styles.rememberMeText}>Rester connecté</Text>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
          disabled={isLoading}
        >
          <Text style={styles.registerText}>
            Pas encore de compte ? S'inscrire
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    justifyContent: 'center',
  },
  formContainer: {
    ...globalStyles.card,
    marginHorizontal: 20,
  },
  title: {
    ...globalStyles.title,
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 30,
  },
  input: {
    ...globalStyles.input,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  rememberMeText: {
    color: COLORS.text.secondary,
    marginLeft: 10,
    fontSize: 14,
  },
  loginButton: {
    ...globalStyles.button,
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    ...globalStyles.buttonText,
  },
  registerButton: {
    marginTop: 15,
    padding: 10,
  },
  registerText: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default LoginScreen;