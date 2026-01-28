// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1qtG2MW6SpN6LTGZyhceSi6HcNmoUjpM",
  authDomain: "techexpress-d0b4d.firebaseapp.com",
  projectId: "techexpress-d0b4d",
  storageBucket: "techexpress-d0b4d.firebasestorage.app",
  messagingSenderId: "657920765607",
  appId: "1:657920765607:web:682746f3dd6c779eb13582",
  measurementId: "G-GBQFYS9JZH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);

export { analytics, storage };
export default app;