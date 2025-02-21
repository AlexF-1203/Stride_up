import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { doc, getDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../service/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme/colors';

const SeanceDetail = ({ route, navigation }) => {
  const { seanceId } = route.params;
  const [seance, setSeance] = useState(null);
  const [exercices, setExercices] = useState([]);

  useEffect(() => {
    fetchSeanceDetails();
  }, []);

  const fetchSeanceDetails = async () => {
    try {
      const seanceDoc = await getDoc(doc(db, 'seances', seanceId));
      if (seanceDoc.exists()) {
        setSeance({ id: seanceDoc.id, ...seanceDoc.data() });
      }

      const exercicesRef = collection(db, 'Exercise');
      const exercicesSnapshot = await getDocs(exercicesRef);
      const exercicesMap = {};
      exercicesSnapshot.forEach(doc => {
        exercicesMap[doc.id] = doc.data().nom;
      });

      const seanceExercicesSnapshot = await getDocs(collection(db, `seances/${seanceId}/exercices`));
      const exercicesList = seanceExercicesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          exercice_id: data.exercice_id,
          nom: exercicesMap[data.exercice_id] || `Exercice ${doc.id}`,
          parametres: data.parametres
        };
      });
      
      setExercices(exercicesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la séance');
    }
  };

  const handleStartSeance = () => {
    navigation.navigate('SeanceEnCours', { 
      seanceId,
      exercices
    });
  };

  const handleDeleteSeance = async () => {
    try {
      if (!seance) return;

      Alert.alert(
        "Supprimer la séance",
        "Êtes-vous sûr de vouloir supprimer cette séance ?",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              const batch = writeBatch(db);
              
              // Supprimer la séance
              const seanceRef = doc(db, 'seances', seance.id);
              batch.delete(seanceRef);

              // Supprimer les exercices associés
              const exercicesRef = collection(db, `seances/${seance.id}/exercices`);
              const exercicesSnapshot = await getDocs(exercicesRef);
              exercicesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
              });

              await batch.commit();
              navigation.navigate('Home', { refresh: true });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la séance');
    }
  };

  if (!seance) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{seance.nom}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Performance', { seanceId: seance.id })}
              >
                <MaterialIcons name="show-chart" size={24} color={COLORS.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('EditSeance', { 
                  seanceId: seance.id,
                  seance: seance,
                  exercices: exercices 
                })}
              >
                <MaterialIcons name="edit" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDeleteSeance}
              >
                <MaterialIcons name="delete" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.date}>
            {new Date(seance.date.toDate()).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>

        {seance.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notes}>{seance.notes}</Text>
          </View>
        )}

        <View style={styles.exercicesContainer}>
          <Text style={styles.sectionTitle}>Exercices</Text>
          {exercices.map((exercice, index) => (
            <View key={exercice.id} style={styles.exerciceItem}>
              <View style={styles.exerciceHeader}>
                <Text style={styles.exerciceNom}>
                  {index + 1}. {exercice.nom}
                </Text>
                <Text style={styles.exerciceTag}>
                  {exercice.parametres.series} séries
                </Text>
              </View>
              <View style={styles.exerciceDetails}>
                <Text style={styles.paramText}>
                  {exercice.parametres.repetitions} répétitions
                </Text>
                <Text style={styles.paramText}>
                  Tempo: {exercice.parametres.tempo}
                </Text>
                <Text style={styles.paramText}>
                  Repos: {exercice.parametres.repos}s
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartSeance}
      >
        <Text style={styles.startButtonText}>Commencer la séance</Text>
        <MaterialIcons name="play-arrow" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 10,
  },
  date: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  notesContainer: {
    ...globalStyles.card,
    margin: 15,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  notes: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  exercicesContainer: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  exerciceItem: {
    ...globalStyles.card,
    marginBottom: 12,
  },
  exerciceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciceNom: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  exerciceTag: {
    fontSize: 12,
    color: COLORS.accent,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciceDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  paramText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    margin: 15,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  loadingText: {
    color: COLORS.text.primary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SeanceDetail; 