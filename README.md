# Appanzay

App per seguire la propria dieta giorno per giorno: menù, calorie, acqua, alimenti consentiti e spesa. Ogni utente carica il **proprio piano**, un file preparato seguendo il modello in [`modello/`](modello/).

## Cosa fa

- **Piano personale**: stati degli alimenti (previsto, sconsigliato, vietato), menù settimanale, equivalenze, frequenze e obiettivi arrivano dal file del piano, salvato nell'account. Formato: [`modello/ISTRUZIONI.md`](modello/ISTRUZIONI.md).
- **Oggi**: pasti del giorno da segnare come mangiati, calorie rispetto all'obiettivo, bicchieri d'acqua, note (e diario dei sintomi se il piano lo prevede). Le modifiche fatte qui valgono solo per quel giorno.
- **Settimana**: il menù settimanale modificabile, con kcal per giorno, riepilogo della settimana e controllo delle frequenze del piano.
- **I miei pasti**: pasti personalizzati da salvare, modificare e inserire nel menù su uno o più giorni.
- **Primo o secondo**: pranzo e cena sono un primo (piatto unico) o un secondo con contorno; scegliendo il formato dell'altro pasto, pranzo e cena si scambiano con le grammature del piano.
- **Alternativa**: propone un pasto equivalente usando le equivalenze del piano, tenendo conto dei pasti della giornata, delle kcal rimaste, delle frequenze e della stagione.
- **Spesa**: lista calcolata dal menù per periodo, divisa per reparto, con quantità in pezzi, spunte, extra consigliati e copia del testo.
- **Alimenti**: catalogo comune di alimenti (kcal medie, porzioni, sinonimi), uguale per tutti, con lo stato dato dal piano di ognuno; ricerca dei prodotti confezionati su [Open Food Facts](https://world.openfoodfacts.org) (ODbL). Ogni utente può aggiungere alimenti suoi, visibili solo nel suo account.
- **Catalogo comune**: l'amministratore aggiunge, modifica, elimina o importa alimenti dall'app e le modifiche arrivano a tutti gli utenti al successivo avvio.
- **Salute e preferenze**: ogni utente sceglie le sue condizioni (27 tra celiachia, lattosio, i singoli allergeni, colon irritabile, reflusso, calcoli, gotta, diabete, colesterolo, pressione, gravidanza, warfarin…) e può segnare a mano qualsiasi alimento come vietato, sconsigliato o previsto. Vince la scelta manuale, poi lo stato più restrittivo tra piano e condizioni. Le liste per condizione sono in `js/patologie.js` e l'amministratore le può modificare dall'app.
- **Account**: accesso con Google o email, dati personali, obiettivi, piano, backup, versione e aggiornamenti.

Le kcal sono valori medi indicativi per 100 g di parte edibile (margine di circa il 10 %). Appanzay non sostituisce chi ti segue.

## Come si carica un piano

L'app non contiene un'intelligenza artificiale. Chi vuole usarla:

1. scarica il piano di esempio (`modello/piano-esempio.json`);
2. copia il prompt dall'app (in fondo c'è l'elenco dei nomi degli alimenti);
3. dà alla propria AI la sua dieta, l'esempio e il prompt;
4. carica la risposta come file `.json` o incollandola. L'app la controlla e segnala errori e avvisi.

Il formato è descritto in [`modello/ISTRUZIONI.md`](modello/ISTRUZIONI.md).

## Struttura

```
index.html            markup
css/app.css           stile
js/config.js          configurazione Firebase (null = non collegato)
js/version.js         versione (generato da scripts/bump_version.py)
js/foods.js           enciclopedia neutra (una riga per alimento)
js/patologie.js       liste comuni di alimenti per condizione
js/app.js             logica dell'app
js/firebase.js        login e Firestore
modello/              formato del piano: esempio e descrizione del formato
firestore.rules       regole di sicurezza del database
manifest.webmanifest  installazione sul telefono (PWA)
sw.js                 cache offline
icons/                icone
scripts/              strumenti di sviluppo
```

Nessuna build: sono file statici.

## Catalogo alimenti comune

La base è `js/foods.js`. Sopra la base l'app applica le modifiche dell'amministratore salvate su Firestore (`catalogo/modifiche`): alimenti nuovi o modificati e alimenti eliminati. Chi rinomina un alimento non rompe i menù: il nome vecchio resta come sinonimo.

- **Diventare amministratore**: la prima volta, *Account → Catalogo alimenti comune → Diventa amministratore*. Si può fare una sola volta; poi il pulsante sparisce per tutti. L'ID dell'amministratore è in `catalogo/amministratori`.
- **Modificare**: in *Alimenti* l'amministratore tocca un alimento per modificarlo o eliminarlo, oppure usa *+ Nuovo alimento* e *Importa righe* (righe nel formato di `js/foods.js`).
- **Scaricare**: *Account → Scarica catalogo* produce il catalogo completo nello stesso formato, utile per aggiornare `js/foods.js`.
- Nella versione su Claude e senza Firebase si usa solo la base.

## Dove vengono salvati i dati

| Dove la apri | Salvataggio |
|---|---|
| GitHub Pages con Firebase e login | Firestore (`users/{uid}/meta/{plan,settings,week,foods,meals,shop,salute}`, `users/{uid}/days/{AAAA-MM-GG}`; catalogo comune e liste per condizione in `catalogo/`) |
| Senza Firebase o offline | `localStorage` del browser |
| Artifact Claude (claude.ai) | account Claude |

## Collegare Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Aggiungi progetto**.
2. **Firestore Database → Crea database** in modalità produzione, poi incolla `firestore.rules` nella scheda **Regole**.
3. **Authentication**: attiva **Google** ed **Email/password**; in *Domini autorizzati* aggiungi il dominio di GitHub Pages.
4. **Impostazioni progetto → Le tue app → Web**: copia `firebaseConfig` in `js/config.js`.

## Avvio in locale

```
npx serve .
```

## Versioni e rilasci

La versione si vede in **Account**; quando ne esce una nuova compare una barra con **Aggiorna**. Prima di ogni rilascio:

```
python3 scripts/bump_version.py          # minor; "patch" per le correzioni
```

Lo script aggiorna `version.json`, `js/version.js`, la cache del service worker e i `?v=` in `index.html`.
