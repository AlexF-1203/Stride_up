import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase.config';
import { COLORS, globalStyles } from '../theme/colors';

const Register = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Inscription</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.text.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={COLORS.text.muted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Déjà un compte ? Se connecter
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
  registerButton: {
    ...globalStyles.button,
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },
  buttonText: {
    ...globalStyles.buttonText,
  },
  loginLink: {
    marginTop: 15,
    padding: 10,
  },
  loginText: {
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

export default Register; 