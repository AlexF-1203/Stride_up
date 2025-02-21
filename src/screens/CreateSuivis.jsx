import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../service/firebase';

const CreateSuivis = ({ navigation }) => {
  const [seances, setSeances] = useState([]);
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [serie1, setSerie1] = useState('');
  const [serie2, setSerie2] = useState('');
  const [serie3, setSerie3] = useState('');
  const [serie4, setSerie4] = useState('');

  useEffect(() => {
    fetchSeances();
  }, []);

  const fetchSeances = async () => {
    try {
      const q = query(
        collection(db, 'seance'),
        where('user_id', '==', auth.currentUser.uid)
      );
      const seancesSnapshot = await getDocs(q);
      const seancesList = seancesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSeances(seancesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des séances:', error);
    }
  };

  const handleCreateSuivis = async () => {
    try {
      const suiviData = {
        serie_1: Number(serie1),
        serie_2: Number(serie2),
        serie_3: Number(serie3),
        serie_4: Number(serie4),
        user_id: auth.currentUser.uid,
        seance_id: selectedSeance,
        created_at: new Date()
      };

      await addDoc(collection(db, 'suivis'), suiviData);
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la création du suivi:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Enregistrer un suivi</Text>

      <View style={styles.seanceList}>
        <Text style={styles.subtitle}>Sélectionner une séance :</Text>
        {seances.map((seance) => (
          <TouchableOpacity
            key={seance.id}
            style={[
              styles.seanceItem,
              selectedSeance === seance.id && styles.selectedSeance
            ]}
            onPress={() => setSelectedSeance(seance.id)}
          >
            <Text style={styles.seanceText}>{seance.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedSeance && (
        <View style={styles.seriesContainer}>
          <TextInput
            style={styles.input}
            placeholder="Série 1 (kg)"
            value={serie1}
            onChangeText={setSerie1}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Série 2 (kg)"
            value={serie2}
            onChangeText={setSerie2}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Série 3 (kg)"
            value={serie3}
            onChangeText={setSerie3}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Série 4 (kg)"
            value={serie4}
            onChangeText={setSerie4}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSuivis}
          >
            <Text style={styles.buttonText}>Enregistrer le suivi</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  seanceList: {
    marginVertical: 15,
  },
  seanceItem: {
    padding: 15,
    backgroundColor: '#fff',
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSeance: {
    backgroundColor: '#e3e3e3',
    borderColor: '#007AFF',
  },
  seanceText: {
    fontSize: 16,
  },
  seriesContainer: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateSuivis; 