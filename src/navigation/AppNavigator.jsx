import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
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
        options={{ headerShown: false }}
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