import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, PanResponder, Animated } from 'react-native';
import { collection, addDoc, doc, updateDoc, writeBatch, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../service/firebase';

const COLORS = {
  background: '#1A1B1E',       // Fond principal très sombre
  surface: '#2A2D36',         // Surface des cartes et conteneurs
  primary: '#3B82F6',         // Bleu principal pour les actions importantes
  secondary: '#6366F1',       // Violet-bleu pour les actions secondaires
  accent: '#0EA5E9',         // Bleu clair pour les accents
  success: '#22C55E',        // Vert pour les actions positives
  danger: '#EF4444',         // Rouge pour les actions dangereuses
  warning: '#F59E0B',        // Orange pour les modifications
  text: {
    primary: '#F3F4F6',      // Texte principal presque blanc
    secondary: '#9CA3AF',    // Texte secondaire gris clair
    muted: '#6B7280',        // Texte atténué gris moyen
  }
};

const SeanceEnCours = ({ route, navigation }) => {
  const { seanceId, exercices } = route.params;
  const [currentExerciceIndex, setCurrentExerciceIndex] = useState(0);
  const [series, setSeries] = useState([]);
  const [currentSerie, setCurrentSerie] = useState({
    charge: '',
    reps: '',
    rpe: ''
  });
  const [lastPerformances, setLastPerformances] = useState({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const [timerHeight] = useState(new Animated.Value(150));
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingSerieIndex, setEditingSerieIndex] = useState(null);

  const exerciceActuel = exercices[currentExerciceIndex];
  const nombreSeries = exerciceActuel?.parametres?.series || 0;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < 0 && !isExpanded) {
        Animated.spring(timerHeight, {
          toValue: 300,
          useNativeDriver: false,
        }).start();
        setIsExpanded(true);
      } else if (gestureState.dy > 0 && isExpanded) {
        Animated.spring(timerHeight, {
          toValue: 150,
          useNativeDriver: false,
        }).start();
        setIsExpanded(false);
      }
    },
  });

  useEffect(() => {
    fetchLastPerformances();
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      const startTime = Date.now() - timer * 1000;
      intervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        setTimer(elapsedTime / 1000);
      }, 50);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTimerRunning]);

  const fetchLastPerformances = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const performancesPromises = exercices.map(async (exercice) => {
        const q = query(
          collection(db, 'suivis'),
          where('exercice_id', '==', exercice.exercice_id),
          orderBy('date', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return {
            exercice_id: exercice.exercice_id,
            performance: snapshot.docs[0].data()
          };
        }
        return null;
      });

      const results = await Promise.all(performancesPromises);
      const performancesMap = {};
      results.forEach(result => {
        if (result) {
          performancesMap[result.exercice_id] = result.performance;
        }
      });

      setLastPerformances(performancesMap);
    } catch (error) {
      console.error('Erreur récupération performances:', error);
    }
  };

  const handleSaveSerie = async () => {
    if (!currentSerie.charge || !currentSerie.reps) {
      Alert.alert('Erreur', 'Veuillez remplir la charge et les répétitions');
      return;
    }

    const nouvellesSeries = [...series];
    nouvellesSeries[currentExerciceIndex] = nouvellesSeries[currentExerciceIndex] || [];

    if (editingSerieIndex !== null) {
      nouvellesSeries[currentExerciceIndex][editingSerieIndex] = {
        ...currentSerie,
        charge: Number(currentSerie.charge),
        reps: Number(currentSerie.reps),
        rpe: currentSerie.rpe ? Number(currentSerie.rpe) : null
      };
      setEditingSerieIndex(null);
    } else {
      nouvellesSeries[currentExerciceIndex].push({
        ...currentSerie,
        charge: Number(currentSerie.charge),
        reps: Number(currentSerie.reps),
        rpe: currentSerie.rpe ? Number(currentSerie.rpe) : null
      });
    }

    setSeries(nouvellesSeries);
    setCurrentSerie({ charge: '', reps: '', rpe: '' });

    if (nouvellesSeries[currentExerciceIndex].length === nombreSeries) {
      if (currentExerciceIndex < exercices.length - 1) {
        setCurrentExerciceIndex(currentExerciceIndex + 1);
      }
    }
  };

  const handleEditSerie = (index) => {
    const serieToEdit = series[currentExerciceIndex][index];
    setCurrentSerie({
      charge: serieToEdit.charge.toString(),
      reps: serieToEdit.reps.toString(),
      rpe: serieToEdit.rpe ? serieToEdit.rpe.toString() : ''
    });
    setEditingSerieIndex(index);
  };

  const handleLap = () => {
    const lastLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
    const newLap = {
      id: Date.now(),
      time: timer,
      duration: timer - lastLapTime
    };
    setLaps([...laps, newLap]);
  };

  const handleFinishWorkout = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Utilisateur non authentifié');

      const batch = writeBatch(db);

      for (let i = 0; i < exercices.length; i++) {
        const exercice = exercices[i];
        
        const suiviData = {
          user_id: user.uid,
          seance_id: seanceId,
          exercice_id: exercice.exercice_id,
          date: new Date(),
          series: series[i] || [],
          progression: {
            charge_max: Math.max(...(series[i] || []).map(s => s.charge)),
            volume_total: (series[i] || []).reduce((acc, s) => acc + (s.charge * s.reps), 0)
          },
          duration: timer,
          laps: laps,
        };

        const suiviRef = doc(collection(db, 'suivis'));
        batch.set(suiviRef, suiviData);
      }

      await batch.commit();

      Alert.alert('Succès', 'Performances enregistrées avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home')
        }
      ]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder les performances');
    }
  };

  const formatTime = (time) => {
    const pad = (n) => n < 10 ? '0' + n : n;
    const padMilli = (n) => n < 10 ? '0' + n : n;
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time * 100) % 100);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMilli(milliseconds)}`;
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.exerciceTitle}>
            {exerciceActuel?.nom} - Série {(series[currentExerciceIndex]?.length || 0) + 1}/{nombreSeries}
          </Text>
        </View>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (currentExerciceIndex > 0) {
                setCurrentExerciceIndex(currentExerciceIndex - 1);
              }
            }}
            disabled={currentExerciceIndex === 0}
          >
            <Text style={styles.navButtonText}>← Précédent</Text>
          </TouchableOpacity>

          <Text style={styles.exerciceCounter}>
            Exercice {currentExerciceIndex + 1}/{exercices.length}
          </Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (currentExerciceIndex < exercices.length - 1) {
                setCurrentExerciceIndex(currentExerciceIndex + 1);
              }
            }}
            disabled={currentExerciceIndex === exercices.length - 1}
          >
            <Text style={styles.navButtonText}>Suivant →</Text>
          </TouchableOpacity>
        </View>

        {lastPerformances[exerciceActuel?.exercice_id] && (
          <View style={styles.lastPerformance}>
            <Text style={styles.lastPerformanceTitle}>Dernière séance :</Text>
            <Text style={styles.lastPerformanceText}>
              Charge max : {lastPerformances[exerciceActuel.exercice_id].progression.charge_max}kg
            </Text>
            <Text style={styles.lastPerformanceText}>
              Volume total : {lastPerformances[exerciceActuel.exercice_id].progression.volume_total}kg
            </Text>
          </View>
        )}

        <View style={styles.parametresContainer}>
          <Text style={styles.parametresText}>
            Objectif : {exerciceActuel?.parametres?.repetitions} répétitions
          </Text>
          <Text style={styles.parametresText}>
            Tempo : {exerciceActuel?.parametres?.tempo}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Charge (kg)</Text>
            <TextInput
              style={styles.input}
              value={currentSerie.charge}
              onChangeText={(text) => setCurrentSerie({ ...currentSerie, charge: text })}
              keyboardType="numeric"
              placeholder="0"
              returnKeyType="next"
              onSubmitEditing={() => {
                if (currentSerie.charge && currentSerie.reps) {
                  handleSaveSerie();
                }
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Répétitions</Text>
            <TextInput
              style={styles.input}
              value={currentSerie.reps}
              onChangeText={(text) => setCurrentSerie({ ...currentSerie, reps: text })}
              keyboardType="numeric"
              placeholder="0"
              returnKeyType="next"
              onSubmitEditing={() => {
                if (currentSerie.charge && currentSerie.reps) {
                  handleSaveSerie();
                }
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>RPE (1-10)</Text>
            <TextInput
              style={styles.input}
              value={currentSerie.rpe}
              onChangeText={(text) => setCurrentSerie({ ...currentSerie, rpe: text })}
              keyboardType="numeric"
              placeholder="Optional"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (currentSerie.charge && currentSerie.reps) {
                  handleSaveSerie();
                }
              }}
            />
          </View>
        </View>

        {series[currentExerciceIndex]?.length > 0 && (
          <View style={styles.historique}>
            <Text style={styles.historiqueTitle}>Séries effectuées :</Text>
            {series[currentExerciceIndex].map((serie, index) => (
              <View key={index} style={styles.serieItem}>
                <Text style={styles.historiqueItem}>
                  Série {index + 1}: {serie.charge}kg × {serie.reps} reps
                  {serie.rpe ? ` (RPE: ${serie.rpe})` : ''}
                </Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditSerie(index)}
                >
                  <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSerie}
        >
          <Text style={styles.buttonText}>Enregistrer la série</Text>
        </TouchableOpacity>

        {currentExerciceIndex === exercices.length - 1 &&
         series[currentExerciceIndex]?.length === nombreSeries && (
          <TouchableOpacity
            style={[styles.saveButton, styles.finishButton]}
            onPress={handleFinishWorkout}
          >
            <Text style={styles.buttonText}>Terminer la séance</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Animated.View 
        style={[
          styles.timerContainer, 
          { height: timerHeight }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.timerDragHandle} />
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
        
        <View style={styles.timerControls}>
          <TouchableOpacity 
            style={[styles.timerButton, styles.lapButton]}
            onPress={handleLap}
          >
            <Text style={styles.buttonText}>Tour</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.timerButton, styles.startButton]}
            onPress={() => setIsTimerRunning(!isTimerRunning)}
          >
            <Text style={styles.buttonText}>
              {isTimerRunning ? 'Pause' : 'Start'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.timerButton, styles.resetButton]}
            onPress={() => {
              setTimer(0);
              setLaps([]);
            }}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.lapsContainer}>
          {isExpanded ? (
            laps.map((lap, index) => (
              <View key={lap.id} style={styles.lapRow}>
                <Text style={styles.lapText}>Tour {index + 1}</Text>
                <Text style={styles.lapText}>{formatTime(lap.duration)}</Text>
              </View>
            ))
          ) : (
            laps.length > 0 && (
              <View style={styles.lapRow}>
                <Text style={styles.lapText}>
                  Tour {laps.length}
                </Text>
                <Text style={styles.lapText}>
                  {formatTime(laps[laps.length - 1].duration)}
                </Text>
              </View>
            )
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 150,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 15,
  },
  exerciceTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  navButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciceCounter: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  parametresContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  parametresText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    margin: 20,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
  },
  inputGroup: {
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    placeholderTextColor: COLORS.text.secondary,
  },
  historique: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  historiqueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  serieItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historiqueItem: {
    fontSize: 16,
    color: COLORS.text.secondary,
    flex: 1,
  },
  editButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: COLORS.success,
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  lastPerformance: {
    backgroundColor: COLORS.surface,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lastPerformanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: COLORS.text.primary,
  },
  lastPerformanceText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 3,
  },
  timerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timerDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 42,
    textAlign: 'center',
    fontWeight: '300',
    color: COLORS.text.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginVertical: 8,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  timerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  lapButton: {
    backgroundColor: COLORS.secondary,
  },
  resetButton: {
    backgroundColor: COLORS.danger,
  },
  lapsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    margin: 10,
    maxHeight: 120,
  },
  lapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lapText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
  },
});

export default SeanceEnCours; 