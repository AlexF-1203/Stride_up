import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../service/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
const CreateExercice = ({ navigation }) => {
  const [nom, setNom] = useState('');
  const [groupeMusculaire, setGroupeMusculaire] = useState('');
  const [parametres, setParametres] = useState({
    series: '',
    repetitions: '',
    tempo: '',
    repos: ''
  });
  const [showPicker, setShowPicker] = useState(false);

  const groupesMusculaires = [
    'Pectoraux',
    'Dos',
    'Épaules',
    'Biceps',
    'Triceps',
    'Jambes',
    'Abdominaux',
    'Avant-bras',
    'Mollets'
  ];

  const handleCreateExercice = async () => {
    try {
      if (!nom.trim()) {
        Alert.alert('Erreur', 'Le nom de l\'exercice est requis');
        return;
      }
      if (!groupeMusculaire) {
        Alert.alert('Erreur', 'Le groupe musculaire est requis');
        return;
      }
      if (!parametres.series || !parametres.repetitions) {
        Alert.alert('Erreur', 'Le nombre de séries et de répétitions est requis');
        return;
      }

      const user = auth.currentUser;
      const exerciceData = {
        nom: nom.trim(),
        groupe_musculaire: groupeMusculaire,
        parametres_par_defaut: {
          series: parseInt(parametres.series),
          repetitions: parseInt(parametres.repetitions),
          tempo: parametres.tempo || '1-0-1-0',
          repos: parseInt(parametres.repos) || 60
        },
        user_id: user.uid,
        created_at: new Date()
      };

      await addDoc(collection(db, 'Exercise'), exerciceData);
      Alert.alert('Succès', 'Exercice créé avec succès', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('CreateSeance', { refresh: true });
          }
        }
      ]);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'exercice');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations de l'exercice</Text>
          
          <Text style={styles.label}>Nom de l'exercice</Text>
          <TextInput
            style={styles.input}
            value={nom}
            onChangeText={setNom}
            placeholder="Ex: Développé couché"
            placeholderTextColor={COLORS.text.secondary}
          />

          <Text style={styles.label}>Groupe musculaire</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {groupeMusculaire || "Sélectionner un groupe"}
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
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Paramètres par défaut</Text>
          
          <View style={styles.paramRow}>
            <View style={styles.paramGroup}>
              <Text style={styles.label}>Séries</Text>
              <TextInput
                style={styles.input}
                value={parametres.series}
                onChangeText={(text) => setParametres({...parametres, series: text})}
                keyboardType="numeric"
                placeholder="3"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>

            <View style={styles.paramGroup}>
              <Text style={styles.label}>Répétitions</Text>
              <TextInput
                style={styles.input}
                value={parametres.repetitions}
                onChangeText={(text) => setParametres({...parametres, repetitions: text})}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
          </View>

          <View style={styles.paramRow}>
            <View style={styles.paramGroup}>
              <Text style={styles.label}>Tempo</Text>
              <TextInput
                style={styles.input}
                value={parametres.tempo}
                onChangeText={(text) => setParametres({...parametres, tempo: text})}
                placeholder="1-0-1-0"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>

            <View style={styles.paramGroup}>
              <Text style={styles.label}>Repos (sec)</Text>
              <TextInput
                style={styles.input}
                value={parametres.repos}
                onChangeText={(text) => setParametres({...parametres, repos: text})}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateExercice}
        >
          <Text style={styles.buttonText}>Créer l'exercice</Text>
          <MaterialIcons name="add-circle-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </ScrollView>
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
    padding: 15,
  },
  formSection: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: COLORS.text.primary,
    fontSize: 16,
    marginBottom: 15,
  },
  pickerButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
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
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paramGroup: {
    flex: 1,
    marginRight: 10,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default CreateExercice; 