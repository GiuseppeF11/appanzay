/* Configurazione Firebase.
 *
 * Incolla qui l'oggetto firebaseConfig della tua app web
 * (Console Firebase → Impostazioni progetto → Le tue app → Configurazione SDK).
 * Questi valori non sono segreti: la protezione dei dati la fanno le regole di Firestore
 * (vedi firestore.rules) e il login.
 *
 * Con null l'app salva solo nel browser (o nell'account Claude, se aperta come artifact).
 */
window.APZ_FIREBASE = {
  apiKey: "AIzaSyABKP4_4hFYit4AfQ668yB0d7XA1xdf1qc",
  authDomain: "appanzay.firebaseapp.com",
  projectId: "appanzay",
  storageBucket: "appanzay.firebasestorage.app",
  messagingSenderId: "730277996167",
  appId: "1:730277996167:web:d9bb20cc74d66716f8ba22"
};

/* Esempio:
window.APZ_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "appanzay-xxxx.firebaseapp.com",
  projectId: "appanzay-xxxx",
  storageBucket: "appanzay-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
*/
