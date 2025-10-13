// Lightweight Machine Learning Models for MIC Browser Ultimate Learning Engine
// Implements simple but effective ML algorithms without heavy dependencies

const { EventEmitter } = require('events');

class LightweightMLModels extends EventEmitter {
  constructor() {
    super();
    this.models = {
      patternClassifier: new PatternClassifier(),
      sequencePredictor: new SequencePredictor(),
      preferenceClassifier: new PreferenceClassifier(),
      anomalyDetector: new AnomalyDetector(),
      clusteringEngine: new ClusteringEngine()
    };
  }
  
  async initialize() {
    console.log('🤖 Initializing Lightweight ML Models...');
    
    for (const [name, model] of Object.entries(this.models)) {
      await model.initialize();
      console.log(`📊 ${name} initialized`);
    }
    
    console.log('✅ All ML models initialized');
  }
  
  getModel(modelName) {
    return this.models[modelName];
  }
  
  async trainAll(trainingData) {
    const results = {};
    
    for (const [name, model] of Object.entries(this.models)) {
      try {
        const result = await model.train(trainingData);
        results[name] = result;
      } catch (error) {
        console.error(`Error training ${name}:`, error);
        results[name] = { success: false, error: error.message };
      }
    }
    
    return results;
  }
}

// Pattern Classification using Naive Bayes
class PatternClassifier {
  constructor() {
    this.vocabulary = new Set();
    this.classStats = new Map(); // class -> { wordCounts, totalWords, docCount }
    this.totalDocs = 0;
  }
  
  async initialize() {
    this.vocabulary.clear();
    this.classStats.clear();
    this.totalDocs = 0;
  }
  
  async train(patterns) {
    patterns.forEach(pattern => {
      const features = this.extractFeatures(pattern);
      const className = pattern.type || 'unknown';
      
      this.addToVocabulary(features);
      this.updateClassStats(className, features);
      this.totalDocs++;
    });
    
    return { success: true, classes: this.classStats.size, vocabulary: this.vocabulary.size };
  }
  
  extractFeatures(pattern) {
    const features = [];
    
    // Extract features from pattern
    if (pattern.component) features.push(`comp_${pattern.component}`);
    if (pattern.action) features.push(`act_${pattern.action}`);
    if (pattern.context) {
      Object.keys(pattern.context).forEach(key => {
        features.push(`ctx_${key}`);
      });
    }
    if (pattern.features) {
      pattern.features.forEach(feature => features.push(`feat_${feature}`));
    }
    
    return features;
  }
  
  addToVocabulary(features) {
    features.forEach(feature => this.vocabulary.add(feature));
  }
  
  updateClassStats(className, features) {
    if (!this.classStats.has(className)) {
      this.classStats.set(className, {
        wordCounts: new Map(),
        totalWords: 0,
        docCount: 0
      });
    }
    
    const stats = this.classStats.get(className);
    stats.docCount++;
    
    features.forEach(feature => {
      stats.wordCounts.set(feature, (stats.wordCounts.get(feature) || 0) + 1);
      stats.totalWords++;
    });
  }
  
  async classify(pattern) {
    const features = this.extractFeatures(pattern);
    const scores = new Map();
    
    for (const [className, stats] of this.classStats) {
      let score = Math.log(stats.docCount / this.totalDocs); // Prior probability
      
      for (const feature of features) {
        const wordCount = stats.wordCounts.get(feature) || 0;
        const probability = (wordCount + 1) / (stats.totalWords + this.vocabulary.size); // Laplace smoothing
        score += Math.log(probability);
      }
      
      scores.set(className, score);
    }
    
    // Find best class
    let bestClass = null;
    let bestScore = -Infinity;
    
    for (const [className, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestClass = className;
      }
    }
    
    return {
      class: bestClass,
      confidence: this.normalizeScore(bestScore, scores),
      scores: Object.fromEntries(scores)
    };
  }
  
  normalizeScore(bestScore, allScores) {
    const scores = Array.from(allScores.values());
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    
    if (maxScore === minScore) return 1.0;
    
    return (bestScore - minScore) / (maxScore - minScore);
  }
}

// Sequence Prediction using Markov Chains
class SequencePredictor {
  constructor() {
    this.transitionMatrix = new Map(); // state -> { nextState: count }
    this.stateCounts = new Map();
    this.order = 2; // 2nd order Markov chain
  }
  
  async initialize() {
    this.transitionMatrix.clear();
    this.stateCounts.clear();
  }
  
  async train(sequences) {
    sequences.forEach(sequence => {
      if (sequence.length < this.order + 1) return;
      
      for (let i = 0; i <= sequence.length - this.order - 1; i++) {
        const state = this.createState(sequence.slice(i, i + this.order));
        const nextState = this.createState([sequence[i + this.order]]);
        
        this.addTransition(state, nextState);
      }
    });
    
    this.normalizeTransitions();
    
    return { 
      success: true, 
      states: this.transitionMatrix.size,
      transitions: this.getTotalTransitions()
    };
  }
  
  createState(actions) {
    return actions.map(action => `${action.component}:${action.action}`).join('->');
  }
  
  addTransition(fromState, toState) {
    if (!this.transitionMatrix.has(fromState)) {
      this.transitionMatrix.set(fromState, new Map());
    }
    
    const transitions = this.transitionMatrix.get(fromState);
    transitions.set(toState, (transitions.get(toState) || 0) + 1);
    
    this.stateCounts.set(fromState, (this.stateCounts.get(fromState) || 0) + 1);
  }
  
  normalizeTransitions() {
    for (const [fromState, transitions] of this.transitionMatrix) {
      const total = this.stateCounts.get(fromState);
      
      for (const [toState, count] of transitions) {
        transitions.set(toState, count / total);
      }
    }
  }
  
  async predict(currentSequence, numPredictions = 3) {
    if (currentSequence.length < this.order) return [];
    
    const currentState = this.createState(currentSequence.slice(-this.order));
    const transitions = this.transitionMatrix.get(currentState);
    
    if (!transitions) return [];
    
    // Sort by probability and return top predictions
    const predictions = Array.from(transitions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numPredictions)
      .map(([state, probability]) => ({
        state,
        probability,
        actions: this.parseState(state)
      }));
    
    return predictions;
  }
  
  parseState(stateString) {
    return stateString.split('->').map(actionString => {
      const [component, action] = actionString.split(':');
      return { component, action };
    });
  }
  
  getTotalTransitions() {
    let total = 0;
    for (const transitions of this.transitionMatrix.values()) {
      total += transitions.size;
    }
    return total;
  }
}

// Preference Classification using K-Means Clustering
class PreferenceClassifier {
  constructor() {
    this.clusters = new Map();
    this.centroids = [];
    this.k = 5; // Number of preference clusters
  }
  
  async initialize() {
    this.clusters.clear();
    this.centroids = [];
  }
  
  async train(userInteractions) {
    const features = userInteractions.map(interaction => this.extractPreferenceFeatures(interaction));
    
    if (features.length < this.k) {
      this.k = Math.max(2, features.length);
    }
    
    // Initialize centroids randomly
    this.centroids = this.initializeCentroids(features, this.k);
    
    // K-means clustering
    for (let iteration = 0; iteration < 100; iteration++) {
      const oldCentroids = this.centroids.map(c => [...c]);
      
      // Assign points to clusters
      this.assignToClusters(features);
      
      // Update centroids
      this.updateCentroids(features);
      
      // Check convergence
      if (this.centroidsConverged(oldCentroids, this.centroids)) {
        break;
      }
    }
    
    return { success: true, clusters: this.k, iterations: 100 };
  }
  
  extractPreferenceFeatures(interaction) {
    const features = [];
    
    // Time-based features
    const hour = new Date(interaction.timestamp).getHours();
    features.push(hour / 24); // Normalize to 0-1
    
    // Component usage
    const componentMap = { 'ui': 0, 'chatai': 1, 'voice': 2, 'workflow': 3, 'ocr': 4, 'transfer': 5 };
    features.push((componentMap[interaction.component] || 0) / Object.keys(componentMap).length);
    
    // Duration (if available)
    features.push(Math.min((interaction.duration || 1000) / 10000, 1)); // Normalize
    
    // Satisfaction (if available)
    features.push(interaction.satisfaction || 0.5);
    
    // Feature count
    features.push(Math.min((interaction.features?.length || 1) / 10, 1));
    
    return features;
  }
  
  initializeCentroids(features, k) {
    const centroids = [];
    const featureCount = features[0]?.length || 5;
    
    for (let i = 0; i < k; i++) {
      const centroid = [];
      for (let j = 0; j < featureCount; j++) {
        centroid.push(Math.random());
      }
      centroids.push(centroid);
    }
    
    return centroids;
  }
  
  assignToClusters(features) {
    this.clusters.clear();
    
    features.forEach((feature, index) => {
      let closestCentroid = 0;
      let minDistance = this.euclideanDistance(feature, this.centroids[0]);
      
      for (let i = 1; i < this.centroids.length; i++) {
        const distance = this.euclideanDistance(feature, this.centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = i;
        }
      }
      
      if (!this.clusters.has(closestCentroid)) {
        this.clusters.set(closestCentroid, []);
      }
      this.clusters.get(closestCentroid).push(index);
    });
  }
  
  updateCentroids(features) {
    for (let i = 0; i < this.centroids.length; i++) {
      const clusterPoints = this.clusters.get(i) || [];
      
      if (clusterPoints.length === 0) continue;
      
      const newCentroid = new Array(this.centroids[i].length).fill(0);
      
      clusterPoints.forEach(pointIndex => {
        const point = features[pointIndex];
        point.forEach((value, dim) => {
          newCentroid[dim] += value;
        });
      });
      
      newCentroid.forEach((sum, dim) => {
        newCentroid[dim] = sum / clusterPoints.length;
      });
      
      this.centroids[i] = newCentroid;
    }
  }
  
  euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < Math.min(point1.length, point2.length); i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }
  
  centroidsConverged(old, current, threshold = 0.001) {
    for (let i = 0; i < old.length; i++) {
      const distance = this.euclideanDistance(old[i], current[i]);
      if (distance > threshold) return false;
    }
    return true;
  }
  
  async classify(interaction) {
    const features = this.extractPreferenceFeatures(interaction);
    
    let closestCluster = 0;
    let minDistance = this.euclideanDistance(features, this.centroids[0]);
    
    for (let i = 1; i < this.centroids.length; i++) {
      const distance = this.euclideanDistance(features, this.centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = i;
      }
    }
    
    return {
      cluster: closestCluster,
      distance: minDistance,
      confidence: Math.max(0, 1 - minDistance)
    };
  }
}

// Anomaly Detection using Statistical Methods
class AnomalyDetector {
  constructor() {
    this.baseline = {
      componentUsage: new Map(),
      actionFrequency: new Map(),
      timeDistribution: new Array(24).fill(0),
      sessionDuration: { mean: 0, stdDev: 0 }
    };
    this.threshold = 2; // Standard deviations
  }
  
  async initialize() {
    this.baseline = {
      componentUsage: new Map(),
      actionFrequency: new Map(),
      timeDistribution: new Array(24).fill(0),
      sessionDuration: { mean: 0, stdDev: 0 }
    };
  }
  
  async train(interactions) {
    this.calculateBaseline(interactions);
    return { success: true, baseline: 'calculated' };
  }
  
  calculateBaseline(interactions) {
    // Component usage baseline
    interactions.forEach(interaction => {
      const comp = interaction.component;
      this.baseline.componentUsage.set(comp, (this.baseline.componentUsage.get(comp) || 0) + 1);
      
      const action = `${comp}:${interaction.action}`;
      this.baseline.actionFrequency.set(action, (this.baseline.actionFrequency.get(action) || 0) + 1);
      
      // Time distribution
      const hour = new Date(interaction.timestamp).getHours();
      this.baseline.timeDistribution[hour]++;
    });
    
    // Calculate session duration statistics
    const durations = interactions
      .filter(i => i.duration)
      .map(i => i.duration);
    
    if (durations.length > 0) {
      this.baseline.sessionDuration.mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - this.baseline.sessionDuration.mean, 2), 0) / durations.length;
      this.baseline.sessionDuration.stdDev = Math.sqrt(variance);
    }
    
    // Normalize distributions
    this.normalizeBaseline(interactions.length);
  }
  
  normalizeBaseline(totalInteractions) {
    // Normalize component usage
    for (const [comp, count] of this.baseline.componentUsage) {
      this.baseline.componentUsage.set(comp, count / totalInteractions);
    }
    
    // Normalize action frequency
    for (const [action, count] of this.baseline.actionFrequency) {
      this.baseline.actionFrequency.set(action, count / totalInteractions);
    }
    
    // Normalize time distribution
    const totalTimeInteractions = this.baseline.timeDistribution.reduce((sum, count) => sum + count, 0);
    this.baseline.timeDistribution = this.baseline.timeDistribution.map(count => count / totalTimeInteractions);
  }
  
  async detect(interaction) {
    const anomalies = [];
    
    // Check component usage anomaly
    const expectedComponentUsage = this.baseline.componentUsage.get(interaction.component) || 0;
    if (expectedComponentUsage < 0.01) { // Less than 1% of normal usage
      anomalies.push({
        type: 'unusual_component',
        component: interaction.component,
        severity: 'medium',
        expected: expectedComponentUsage
      });
    }
    
    // Check time anomaly
    const hour = new Date(interaction.timestamp).getHours();
    const expectedTimeUsage = this.baseline.timeDistribution[hour] || 0;
    if (expectedTimeUsage < 0.02) { // Less than 2% of normal time usage
      anomalies.push({
        type: 'unusual_time',
        hour,
        severity: 'low',
        expected: expectedTimeUsage
      });
    }
    
    // Check duration anomaly
    if (interaction.duration && this.baseline.sessionDuration.stdDev > 0) {
      const zScore = Math.abs(interaction.duration - this.baseline.sessionDuration.mean) / this.baseline.sessionDuration.stdDev;
      if (zScore > this.threshold) {
        anomalies.push({
          type: 'unusual_duration',
          duration: interaction.duration,
          zScore,
          severity: zScore > 3 ? 'high' : 'medium'
        });
      }
    }
    
    return {
      isAnomaly: anomalies.length > 0,
      anomalies,
      confidence: anomalies.length > 0 ? Math.min(anomalies.length / 3, 1) : 0
    };
  }
}

// Simple Clustering Engine for Pattern Grouping
class ClusteringEngine {
  constructor() {
    this.clusters = [];
    this.clusterThreshold = 0.7; // Similarity threshold for clustering
  }
  
  async initialize() {
    this.clusters = [];
  }
  
  async train(patterns) {
    this.clusters = this.hierarchicalClustering(patterns);
    return { success: true, clusters: this.clusters.length };
  }
  
  hierarchicalClustering(patterns) {
    if (patterns.length === 0) return [];
    
    // Start with each pattern as its own cluster
    const clusters = patterns.map((pattern, index) => ({
      id: index,
      patterns: [pattern],
      centroid: this.calculateCentroid([pattern])
    }));
    
    // Merge similar clusters
    while (true) {
      let bestMerge = null;
      let bestSimilarity = 0;
      
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const similarity = this.calculateClusterSimilarity(clusters[i], clusters[j]);
          if (similarity > bestSimilarity && similarity > this.clusterThreshold) {
            bestSimilarity = similarity;
            bestMerge = { i, j };
          }
        }
      }
      
      if (!bestMerge) break;
      
      // Merge clusters
      const mergedCluster = {
        id: `${clusters[bestMerge.i].id}_${clusters[bestMerge.j].id}`,
        patterns: [...clusters[bestMerge.i].patterns, ...clusters[bestMerge.j].patterns],
        centroid: null
      };
      mergedCluster.centroid = this.calculateCentroid(mergedCluster.patterns);
      
      // Remove old clusters and add merged cluster
      clusters.splice(Math.max(bestMerge.i, bestMerge.j), 1);
      clusters.splice(Math.min(bestMerge.i, bestMerge.j), 1);
      clusters.push(mergedCluster);
    }
    
    return clusters;
  }
  
  calculateCentroid(patterns) {
    const centroid = {
      components: new Map(),
      actions: new Map(),
      avgConfidence: 0,
      avgOccurrences: 0
    };
    
    patterns.forEach(pattern => {
      if (pattern.component) {
        centroid.components.set(pattern.component, (centroid.components.get(pattern.component) || 0) + 1);
      }
      if (pattern.action) {
        centroid.actions.set(pattern.action, (centroid.actions.get(pattern.action) || 0) + 1);
      }
      centroid.avgConfidence += pattern.confidence || 0;
      centroid.avgOccurrences += pattern.occurrences || 1;
    });
    
    centroid.avgConfidence /= patterns.length;
    centroid.avgOccurrences /= patterns.length;
    
    return centroid;
  }
  
  calculateClusterSimilarity(cluster1, cluster2) {
    const c1 = cluster1.centroid;
    const c2 = cluster2.centroid;
    
    // Component similarity
    const allComponents = new Set([...c1.components.keys(), ...c2.components.keys()]);
    let componentSimilarity = 0;
    
    for (const comp of allComponents) {
      const freq1 = (c1.components.get(comp) || 0) / cluster1.patterns.length;
      const freq2 = (c2.components.get(comp) || 0) / cluster2.patterns.length;
      componentSimilarity += Math.min(freq1, freq2);
    }
    
    // Action similarity
    const allActions = new Set([...c1.actions.keys(), ...c2.actions.keys()]);
    let actionSimilarity = 0;
    
    for (const action of allActions) {
      const freq1 = (c1.actions.get(action) || 0) / cluster1.patterns.length;
      const freq2 = (c2.actions.get(action) || 0) / cluster2.patterns.length;
      actionSimilarity += Math.min(freq1, freq2);
    }
    
    // Confidence similarity
    const confidenceSimilarity = 1 - Math.abs(c1.avgConfidence - c2.avgConfidence);
    
    return (componentSimilarity + actionSimilarity + confidenceSimilarity) / 3;
  }
  
  async assignToCluster(pattern) {
    if (this.clusters.length === 0) return null;
    
    let bestCluster = null;
    let bestSimilarity = 0;
    
    this.clusters.forEach((cluster, index) => {
      const similarity = this.calculatePatternClusterSimilarity(pattern, cluster);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = { index, cluster, similarity };
      }
    });
    
    return bestCluster && bestCluster.similarity > this.clusterThreshold ? bestCluster : null;
  }
  
  calculatePatternClusterSimilarity(pattern, cluster) {
    const centroid = cluster.centroid;
    
    let similarity = 0;
    let factors = 0;
    
    // Component similarity
    if (pattern.component && centroid.components.has(pattern.component)) {
      similarity += centroid.components.get(pattern.component) / cluster.patterns.length;
      factors++;
    }
    
    // Action similarity
    if (pattern.action && centroid.actions.has(pattern.action)) {
      similarity += centroid.actions.get(pattern.action) / cluster.patterns.length;
      factors++;
    }
    
    // Confidence similarity
    if (pattern.confidence !== undefined) {
      similarity += 1 - Math.abs(pattern.confidence - centroid.avgConfidence);
      factors++;
    }
    
    return factors > 0 ? similarity / factors : 0;
  }
}

module.exports = {
  LightweightMLModels,
  PatternClassifier,
  SequencePredictor,
  PreferenceClassifier,
  AnomalyDetector,
  ClusteringEngine
};