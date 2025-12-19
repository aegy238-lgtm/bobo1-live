
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// الإعدادات الجديدة المقدمة من قبل المستخدم
const firebaseConfig = {
    apiKey: "AIzaSyC6jaJoEtdxOnnmVbk5HjWiuH9M_yWzrTk",
    authDomain: "bobo-live-bce54.firebaseapp.com",
    projectId: "bobo-live-bce54",
    storageBucket: "bobo-live-bce54.firebasestorage.app",
    messagingSenderId: "386288883998",
    appId: "1:386288883998:web:ce7c14d37dd7371552110f"
};

// تهيئة تطبيق Firebase
const app = initializeApp(firebaseConfig);

/**
 * إعدادات Firestore المتقدمة لضمان استقرار الاتصال
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const auth = getAuth(app);
