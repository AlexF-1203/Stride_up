import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateSeance from '../screens/CreateSeance';
import CreateExercice from '../screens/CreateExercice';
import SeanceDetail from '../screens/SeanceDetail';
import SeanceEnCours from '../screens/SeanceEnCours';
import EditSeance from '../screens/EditSeance';
import Performance from '../screens/Performance';
import CreateSuivis from '../screens/CreateSuivis';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ initialRoute = 'Login' }) {
  return (
    <Stack.Navigator 
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1A1B1E',
        },
        headerTintColor: '#F3F4F6',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ headerShown: false }}
      />
     <Stack.Screen 
  name="Home" 
  component={HomeScreen} 
  options={({ navigation }) => ({
    headerShown: true,
    title: 'Bienvenue',
    headerBackVisible: false, 
    headerLeft: null,
    headerRight: () => (
      <TouchableOpacity 
        onPress={async () => {
          try {
            // Effacer la préférence "rester connecté"
            await AsyncStorage.removeItem('@rememberMe');
            
            // Déconnexion de Firebase
            await signOut(auth);
            
            // Naviguer vers Login seulement après une déconnexion réussie
            navigation.replace('Login');
          } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
          }
        }}
        style={{ marginRight: 15 }}
      >
        <MaterialIcons name="logout" size={24} color="#F3F4F6" />
      </TouchableOpacity>
    ),
  })}
/>
      <Stack.Screen 
        name="CreateSeance" 
        component={CreateSeance}
        options={{ title: 'Créer une séance' }}
      />
      <Stack.Screen 
        name="CreateExercice" 
        component={CreateExercice}
        options={{ title: 'Nouvel exercice' }}
      />
      <Stack.Screen 
        name="SeanceDetail" 
        component={SeanceDetail}
        options={{ title: 'Détails de la séance' }}
      />
      <Stack.Screen 
        name="SeanceEnCours" 
        component={SeanceEnCours}
        options={{ title: 'Séance en cours' }}
      />
      <Stack.Screen 
        name="EditSeance" 
        component={EditSeance}
        options={{ title: 'Modifier la séance' }}
      />
      <Stack.Screen 
        name="Performance" 
        component={Performance}
        options={{ title: 'Performances' }}
      />
      <Stack.Screen 
        name="CreateSuivis" 
        component={CreateSuivis}
        options={{ title: 'Nouveau suivi' }}
      />
    </Stack.Navigator>
  );
}