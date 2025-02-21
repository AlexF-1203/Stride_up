import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { COLORS, globalStyles } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const Home = ({ navigation, route }) => {
  const [seances, setSeances] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    fetchSeances();
  }, [route.params?.refresh]);

  useEffect(() => {
    const refreshOnFocus = navigation.addListener('focus', () => {
      fetchSeances();
    });
    
    return refreshOnFocus;
  }, [navigation]);

  const fetchSeances = async () => {
    try {
      const q = query(
        collection(db, 'seances'),
        where('user_id', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const seancesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSeances(seancesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des séances:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const renderSeanceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.seanceItem}
      onPress={() => navigation.navigate('SeanceDetail', { seanceId: item.id })}
    >
      <View style={styles.seanceContent}>
        <Text style={styles.seanceName}>{item.nom}</Text>
        <Text style={styles.seanceDate}>
          {new Date(item.date.toDate()).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={COLORS.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bienvenue</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={seances}
        renderItem={renderSeanceItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateSeance')}
      >
        <MaterialIcons name="add" size={30} color={COLORS.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 0,
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  listContent: {
    padding: 20,
  },
  seanceItem: {
    ...globalStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 12,
  },
  seanceContent: {
    flex: 1,
  },
  seanceName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  seanceDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default Home; 