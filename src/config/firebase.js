// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, get, query, orderByChild } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAb3RNnm0JHRJazDA4Glvwd6W-MzSSKZV4",
  authDomain: "raptor-dfac-survey.firebaseapp.com",
  databaseURL: "https://raptor-dfac-survey-default-rtdb.firebaseio.com",
  projectId: "raptor-dfac-survey",
  storageBucket: "raptor-dfac-survey.firebasestorage.app",
  messagingSenderId: "1094284947358",
  appId: "1:1094284947358:web:0b9a7ef154fa503d0d708f",
  measurementId: "G-M9D84EKZT3"
};

let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Submit a survey response
export const submitSurvey = async (surveyData) => {
  try {
    const surveysRef = ref(database, 'surveys');
    const newSurveyRef = await push(surveysRef, surveyData);
    return newSurveyRef.key;
  } catch (error) {
    console.error('Error submitting survey:', error);
    throw error;
  }
};

// Get all survey responses
export const getSurveyResponses = async () => {
  try {
    const surveysRef = ref(database, 'surveys');
    const surveysQuery = query(surveysRef, orderByChild('timestamp'));
    const snapshot = await get(surveysQuery);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array and add IDs
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).reverse(); // Most recent first
    }
    return [];
  } catch (error) {
    console.error('Error fetching surveys:', error);
    throw error;
  }
};

export default app;