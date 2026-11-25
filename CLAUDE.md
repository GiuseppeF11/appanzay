# Appanzay — istruzioni per lo sviluppo

- Lingua: rispondi, scrivi commit, commenti e testi dell'app **solo in italiano**.
- App statica senza build: `index.html`, `css/app.css`, `js/*.js`. Pubblicata con GitHub Pages da `main`.
- Ogni sviluppo su un branch (`feat/...` o `fix/...`), poi merge `--no-ff` in `main`.
- **Prima di ogni rilascio** esegui `python3 scripts/bump_version.py` (`patch` per le correzioni, `minor` per le funzioni nuove) e includi i file modificati nel commit. Comunica all'utente il numero di versione rilasciato.
- **Nessun dato personale nel repository** (è pubblico): niente piani reali, patologie o nomi di utenti. I piani stanno nell'account di ogni utente; il codice usa solo il piano caricato (`PL`).
- Catalogo alimenti comune = base `js/foods.js` (una riga per alimento, 6 campi separati da `|`, formato in testa al file) + modifiche dell'amministratore salvate su Firestore in `catalogo/modifiche` (`righe` e `rimossi`, applicate sopra la base da `buildCatalog`). Solo dati neutri: kcal, unità, sinonimi, note oggettive. Mai stati di dieta. Gli alimenti aggiunti dal singolo utente restano nel suo account (`meta/foods`).
- Liste per condizione (patologie, intolleranze, allergie, gravidanza…) = base `js/patologie.js` (blocchi `@id|gruppo|nome|nota` + righe `vietato|motivo|Alimento;…`, nomi del catalogo) + modifiche dell'amministratore su Firestore `catalogo/condizioni` (`blocchi`, `rimossi`), applicate da `buildConds`. Dati generici, mai personali. Le condizioni scelte e gli alimenti segnati da ogni utente stanno in `users/{uid}/meta/salute` (`SALUTE`).
- Stato di un alimento (`finalize`): vince la scelta manuale dell'utente, poi il più restrittivo tra piano e condizioni; se il piano lo prevede e una condizione no, l'app lo dice. Alternativa non propone vietati e penalizza gli sconsigliati.
- Amministratore del catalogo: `catalogo/amministratori` (`uids`); lo controllano le regole in `firestore.rules`. Se cambi le regole, ricorda all'utente di ripubblicarle nella console Firebase.
- Formato del piano: `modello/ISTRUZIONI.md` (formato `appanzay-piano`, versione 1). Se cambi il formato aggiorna insieme `validatePlan` e `compilePlan` in `js/app.js`, `modello/ISTRUZIONI.md`, `modello/piano-esempio.json` e il testo per l'AI (`AI_PROMPT`). Se cambi l'enciclopedia rigenera `modello/enciclopedia.md`.
- Grammature dei pasti: solo quelle del piano (menù ed equivalenze), mai inventate nel codice.
- Firebase: configurazione in `js/config.js`, regole in `firestore.rules`.
- Prova le modifiche su schermi da 360-390 px prima di rilasciare.
