// UserBehaviorPredictor.js
// Mission: Predict user behavior using three algorithms + Zustand store
// Implementation uses React Context for state management (backward compatible)

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// ==================== PREDICTION ALGORITHMS ====================

/**
 * Algorithm 1: Collaborative Filtering
 * Predicts based on similar users' behavior patterns
 */
export const collaborativeFilter = (userHistory, allUsersData, targetItem) => {
  if (!userHistory || userHistory.length === 0) return 0.5;
  
  // Find similar users based on interaction patterns
  const userInteractions = new Set(userHistory.map(h => h.itemId));
  let similarityScore = 0;
  let similarUsers = 0;
  
  allUsersData.forEach(otherUser => {
    if (otherUser.id === userHistory[0]?.userId) return;
    
    const otherInteractions = new Set(otherUser.history?.map(h => h.itemId) || []);
    
    // Calculate Jaccard similarity
    const intersection = [...userInteractions].filter(x => otherInteractions.has(x));
    const union = new Set([...userInteractions, ...otherInteractions]);
    const similarity = intersection.length / union.size;
    
    if (similarity > 0.2) {
      similarUsers++;
      const targetInteraction = otherUser.history?.find(h => h.itemId === targetItem);
      if (targetInteraction) {
        similarityScore += similarity * (targetInteraction.score || 0);
      }
    }
  });
  
  return similarUsers > 0 ? similarityScore / similarUsers : 0.5;
};

/**
 * Algorithm 2: Content-Based Filtering
 * Predicts based on item features and user preferences
 */
export const contentBasedFilter = (userPreferences, itemFeatures) => {
  if (!userPreferences || Object.keys(userPreferences).length === 0) return 0.5;
  if (!itemFeatures || Object.keys(itemFeatures).length === 0) return 0.5;
  
  let score = 0;
  let weightSum = 0;
  
  // Match user preference weights with item feature scores
  Object.entries(userPreferences).forEach(([feature, weight]) => {
    const featureScore = itemFeatures[feature] || 0;
    score += weight * featureScore;
    weightSum += Math.abs(weight);
  });
  
  return weightSum > 0 ? score / weightSum : 0.5;
};

/**
 * Algorithm 3: Hybrid Scoring
 * Combines collaborative and content-based with adaptive weighting
 */
export const hybridPredict = (userHistory, allUsersData, userPreferences, targetItem, itemFeatures) => {
  const collabScore = collaborativeFilter(userHistory, allUsersData, targetItem);
  const contentScore = contentBasedFilter(userPreferences, itemFeatures);
  
  // Adaptive weighting based on data availability
  const collabWeight = userHistory.length > 5 ? 0.6 : 0.3;
  const contentWeight = Object.keys(userPreferences).length > 0 ? 0.6 : 0.3;
  const baseWeight = 1 - (collabWeight + contentWeight - 0.3);
  
  return (collabScore * collabWeight) + (contentScore * contentWeight) + (0.5 * baseWeight);
};

// ==================== STORE (Zustand-like with React Context) ====================

const initialState = {
  // User interaction history
  history: [],
  // User preferences learned over time
  preferences: {},
  // Predicted next actions
  predictions: [],
  // Model metrics
  metrics: {
    totalPredictions: 0,
    accuracy: 0,
    avgConfidence: 0,
    lastUpdate: null
  }
};

const ACTION_TYPES = {
  RECORD_INTERACTION: 'RECORD_INTERACTION',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  ADD_PREDICTION: 'ADD_PREDICTION',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  SET_ALL_USERS_DATA: 'SET_ALL_USERS_DATA'
};

function reducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.RECORD_INTERACTION: {
      const newHistory = [...state.history, action.payload].slice(-100); // Keep last 100
      return { ...state, history: newHistory };
    }
    
    case ACTION_TYPES.UPDATE_PREFERENCES: {
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    }
    
    case ACTION_TYPES.ADD_PREDICTION: {
      const newPredictions = [...state.predictions, action.payload].slice(-10);
      return {
        ...state,
        predictions: newPredictions,
        metrics: {
          ...state.metrics,
          totalPredictions: state.metrics.totalPredictions + 1,
          lastUpdate: Date.now()
        }
      };
    }
    
    case ACTION_TYPES.CLEAR_HISTORY: {
      return { ...state, history: [], predictions: [] };
    }
    
    case ACTION_TYPES.SET_ALL_USERS_DATA: {
      return { ...state, allUsersData: action.payload };
    }
    
    default:
      return state;
  }
}

// Create Context
const UserBehaviorContext = createContext(null);

// Provider Component
export function UserBehaviorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Record user interaction
  const recordInteraction = useCallback((interaction) => {
    dispatch({
      type: ACTION_TYPES.RECORD_INTERACTION,
      payload: {
        ...interaction,
        timestamp: Date.now()
      }
    });
    
    // Auto-update preferences based on interaction
    if (interaction.feature && interaction.value !== undefined) {
      const currentWeight = state.preferences[interaction.feature] || 0;
      const newWeight = currentWeight * 0.9 + interaction.value * 0.1; // Exponential moving average
      dispatch({
        type: ACTION_TYPES.UPDATE_PREFERENCES,
        payload: { [interaction.feature]: newWeight }
      });
    }
  }, [state.preferences]);
  
  // Get prediction for a specific item
  const predict = useCallback((targetItem, itemFeatures = {}) => {
    const score = hybridPredict(
      state.history,
      state.allUsersData || [],
      state.preferences,
      targetItem,
      itemFeatures
    );
    
    // Add prediction to history
    dispatch({
      type: ACTION_TYPES.ADD_PREDICTION,
      payload: { itemId: targetItem, score, timestamp: Date.now() }
    });
    
    return score;
  }, [state.history, state.preferences]);
  
  // Get next likely action
  const getNextPrediction = useCallback(() => {
    if (state.predictions.length === 0) return null;
    return state.predictions[state.predictions.length - 1];
  }, [state.predictions]);
  
  // Get preference summary
  const getPreferences = useCallback(() => state.preferences, [state.preferences]);
  
  // Set all users data (for collaborative filtering)
  const setAllUsersData = useCallback((data) => {
    dispatch({ type: ACTION_TYPES.SET_ALL_USERS_DATA, payload: data });
  }, []);
  
  // Clear history
  const clearHistory = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_HISTORY });
  }, []);
  
  const value = useMemo(() => ({
    state,
    recordInteraction,
    predict,
    getNextPrediction,
    getPreferences,
    setAllUsersData,
    clearHistory,
    // Export algorithms for external use
    algorithms: {
      collaborativeFilter,
      contentBasedFilter,
      hybridPredict
    }
  }), [state, recordInteraction, predict, getNextPrediction, getPreferences, setAllUsersData, clearHistory]);
  
  return (
    <UserBehaviorContext.Provider value={value}>
      {children}
    </UserBehaviorContext.Provider>
  );
}

// Hook to use the predictor
export function useUserBehavior() {
  const context = useContext(UserBehaviorContext);
  if (!context) {
    throw new Error('useUserBehavior must be used within a UserBehaviorProvider');
  }
  return context;
}

// Export algorithms for direct use
export { collaborativeFilter, contentBasedFilter, hybridPredict };

export default UserBehaviorProvider;
