import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase.config';
import { COLORS, globalStyles } from '../theme/colors';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
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
        />
        
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
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
  loginButton: {
    ...globalStyles.button,
    backgroundColor: COLORS.primary,
    marginTop: 20,
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

export default Login; 