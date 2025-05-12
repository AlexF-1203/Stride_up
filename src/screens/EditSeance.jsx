import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { doc, updateDoc, collection, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { COLORS, globalStyles } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const EditSeance = ({ route, navigation }) => {
  const { seanceId, seance, exercices } = route.params;
  const [nomSeance, setNomSeance] = useState(seance.nom);
  const [notes, setNotes] = useState(seance.notes || '');
  const [exercicesModifies, setExercicesModifies] = useState(exercices);
  const [exerciceEnEdition, setExerciceEnEdition] = useState(null);
  const [showExerciceModal, setShowExerciceModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [exercicesDisponibles, setExercicesDisponibles] = useState([]);
  const [nouvelExercice, setNouvelExercice] = useState(null);

  useEffect(() => {
    fetchExercicesDisponibles();
  }, []);

  const fetchExercicesDisponibles = async () => {
    try {
      const exercicesRef = collection(db, 'Exercise');
      const snapshot = await getDocs(exercicesRef);
      const exercicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExercicesDisponibles(exercicesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      Alert.alert('Erreur', 'Impossible de charger les exercices disponibles');
    }
  };

  const handleAddExercice = (exercice) => {
    setNouvelExercice({
      exercice_id: exercice.id,
      nom: exercice.nom,
      parametres: exercice.parametres_par_defaut || {
        series: 3,
        repetitions: 12,
        tempo: '1-1-1-1',
        repos: 60
      }
    });
    setShowAddModal(false);
    setShowExerciceModal(true);
  };

  const handleSaveNewExercice = () => {
    if (!nouvelExercice) return;

    setExercicesModifies([...exercicesModifies, {
      ...nouvelExercice,
      id: Date.now().toString() // ID temporaire pour la gestion locale
    }]);
    setShowExerciceModal(false);
    setNouvelExercice(null);
  };

  const handleUpdateSeance = async () => {
    try {
      if (!nomSeance.trim()) {
        Alert.alert('Erreur', 'Le nom de la séance est requis');
        return;
      }

      const batch = writeBatch(db);
      
      // Mise à jour de la séance
      const seanceRef = doc(db, 'seances', seanceId);
      batch.update(seanceRef, {
        nom: nomSeance,
        notes: notes,
      });

      const exercicesRef = collection(db, `seances/${seanceId}/exercices`);
      exercices.forEach(exercice => {
        const exerciceRef = doc(exercicesRef, exercice.id);
        batch.delete(exerciceRef);
      });

      exercicesModifies.forEach((exercice, index) => {
        const newExerciceRef = doc(exercicesRef);
        batch.set(newExerciceRef, {
          exercice_id: exercice.exercice_id,
          ordre: index + 1,
          parametres: exercice.parametres,
        });
      });

      await batch.commit();
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la séance');
    }
  };

  const handleEditExercice = (exercice) => {
    setExerciceEnEdition(exercice);
    setShowExerciceModal(true);
  };

  const handleUpdateExercice = () => {
    if (!exerciceEnEdition) return;

    const updatedExercices = exercicesModifies.map(ex => {
      if (ex.id === exerciceEnEdition.id) {
        return exerciceEnEdition;
      }
      return ex;
    });

    setExercicesModifies(updatedExercices);
    setShowExerciceModal(false);
    setExerciceEnEdition(null);
  };

  const handleMoveExercice = (fromIndex, toIndex) => {
    const newExercices = [...exercicesModifies];
    const [movedExercice] = newExercices.splice(fromIndex, 1);
    newExercices.splice(toIndex, 0, movedExercice);
    setExercicesModifies(newExercices);
  };

  const handleDeleteExercice = (index) => {
    Alert.alert(
      "Supprimer l'exercice",
      "Êtes-vous sûr de vouloir supprimer cet exercice ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            const newExercices = exercicesModifies.filter((_, i) => i !== index);
            setExercicesModifies(newExercices);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Nom de la séance</Text>
          <TextInput
            style={styles.input}
            value={nomSeance}
            onChangeText={setNomSeance}
            placeholder="Nom de la séance"
            placeholderTextColor={COLORS.text.secondary}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes additionnelles"
            placeholderTextColor={COLORS.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.exercicesContainer}>
          <View style={styles.exercicesHeader}>
            <Text style={styles.sectionTitle}>Exercices</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <MaterialIcons name="add" size={24} color={COLORS.text.primary} />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
          {exercicesModifies.map((exercice, index) => (
            <View key={exercice.id} style={styles.exerciceItem}>
              <View style={styles.exerciceHeader}>
                <View style={styles.exerciceDragHandle}>
                  <MaterialIcons name="drag-handle" size={24} color={COLORS.text.secondary} />
                </View>
                <Text style={styles.exerciceNom}>
                  {index + 1}. {exercice.nom}
                </Text>
                <View style={styles.exerciceActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditExercice(exercice)}
                  >
                    <MaterialIcons name="edit" size={20} color={COLORS.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteExercice(index)}
                  >
                    <MaterialIcons name="delete" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.exerciceDetails}>
                <Text style={styles.paramText}>
                  {exercice.parametres.series} séries × {exercice.parametres.repetitions} répétitions
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
        style={styles.updateButton}
        onPress={handleUpdateSeance}
      >
        <Text style={styles.buttonText}>Mettre à jour la séance</Text>
        <MaterialIcons name="check" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un exercice</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <MaterialIcons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={exercicesDisponibles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciceListItem}
                  onPress={() => handleAddExercice(item)}
                >
                  <View style={styles.exerciceListItemContent}>
                    <View style={styles.exerciceListItemHeader}>
                      <Text style={styles.exerciceListItemText}>{item.nom}</Text>
                      <Text style={styles.groupeMusculaire}>
                        {item.groupe_musculaire}
                      </Text>
                    </View>
                    <View style={styles.exerciceListItemFooter}>
                      <Text style={styles.exerciceListItemDetails}>
                        {item.parametres_par_defaut.series} séries × {item.parametres_par_defaut.repetitions} répétitions
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.createExerciceButton}
              onPress={() => {
                setShowAddModal(false);
                navigation.navigate('CreateExercice', {
                  onExerciceCreated: (nouvelExercice) => {
                    handleAddExercice(nouvelExercice);
                  }
                });
              }}
            >
              <View style={styles.createExerciceContent}>
                <MaterialIcons name="add-circle-outline" size={24} color={COLORS.accent} />
                <Text style={styles.createExerciceText}>Créer un nouvel exercice</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExerciceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowExerciceModal(false);
          setExerciceEnEdition(null);
          setNouvelExercice(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {nouvelExercice ? 'Nouvel exercice' : 'Modifier l\'exercice'}
            </Text>
            {(exerciceEnEdition || nouvelExercice) && (
              <>
                <View style={styles.formSection}>
                  <Text style={styles.label}>Séries</Text>
                  <TextInput
                    style={styles.input}
                    value={(nouvelExercice || exerciceEnEdition).parametres.series.toString()}
                    onChangeText={(text) => {
                      const exercice = nouvelExercice || exerciceEnEdition;
                      if (nouvelExercice) {
                        setNouvelExercice({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            series: parseInt(text) || 0
                          }
                        });
                      } else {
                        setExerciceEnEdition({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            series: parseInt(text) || 0
                          }
                        });
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.label}>Répétitions</Text>
                  <TextInput
                    style={styles.input}
                    value={(nouvelExercice || exerciceEnEdition).parametres.repetitions.toString()}
                    onChangeText={(text) => {
                      const exercice = nouvelExercice || exerciceEnEdition;
                      if (nouvelExercice) {
                        setNouvelExercice({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            repetitions: parseInt(text) || 0
                          }
                        });
                      } else {
                        setExerciceEnEdition({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            repetitions: parseInt(text) || 0
                          }
                        });
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.label}>Tempo</Text>
                  <TextInput
                    style={styles.input}
                    value={(nouvelExercice || exerciceEnEdition).parametres.tempo}
                    onChangeText={(text) => {
                      const exercice = nouvelExercice || exerciceEnEdition;
                      if (nouvelExercice) {
                        setNouvelExercice({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            tempo: text
                          }
                        });
                      } else {
                        setExerciceEnEdition({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            tempo: text
                          }
                        });
                      }
                    }}
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.label}>Repos (secondes)</Text>
                  <TextInput
                    style={styles.input}
                    value={(nouvelExercice || exerciceEnEdition).parametres.repos.toString()}
                    onChangeText={(text) => {
                      const exercice = nouvelExercice || exerciceEnEdition;
                      if (nouvelExercice) {
                        setNouvelExercice({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            repos: parseInt(text) || 0
                          }
                        });
                      } else {
                        setExerciceEnEdition({
                          ...exercice,
                          parametres: {
                            ...exercice.parametres,
                            repos: parseInt(text) || 0
                          }
                        });
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowExerciceModal(false);
                      setExerciceEnEdition(null);
                      setNouvelExercice(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={nouvelExercice ? handleSaveNewExercice : handleUpdateExercice}
                  >
                    <Text style={styles.buttonText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    color: COLORS.text.primary,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  exercicesContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  exerciceItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exerciceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciceDragHandle: {
    padding: 4,
    marginRight: 8,
  },
  exerciceNom: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  exerciceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  updateButton: {
    backgroundColor: COLORS.primary,
    margin: 15,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
  },
  saveButton: {
    backgroundColor: COLORS.success,
  },
  exercicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.text.primary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    padding: 5,
  },
  exerciceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  exerciceListItemContent: {
    flex: 1,
  },
  exerciceListItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciceListItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 8,
  },
  exerciceListItemFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  exerciceListItemDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  groupeMusculaire: {
    fontSize: 12,
    color: COLORS.accent,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  createExerciceButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createExerciceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createExerciceText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default EditSeance; 