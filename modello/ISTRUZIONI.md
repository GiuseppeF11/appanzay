# Come preparare il file del tuo piano per Appanzay

Appanzay legge la tua dieta da **un file `.json`** con un formato preciso. Non serve scriverlo a mano: puoi farlo generare dalla tua intelligenza artificiale (Claude, ChatGPT, Gemini…) partendo dal piano che ti ha dato il tuo professionista.

## In tre passi

1. **Scarica il modello**: `piano-esempio.json` (un piano inventato da usare come riferimento), questo file di istruzioni ed `enciclopedia.md` (i nomi degli alimenti che l'app conosce).
2. **Apri la tua AI** e allega: il PDF o le foto della tua dieta, `piano-esempio.json`, `ISTRUZIONI.md` ed `enciclopedia.md`. Poi incolla il testo della sezione [Testo per l'AI](#testo-per-lai).
3. **Salva la risposta** come file `.json` e caricala in Appanzay: *Account → Il mio piano → Carica piano*. L'app controlla il file e ti dice cosa correggere.

> Il file contiene informazioni sulla tua salute: tienilo per te e caricalo solo nel tuo account.

## Testo per l'AI

Copia e incolla questo testo:

```text
Ti allego la mia dieta e tre file di riferimento dell'app Appanzay:
piano-esempio.json (esempio del formato), ISTRUZIONI.md (regole del formato)
ed enciclopedia.md (nomi degli alimenti che l'app conosce).

Trasforma la mia dieta in un unico file JSON nel formato "appanzay-piano", versione 1,
seguendo ISTRUZIONI.md e la struttura di piano-esempio.json. Regole:
- Usa per gli alimenti i nomi esatti di enciclopedia.md (o un sinonimo elencato).
  Se un alimento non c'è, aggiungilo nell'elenco "alimenti" con "kcal_100g" e "categoria".
- Riporta solo quello che c'è nella mia dieta: non inventare grammature, stati o frequenze.
  Se un dato manca, omettilo e scrivilo nel campo "info.note".
- "stato" vale solo "previsto", "sconsigliato" o "vietato"; spiega il perché in "motivo".
- Il menù ha 7 giorni (da "lunedi" a "domenica") e per ogni giorno i pasti elencati in "pasti".
- Le equivalenze elencano, per ogni tipo di pasto, le alternative con le loro grammature.
- Rispondi solo con il JSON, senza testo prima o dopo.
```

## Il formato

Il file è un oggetto JSON con queste sezioni. Solo `formato`, `versione` e `pasti` sono obbligatorie: tutto il resto è facoltativo, ma più dati metti più funzioni dell'app si attivano.

| Sezione | A cosa serve nell'app |
|---|---|
| `info` | Nome del piano, autore, data e note: compaiono in Account e nella sezione Alimenti. |
| `obiettivi` | Calorie e acqua del giorno (anello delle calorie, bicchieri). |
| `pasti` | I pasti della giornata, nell'ordine. |
| `menu` | Il menù settimanale (sezioni Settimana, Oggi e Spesa). |
| `alimenti` | Stato di ogni alimento: previsto, sconsigliato, vietato (sezione Alimenti, avvisi nei pasti). |
| `equivalenze` | Le sostituzioni ammesse per ogni tipo di pasto (tasto **Alternativa**, cambio primo/secondo). |
| `frequenze` | Quante volte a settimana (controllo nella Settimana e scelta delle alternative). |
| `regole` | Pasto libero, diario dei sintomi, note generali. |

### Intestazione

```json
{
  "formato": "appanzay-piano",
  "versione": 1,
  "info": { "nome": "Dieta 1700 kcal", "autore": "Dott.ssa Rossi", "data": "2026-11-01", "note": "…" },
  "obiettivi": { "kcal": 1700, "acqua_litri": 2, "bicchiere_ml": 200 }
}
```

### `pasti`

Elenco dei pasti del giorno, nell'ordine in cui si mangiano. `tipo` vale `colazione`, `spuntino`, `pranzo` o `cena`; `id` è un nome breve senza spazi, usato nel menù.

```json
"pasti": [
  { "id": "colazione", "nome": "Colazione", "tipo": "colazione" },
  { "id": "spuntino_mattina", "nome": "Spuntino mattina", "tipo": "spuntino" },
  { "id": "pranzo", "nome": "Pranzo", "tipo": "pranzo" },
  { "id": "spuntino_pomeriggio", "nome": "Spuntino pomeriggio", "tipo": "spuntino" },
  { "id": "cena", "nome": "Cena", "tipo": "cena" }
]
```

### Un alimento in un pasto

```json
{ "alimento": "Pasta di grano", "grammi": 100 }
{ "alimento": "Uovo", "quantita": 2, "unita": "uovo", "grammi": 110 }
```

`grammi` è sempre obbligatorio (parte edibile). `quantita` e `unita` servono per mostrare "2 uova" invece dei grammi: `unita` va scritta al singolare, come in enciclopedia.

### `menu`

Un oggetto con i 7 giorni (`lunedi`, `martedi`, `mercoledi`, `giovedi`, `venerdi`, `sabato`, `domenica`, senza accenti). Ogni giorno ha una voce per ogni `id` di `pasti`. Un pasto è un elenco di alimenti oppure, per pranzo e cena, un oggetto con il formato:

```json
"lunedi": {
  "colazione": [ { "alimento": "Latte vaccino", "grammi": 200 }, { "alimento": "Fette biscottate", "grammi": 35 } ],
  "pranzo": { "formato": "primo", "alimenti": [ { "alimento": "Pasta di grano", "grammi": 100 }, { "alimento": "Ceci lessati", "grammi": 150 } ] },
  "cena": { "formato": "secondo", "alimenti": [ { "alimento": "Pesce magro", "grammi": 150 }, { "alimento": "Pane", "grammi": 80 } ] }
}
```

`formato` vale `primo` (piatto unico con pasta, riso o cereali) o `secondo` (proteina con contorno e pane o patate). Se manca, l'app lo deduce.

### `alimenti`

Lo stato di ogni alimento che il piano cita. Gli alimenti dell'enciclopedia non elencati qui risultano "non indicati dal piano".

```json
"alimenti": [
  { "nome": "Pesce magro", "stato": "previsto", "motivo": "Almeno 3 volte a settimana", "porzione": "150 g" },
  { "nome": "Salame", "stato": "sconsigliato", "motivo": "Insaccato: al massimo 1 volta a settimana" },
  { "nome": "Superalcolici", "stato": "vietato", "motivo": "Esclusi dal piano" },
  { "nome": "Tisana zenzero e limone", "stato": "previsto", "kcal_100g": 2, "categoria": "Bevande",
    "unita": [ { "nome": "tazza", "plurale": "tazze", "grammi": 200 } ] }
]
```

| Campo | Obbligatorio | Note |
|---|---|---|
| `nome` | sì | Nome dell'enciclopedia, oppure un alimento nuovo. |
| `stato` | no | `previsto`, `sconsigliato` o `vietato`. Senza stato l'alimento resta "non indicato" ma mostra la nota. |
| `motivo` | no | Il perché, in breve. |
| `nota` | no | Dettagli o avvertenze. |
| `porzione` | no | Testo libero, es. "150 g a pranzo". |
| `kcal_100g` | solo per alimenti nuovi | Calorie per 100 g. |
| `categoria` | no | Una di: Latticini, Cereali, Carne e uova, Pesce, Verdure, Legumi, Frutta, Condimenti, Bevande, Dolci e altro, Piatti pronti. |
| `unita` | no | Porzioni a pezzi per gli alimenti nuovi. |

### `equivalenze`

Per ogni tipo di pasto (`colazione`, `spuntino`, `pranzo`, `cena`) l'elenco dei **componenti** del pasto. Ogni componente ha un `ruolo` e le `opzioni` intercambiabili; ogni opzione è un elenco di alimenti (di solito uno, a volte più di uno, es. uovo + parmigiano).

```json
"equivalenze": {
  "pranzo": [
    { "ruolo": "amido", "opzioni": [ [ { "alimento": "Pasta di grano", "grammi": 100 } ], [ { "alimento": "Riso", "grammi": 100 } ] ] },
    { "ruolo": "proteina", "opzioni": [ [ { "alimento": "Ceci lessati", "grammi": 150 } ], [ { "alimento": "Pollo", "grammi": 100 } ] ] },
    { "ruolo": "verdura", "opzioni": [ [ { "alimento": "Zucchine", "grammi": 200 } ] ] },
    { "ruolo": "condimento", "opzioni": [ [ { "alimento": "Olio extravergine d'oliva", "grammi": 15 } ] ] },
    { "ruolo": "frutta", "opzioni": [ [ { "alimento": "Mela", "grammi": 150 } ] ] }
  ]
}
```

Ruoli: `amido`, `proteina`, `verdura`, `frutta`, `condimento`, `latte`, `cereale`, `spuntino`. L'Alternativa combina un'opzione per ogni componente, sceglie verdura e frutta senza ripetere quelle del giorno e usa sempre il primo condimento.

### `frequenze`

```json
"frequenze": [
  { "nome": "Pesce", "alimenti": ["Pesce magro", "Salmone"], "volte": 3, "regola": "almeno" },
  { "nome": "Carne rossa", "alimenti": ["Manzo magro"], "volte": 1, "regola": "massimo" },
  { "nome": "Formaggi", "alimenti": ["Mozzarella"], "volte": 2, "regola": "esatto", "grammi_minimi": 40 }
]
```

`regola` vale `almeno`, `massimo` o `esatto`. Si conta un pasto per voce; con `grammi_minimi` le quantità più piccole (es. 10 g di parmigiano) non contano.

### `regole`

```json
"regole": {
  "pasto_libero": "1 volta a settimana, al posto di una cena.",
  "diario_sintomi": false,
  "note": ["Almeno 2 L di acqua al giorno."]
}
```

`diario_sintomi: true` mostra nella vista Oggi la scheda per segnare i sintomi (0-3).

## Errori comuni

- **Nomi che l'app non riconosce**: usa i nomi di `enciclopedia.md`, oppure aggiungi l'alimento in `alimenti` con `kcal_100g`.
- **Giorni con l'accento** (`lunedì`): scrivili senza (`lunedi`).
- **Grammi come testo** (`"100 g"`): scrivi solo il numero (`100`).
- **Testo prima o dopo il JSON**: il file deve iniziare con `{` e finire con `}`.
