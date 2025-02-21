import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { db, auth } from '../service/firebase';
import { Picker } from '@react-native-picker/picker';
import { COLORS, globalStyles } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const CreateSeance = ({ navigation }) => {
  const [nomSeance, setNomSeance] = useState('');
  const [notes, setNotes] = useState('');
  const [exercices, setExercices] = useState([]);
  const [selectedExercices, setSelectedExercices] = useState([]);
  const [groupeMusculaire, setGroupeMusculaire] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetchExercices();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchExercices();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchExercices = async () => {
    try {
      const exercicesRef = collection(db, 'Exercise');
      const snapshot = await getDocs(exercicesRef);
      const exercicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExercices(exercicesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      Alert.alert('Erreur', 'Impossible de charger les exercices');
    }
  };

  const handleAddExercice = (exercice) => {
    if (!selectedExercices.find(e => e.exercice_id === exercice.id)) {
      setSelectedExercices([...selectedExercices, {
        exercice_id: exercice.id,
        ordre: selectedExercices.length + 1,
        parametres: exercice.parametres_par_defaut,
      }]);
    }
  };

  const handleRemoveExercice = (index) => {
    const newExercices = [...selectedExercices];
    newExercices.splice(index, 1);
    setSelectedExercices(newExercices);
  };

  const handleCreateSeance = async () => {
    try {
      if (!nomSeance.trim()) {
        Alert.alert('Erreur', 'Veuillez donner un nom à votre séance');
        return;
      }

      if (selectedExercices.length === 0) {
        Alert.alert('Erreur', 'Veuillez sélectionner au moins un exercice');
        return;
      }

      const user = auth.currentUser;
      const seanceData = {
        user_id: user.uid,
        nom: nomSeance,
        notes: notes,
        date: new Date(),
      };

      const seanceRef = await addDoc(collection(db, 'seances'), seanceData);

      for (const exercice of selectedExercices) {
        await addDoc(collection(db, `seances/${seanceRef.id}/exercices`), exercice);
      }

      navigation.navigate('Home', { refresh: true });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', 'Impossible de créer la séance');
    }
  };

  const groupesMusculaires = [...new Set(exercices.map(ex => ex.groupe_musculaire))];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de la séance"
            placeholderTextColor={COLORS.text.muted}
            value={nomSeance}
            onChangeText={setNomSeance}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes (optionnel)"
            placeholderTextColor={COLORS.text.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Sélection des exercices</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {groupeMusculaire || "Tous les groupes musculaires"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>

          <Modal
            visible={showPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Groupe musculaire</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <MaterialIcons name="close" size={24} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      !groupeMusculaire && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      setGroupeMusculaire('');
                      setShowPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      !groupeMusculaire && styles.optionTextSelected
                    ]}>
                      Tous les groupes musculaires
                    </Text>
                  </TouchableOpacity>
                  {groupesMusculaires.map((groupe) => (
                    <TouchableOpacity
                      key={groupe}
                      style={[
                        styles.optionButton,
                        groupeMusculaire === groupe && styles.optionButtonSelected
                      ]}
                      onPress={() => {
                        setGroupeMusculaire(groupe);
                        setShowPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        groupeMusculaire === groupe && styles.optionTextSelected
                      ]}>
                        {groupe}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.exercicesList}>
            {exercices
              .filter(ex => !groupeMusculaire || ex.groupe_musculaire === groupeMusculaire)
              .map(exercice => (
                <TouchableOpacity
                  key={exercice.id}
                  style={styles.exerciceItem}
                  onPress={() => handleAddExercice(exercice)}
                >
                  <View style={styles.exerciceHeader}>
                    <Text style={styles.exerciceNom}>{exercice.nom}</Text>
                    <Text style={styles.groupeMusculaire}>
                      {exercice.groupe_musculaire}
                    </Text>
                  </View>
                  <View style={styles.exerciceFooter}>
                    <Text style={styles.exerciceDetails}>
                      {exercice.parametres_par_defaut.series} séries × {exercice.parametres_par_defaut.repetitions} répétitions
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {selectedExercices.length > 0 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Exercices sélectionnés</Text>
            {selectedExercices.map((exercice, index) => {
              const exerciceDetails = exercices.find(e => e.id === exercice.exercice_id);
              return (
                <View key={index} style={styles.selectedExerciceItem}>
                  <View style={styles.exerciceInfo}>
                    <Text style={styles.exerciceNom}>
                      {index + 1}. {exerciceDetails?.nom}
                    </Text>
                    <Text style={styles.exerciceDetails}>
                      {exercice.parametres.series} séries × {exercice.parametres.repetitions} répétitions
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveExercice(index)}
                  >
                    <MaterialIcons name="remove-circle" size={24} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        <TouchableOpacity
          style={styles.createExerciceButton}
          onPress={() => navigation.navigate('CreateExercice')}
        >
          <View style={styles.createExerciceContent}>
            <MaterialIcons name="add-circle-outline" size={24} color={COLORS.accent} />
            <Text style={styles.createExerciceText}>Créer un nouvel exercice</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateSeance}
        >
          <Text style={styles.buttonText}>Créer la séance</Text>
        </TouchableOpacity>

      </ScrollView>
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
  formSection: {
    ...globalStyles.card,
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  input: {
    ...globalStyles.input,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 5,
  },
  optionButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  exercicesList: {
    marginTop: 10,
  },
  exerciceItem: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedExerciceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  exerciceInfo: {
    flex: 1,
  },
  exerciceNom: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  exerciceDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  removeButton: {
    padding: 5,
  },
  createButton: {
    ...globalStyles.button,
    margin: 15,
    marginBottom: 30,
  },
  buttonText: {
    ...globalStyles.buttonText,
  },
  exerciceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciceFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    marginTop: 8,
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
    marginHorizontal: 15,
    marginBottom: 30,
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
});

export default CreateSeance; 