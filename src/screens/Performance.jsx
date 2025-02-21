import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../service/firebase';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, globalStyles } from '../theme/colors';

const Performance = ({ route, navigation }) => {
  const { seanceId } = route.params;
  const [performances, setPerformances] = useState([]);
  const [selectedExercice, setSelectedExercice] = useState(null);
  const [showGraph, setShowGraph] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        navigation.navigate('Login');
      } else {
        fetchPerformances();
      }
    };

    checkAuth();
  }, []);

  const fetchPerformances = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer les performances
      const q = query(
        collection(db, 'suivis'),
        where('seance_id', '==', seanceId),
        where('user_id', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const performancesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Récupérer les exercices
      const exercicesSnapshot = await getDocs(collection(db, 'Exercise'));
      const exercicesMap = {};
      exercicesSnapshot.forEach(doc => {
        exercicesMap[doc.id] = doc.data().nom;
      });

      // Regrouper les performances par exercice avec les noms
      const groupedPerformances = performancesList.reduce((acc, performance) => {
        if (!acc[performance.exercice_id]) {
          acc[performance.exercice_id] = {
            exercice_id: performance.exercice_id,
            exercice_nom: exercicesMap[performance.exercice_id] || `Exercice inconnu (${performance.exercice_id})`,
            performances: []
          };
        }
        acc[performance.exercice_id].performances.push(performance);
        return acc;
      }, {});

      setPerformances(Object.values(groupedPerformances));
    } catch (error) {
      console.error('Erreur détaillée:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  const getExerciceData = (exerciceId) => {
    if (!performances || performances.length === 0) return [];
    
    const group = performances.find(p => p.exercice_id === exerciceId);
    if (!group) return [];
    
    return group.performances
      .sort((a, b) => a.date.toDate() - b.date.toDate())
      .slice(-30);
  };

  const renderChart = (exerciceId) => {
    const data = getExerciceData(exerciceId);
    
    // Utiliser le volume total au lieu de la charge maximale
    const values = data.map(p => p.progression.volume_total);
    
    return {
      labels: data.map(p => {
        const date = p.date.toDate();
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          data: values,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2.5
        }
      ]
    };
  };

  const toggleGraph = (exerciceId) => {
    setSelectedExercice(prev => prev === exerciceId ? null : exerciceId);
    setShowGraph(prev => prev === exerciceId ? null : exerciceId);
  };

  return (
    <ScrollView style={styles.container}>


      <Text style={styles.title}>Performances</Text>

      {performances && performances.length > 0 ? (
        performances.map((group, index) => (
          <View key={index}>
            <TouchableOpacity
              style={[
                styles.exerciceItem,
                selectedExercice === group.exercice_id && styles.exerciceItemSelected
              ]}
              onPress={() => toggleGraph(group.exercice_id)}
            >
              <Text style={styles.exerciceName}>{group.exercice_nom}</Text>
              <Text style={styles.performanceCount}>
                {group.performances.length} performance{group.performances.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>

            {showGraph === group.exercice_id && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Volume total (kg)</Text>
                <LineChart
                  data={renderChart(group.exercice_id)}
                  width={Dimensions.get('window').width - 30}
                  height={220}
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  withVerticalLines={false}
                  withHorizontalLines={false}
                  fromZero={true}
                  chartConfig={{
                    backgroundColor: COLORS.surface,
                    backgroundGradientFrom: COLORS.surface,
                    backgroundGradientTo: COLORS.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    labelColor: () => COLORS.text.secondary,
                    style: {
                      borderRadius: 12,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: COLORS.primary,
                      fill: COLORS.accent
                    },
                    propsForLabels: {
                      fontSize: 11,
                      fontWeight: '500'
                    }
                  }}
                  bezier
                  style={styles.chart}
                  formatYLabel={(value) => `${Math.round(value)}`}
                />
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>Aucune performance enregistrée</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 20,
    color: COLORS.text.primary,
    paddingHorizontal: 5,
  },
  exerciceItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exerciceItemSelected: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
  },
  exerciceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    flexShrink: 1,
  },
  performanceCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 20,
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    marginTop: 20,
    fontSize: 16,
  },
});

export default Performance; 