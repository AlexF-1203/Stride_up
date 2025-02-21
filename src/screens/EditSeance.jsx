import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { doc, updateDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '../service/firebase';
import { COLORS, globalStyles } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const EditSeance = ({ route, navigation }) => {
  const { seanceId, seance, exercices } = route.params;
  const [nomSeance, setNomSeance] = useState(seance.nom);
  const [notes, setNotes] = useState(seance.notes || '');

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

      await batch.commit();
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la séance');
    }
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
          <Text style={styles.sectionTitle}>Exercices</Text>
          {exercices.map((exercice, index) => (
            <View key={index} style={styles.exerciceItem}>
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
        style={styles.updateButton}
        onPress={handleUpdateSeance}
      >
        <Text style={styles.buttonText}>Mettre à jour la séance</Text>
        <MaterialIcons name="check" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
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
});

export default EditSeance; 