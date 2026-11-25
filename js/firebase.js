/* Collegamento a Firebase: login (Google o email) e salvataggio su Firestore.
 * Struttura dei dati:
 *   users/{uid}/meta/settings   obiettivi (kcal, bicchieri, ml)
 *   users/{uid}/meta/week       menù settimanale
 *   users/{uid}/meta/foods      alimenti aggiunti da te
 *   users/{uid}/meta/plan       piano della dieta dell'utente
 *   users/{uid}/meta/salute     condizioni scelte e alimenti segnati a mano dall'utente
 *   users/{uid}/days/{AAAA-MM-GG}  diario del giorno (pasti, acqua, sintomi, note)
 *   catalogo/modifiche          modifiche al catalogo alimenti comune (le scrive solo l'amministratore)
 *   catalogo/condizioni         modifiche alle liste per condizione (solo l'amministratore)
 *   catalogo/amministratori     { uids: [...] } chi può modificare il catalogo comune
 */
const V = '10.14.1';
const base = `https://www.gstatic.com/firebasejs/${V}/`;

export async function connect(config) {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(config);
  const auth = A.getAuth(app);
  auth.languageCode = 'it';
  let db;
  try {
    // Cache locale: l'app funziona offline e sincronizza appena torna la rete.
    db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  } catch (e) {
    db = F.getFirestore(app);
  }
  // Firestore non accetta liste dentro liste (piano: equivalenze; settimana: 7 giorni di pasti).
  // Quei documenti si salvano come testo JSON in un solo campo e si ricompongono alla lettura.
  const hasNested = (v, inArr) => Array.isArray(v) ? (inArr || v.some(x => hasNested(x, true)))
    : v && typeof v === 'object' ? Object.values(v).some(x => hasNested(x, false)) : false;
  const enc = d => hasNested(d, false) ? { _json: JSON.stringify(d) } : d;
  const dec = v => v && typeof v._json === 'string' ? JSON.parse(v._json) : v;
  const ref = (uid, key) => key.startsWith('day:')
    ? F.doc(db, 'users', uid, 'days', key.slice(4))
    : F.doc(db, 'users', uid, 'meta', key);

  return {
    onUser: cb => A.onAuthStateChanged(auth, cb),
    google: () => A.signInWithPopup(auth, new A.GoogleAuthProvider()),
    emailLogin: (e, p) => A.signInWithEmailAndPassword(auth, e, p),
    emailSignup: (e, p) => A.createUserWithEmailAndPassword(auth, e, p),
    resetPassword: e => A.sendPasswordResetEmail(auth, e),
    logout: () => A.signOut(auth),
    async get(uid, key) {
      const s = await F.getDoc(ref(uid, key));
      return s.exists() ? dec(s.data()) : null;
    },
    set: (uid, key, data) => F.setDoc(ref(uid, key), enc(data)),
    async getShared(id) {
      const s = await F.getDoc(F.doc(db, 'catalogo', id));
      return s.exists() ? dec(s.data()) : null;
    },
    setShared: (id, data) => F.setDoc(F.doc(db, 'catalogo', id), enc(data)),
    async listDays(uid) {
      const qs = await F.getDocs(F.collection(db, 'users', uid, 'days'));
      const out = {};
      qs.forEach(d => { out[d.id] = dec(d.data()); });
      return out;
    },
  };
}
