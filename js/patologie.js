/* Appanzay — liste comuni per condizione (patologie, intolleranze, allergie, condizioni particolari).
   Dati generici, uguali per tutti: nessun dato personale. Le condizioni scelte da ogni utente stanno nel suo account.
   L'amministratore può modificarle dall'app: le modifiche (Firestore catalogo/condizioni) sostituiscono i blocchi qui sotto.

   Formato, un blocco per condizione:
     @id|gruppo|nome|nota
     vietato|motivo|Alimento;Alimento;...
     sconsigliato|motivo|Alimento;...
   - id: lettere minuscole, numeri e _ (non cambia mai).
   - gruppo: Intolleranze e allergie, Apparato digerente, Rene, Metabolismo e cuore, Condizioni particolari.
   - alimenti: nomi (o sinonimi) del catalogo, separati da ;. Fonti e motivazioni: documento "Alimenti da limitare per patologia". */
window.APZ_CONDIZIONI_RAW = `
@celiachia|Intolleranze e allergie|Celiachia o allergia al grano|Vale anche per l'allergene «cereali con glutine». L'avena va bene solo se certificata senza glutine.
vietato|Contiene glutine|Pane;Pane integrale;Pane in cassetta;Pane di semola;Pane a lievitazione naturale;Pane arabo;Piadina;Focaccia;Pasta di grano;Pasta integrale;Pasta all'uovo;Pasta fresca ripiena;Noodles di grano;Cous cous;Bulgur;Farro;Orzo;Segale;Seitan;Semolino;Farina di grano;Pangrattato;Fette biscottate;Fette biscottate integrali;Grissini;Crackers;Taralli;Friselle
vietato|Fatto con farina di frumento o orzo|Biscotti secchi;Biscotti frollini;Biscotti al cioccolato;Cornetto;Brioche col tuppo;Dolci e merendine;Pandoro;Panettone;Colomba;Torta;Crostata;Muffin;Wafer;Pancake;Crêpes;Babà;Chiacchiere;Cannolo siciliano;Cassata siciliana;Birra;Birra analcolica;Orzo solubile
vietato|Contiene pasta di grano, pane, pizza o impanatura|Pizza margherita o alle verdure;Pizza diavola;Pizza capricciosa;Pizza quattro formaggi;Calzone;Lasagne;Arancino;Cotoletta impanata;Bastoncini di pesce;Nuggets di pollo;Panino con prosciutto;Toast prosciutto e formaggio;Tramezzino;Hamburger nel panino;Hot dog;Kebab;Scacciata catanese;Sfincione;Cipollina catanese;Ramen;Burrito;Cous cous di pesce;Pasta al pomodoro;Pasta al tonno;Pasta al ragù;Pasta alla carbonara;Cacio e pepe;Pasta all'amatriciana;Pasta alla norma;Pasta con le sarde;Pasta e fagioli;Pasta e ceci;Pasta e lenticchie;Pasta al pesto;Pasta ai frutti di mare;Gnocchi al pomodoro;Gnocchi di patate
sconsigliato|Può contenere glutine o malto d'orzo: solo con la dicitura «senza glutine»|Fiocchi d'avena;Muesli;Corn flakes;Barrette ai cereali;Salsa di soia;Dado da brodo;Wurstel;Tortilla;Polpette;Polpette al sugo;Crocchette di patate
@lattosio|Intolleranze e allergie|Intolleranza al lattosio|I formaggi stagionati (Parmigiano, Grana, Emmenthal, Gorgonzola, Pecorino) sono naturalmente privi di lattosio.
sconsigliato|Ricco di lattosio|Latte vaccino;Latte di capra;Latte condensato;Panna;Gelato;Ricotta;Stracchino;Crescenza;Robiola;Formaggio spalmabile;Mascarpone;Fiocchi di latte;Mozzarella;Mozzarella di bufala;Burrata;Primo sale;Sottilette;Yogurt intero;Cappuccino;Cioccolata calda;Besciamella;Panna cotta;Budino;Tiramisù;Cheesecake
@favismo|Intolleranze e allergie|Favismo (carenza di G6PD)|Molti farmaci vanno evitati: segui l'elenco del medico.
vietato|Può scatenare una crisi emolitica|Fave
sconsigliato|Alcune fonti indicano prudenza|Piselli;Taccole
@nichel|Intolleranze e allergie|Allergia sistemica al nichel|Di solito è una dieta di prova di alcune settimane decisa dall'allergologo.
sconsigliato|Ricco di nichel|Cacao / cioccolato;Crema spalmabile al cacao;Biscotti al cioccolato;Cioccolata calda;Soia;Tofu;Tempeh;Lenticchie;Lenticchie lessate;Fagioli;Fagioli lessati;Ceci;Ceci lessati;Piselli;Noci;Nocciole;Mandorle;Anacardi;Arachidi;Pomodori;Sugo di pomodoro;Spinaci;Asparagi;Cavolfiore;Funghi;Cipolla;Pane integrale;Pasta integrale;Fiocchi d'avena;Grano saraceno;Tonno in salamoia;Tonno sott'olio;Aringa;Ostriche;Gamberi;Liquirizia
@all_latte|Intolleranze e allergie|Allergia al latte|Diversa dall'intolleranza al lattosio: sono vietati anche i formaggi stagionati e i prodotti senza lattosio.
vietato|Contiene proteine del latte|Latte vaccino;Latte di capra;Latte senza lattosio;Latte condensato;Yogurt intero;Yogurt greco;Yogurt senza lattosio;Kefir;Skyr;Panna;Burro;Gelato;Parmigiano / grana;Pecorino;Fontina;Emmenthal;Groviera;Asiago;Provolone;Caciotta;Caciocavallo;Provola;Scamorza;Mozzarella;Mozzarella di bufala;Burrata;Ricotta;Ricotta salata;Primo sale;Stracchino;Crescenza;Robiola;Feta;Formaggio spalmabile;Mascarpone;Fiocchi di latte;Gorgonzola;Taleggio;Brie;Cheddar;Sottilette;Besciamella;Panna cotta;Budino;Cappuccino;Cioccolata calda;Cheesecake;Tiramisù;Pesto;Insalata caprese;Cacio e pepe;Pizza margherita o alle verdure;Pizza quattro formaggi
sconsigliato|Spesso contiene latte|Proteine in polvere;Cioccolato bianco;Biscotti frollini;Lasagne;Parmigiana di melanzane
@all_uova|Intolleranze e allergie|Allergia alle uova|
vietato|Contiene uova|Uovo;Albume;Pasta all'uovo;Pasta fresca ripiena;Maionese e salse grasse;Frittata di verdure;Pasta alla carbonara;Crêpes;Pancake;Tiramisù;Pandoro;Panettone;Colomba
sconsigliato|Di solito contiene uova|Torta;Crostata;Muffin;Biscotti frollini;Babà;Chiacchiere;Cotoletta impanata;Polpette;Polpette al sugo;Lasagne
@all_pesce|Intolleranze e allergie|Allergia al pesce|
vietato|Contiene pesce|Pesce magro;Pesce bianco di mare;Tonno in salamoia;Tonno sott'olio;Tonno fresco;Salmone;Salmone affumicato;Pesce spada;Sgombro;Alici / acciughe;Sardine;Aringa;Baccalà;Trota;Ricciola;Surimi;Bastoncini di pesce;Sushi;Sashimi;Poke;Pasta con le sarde;Pasta al tonno;Pesce al cartoccio;Cous cous di pesce
@all_crostacei|Intolleranze e allergie|Allergia ai crostacei|
vietato|Contiene crostacei|Gamberi;Scampi;Surimi;Pasta ai frutti di mare;Paella
@all_molluschi|Intolleranze e allergie|Allergia ai molluschi|
vietato|Contiene molluschi|Calamari;Polpo;Cozze e vongole;Ostriche;Pasta ai frutti di mare;Paella
@all_arachidi|Intolleranze e allergie|Allergia alle arachidi|
vietato|Contiene arachidi|Arachidi;Burro di arachidi
@all_guscio|Intolleranze e allergie|Allergia alla frutta a guscio|
vietato|Contiene frutta a guscio|Noci;Nocciole;Mandorle;Pistacchi;Anacardi;Noci pecan;Noci di macadamia;Noci del Brasile;Bevanda di mandorla;Pesto di pistacchio;Pesto alla trapanese;Paste di mandorla;Torrone;Crema spalmabile al cacao
@all_soia|Intolleranze e allergie|Allergia alla soia|
vietato|Contiene soia|Soia;Tofu;Tempeh;Edamame;Bevanda di soia;Yogurt di soia;Salsa di soia
@all_sedano|Intolleranze e allergie|Allergia al sedano|
vietato|Contiene sedano|Sedano;Dado da brodo;Brodo vegetale fatto in casa;Ragù di carne;Minestrone
@all_senape|Intolleranze e allergie|Allergia alla senape|
vietato|Contiene senape|Senape
@all_sesamo|Intolleranze e allergie|Allergia al sesamo|
vietato|Contiene sesamo|Semi di sesamo;Hummus
@all_solfiti|Intolleranze e allergie|Sensibilità ai solfiti|
vietato|Contiene solfiti|Vino;Prosecco;Spritz;Uvetta;Albicocche secche;Frutta essiccata
@all_lupini|Intolleranze e allergie|Allergia ai lupini|
vietato|Contiene lupini|Lupini
@colon|Apparato digerente|Colon irritabile (low FODMAP)|Eliminazione per 4-6 settimane, poi reintroduzione graduale per trovare la tua soglia.
sconsigliato|Ricco di fruttani|Aglio;Cipolla;Porri / scalogno;Carciofi;Topinambur;Asparagi;Cavolini di Bruxelles;Cipollina catanese;Pane;Pasta di grano;Pane in cassetta;Piadina;Pizza margherita o alle verdure;Cous cous;Segale;Orzo;Crackers;Grissini;Fette biscottate
sconsigliato|Ricco di galatto-oligosaccaridi|Fagioli;Fagioli lessati;Ceci;Ceci lessati;Lenticchie;Lenticchie lessate;Soia;Piselli;Fave;Hummus;Falafel;Pasta di legumi;Anacardi;Pistacchi
sconsigliato|Fruttosio in eccesso|Mela;Pere;Pera nashi;Mango;Cocomero / anguria;Fichi;Fichi secchi;Datteri;Miele;Sciroppo d'agave;Succhi di frutta;Frutta essiccata;Frutta sciroppata
sconsigliato|Ricco di polioli|Albicocche;Pesche;Prugne fresche / susine;Prugne secche;Ciliegie;More;Cavolfiore;Funghi;Dolcificanti polioli
sconsigliato|Ricco di lattosio|Latte vaccino;Latte di capra;Gelato;Ricotta;Formaggio spalmabile;Mascarpone;Yogurt intero
@reflusso|Apparato digerente|Reflusso gastroesofageo e gastrite|I trigger cambiano da persona a persona: tieni quelli che ti danno fastidio.
sconsigliato|Rilassa lo sfintere esofageo|Cacao / cioccolato;Crema spalmabile al cacao;Cioccolata calda;Menta;Vino;Birra;Prosecco;Spritz;Superalcolici;Sherry / porto
sconsigliato|Aumenta l'acidità|Caffè;Cappuccino;Tè;Tè freddo;Energy drink;Bibite gassate / cola;Acqua tonica
sconsigliato|Acido|Pomodori;Sugo di pomodoro;Pomodori secchi;Ketchup;Arance;Pompelmo;Spremuta d'arancia;Limone;Lime
sconsigliato|Piccante|Peperoncino;Pepe;Paprika;Curry;Salsa barbecue
sconsigliato|Grasso o fritto|Patatine fritte;Patatine in busta;Crocchette di patate;Maionese e salse grasse;Salsiccia;Pancetta / lardo;Guanciale;Panna;Burro;Cotoletta impanata;Nuggets di pollo
@steatosi|Apparato digerente|Fegato grasso (steatosi)|
vietato|L'alcol peggiora il fegato grasso|Vino;Birra;Prosecco;Spritz;Superalcolici;Sherry / porto
sconsigliato|Zuccheri e fruttosio aggiunti|Bibite gassate / cola;Energy drink;Succhi di frutta;Tè freddo;Zucchero;Zucchero di canna;Sciroppo d'agave;Sciroppo d'acero;Melassa;Dolci e merendine;Caramelle
sconsigliato|Grasso o fritto|Patatine fritte;Patatine in busta
@ossalato|Rene|Calcoli di ossalato di calcio|Il calcio non va ridotto: latte, yogurt e formaggi proteggono. Bevi molto.
vietato|Una porzione supera da sola il limite giornaliero di ossalato|Spinaci;Biete;Erbette;Rabarbaro;Acetosella
sconsigliato|Ricco di ossalato|Barbabietola;Cacao / cioccolato;Crema spalmabile al cacao;Cioccolata calda;Mandorle;Anacardi;Arachidi;Burro di arachidi;Nocciole;Semi di sesamo;Tè;Tè matcha;Patata dolce
sconsigliato|Ricco di sodio|Sale;Dado da brodo;Salsa di soia;Salame;Prosciutto crudo;Speck;Wurstel;Olive;Patatine in busta
@gotta|Rene|Gotta e acido urico alto|Vale anche per i calcoli di acido urico.
vietato|Purine molto alte o alcol che alza l'acido urico|Fegato e interiora;Animelle;Birra;Birra analcolica
sconsigliato|Ricco di purine|Alici / acciughe;Sardine;Aringa;Sgombro;Cozze e vongole;Ostriche;Gamberi;Scampi;Pasta con le sarde;Brodo di pollo;Dado da brodo;Cinghiale;Carni gelatinose / gelatina
sconsigliato|Alcol e fruttosio alzano l'acido urico|Superalcolici;Vino;Prosecco;Spritz;Bibite gassate / cola;Succhi di frutta;Tè freddo;Energy drink;Sciroppo d'agave
@diabete|Metabolismo e cuore|Diabete di tipo 2 e prediabete|Niente è vietato: in caso di ipoglicemia zucchero o una bibita zuccherata servono a correggerla.
sconsigliato|Zuccheri semplici|Bibite gassate / cola;Succhi di frutta;Tè freddo;Energy drink;Bevande isotoniche;Zucchero;Zucchero di canna;Miele;Marmellata;Sciroppo d'acero;Sciroppo d'agave;Melassa;Caramelle;Dolci e merendine;Cornetto;Brioche col tuppo;Granita;Sorbetto;Frutta sciroppata;Crema spalmabile al cacao;Corn flakes;Riso soffiato
@colesterolo|Metabolismo e cuore|Colesterolo e trigliceridi alti|
sconsigliato|Ricco di grassi saturi|Burro;Panna;Pancetta / lardo;Guanciale;Salame;Salsiccia;Wurstel;Mortadella;Coppa;Speck;Fegato e interiora;Mascarpone;Gorgonzola;Brie;Taleggio;Formaggio spalmabile;Latte condensato;Cocco;Margarina;Dolci e merendine;Cornetto;Crema spalmabile al cacao;Patatine fritte;Patatine in busta;Biscotti frollini
sconsigliato|Alcol e zuccheri alzano i trigliceridi|Vino;Birra;Superalcolici;Spritz;Bibite gassate / cola;Succhi di frutta;Zucchero
@pressione|Metabolismo e cuore|Pressione alta|Obiettivo: meno di 5 g di sale al giorno.
sconsigliato|Ricco di sodio|Sale;Dado da brodo;Salsa di soia;Ketchup;Senape;Salsa barbecue;Olive;Capperi;Alici / acciughe;Baccalà;Salmone affumicato;Prosciutto crudo;Salame;Speck;Coppa;Bresaola;Mortadella;Wurstel;Parmigiano / grana;Pecorino;Ricotta salata;Patatine in busta;Pomodori secchi
sconsigliato|La liquirizia alza la pressione|Liquirizia
@gravidanza|Condizioni particolari|Gravidanza|Se hai già avuto la toxoplasmosi, i salumi crudi si possono togliere con i divieti manuali.
vietato|Nessuna dose di alcol è sicura|Vino;Birra;Prosecco;Spritz;Superalcolici;Sherry / porto
vietato|Pesce crudo o affumicato: Listeria e parassiti|Sushi;Sashimi;Poke;Ostriche;Salmone affumicato
vietato|Salume crudo: rischio toxoplasmosi|Prosciutto crudo;Salame;Speck;Coppa;Bresaola
vietato|Contiene uova crude|Tiramisù
sconsigliato|Formaggio molle: solo se pastorizzato|Brie;Gorgonzola;Taleggio
sconsigliato|Mercurio: porzioni rare|Pesce spada;Tonno fresco
sconsigliato|Caffeina da limitare|Caffè;Energy drink;Tè matcha
@warfarin|Condizioni particolari|Terapia con warfarin|Le verdure a foglia verde non vanno tolte: mangiale in quantità costanti, senza cambiamenti improvvisi.
sconsigliato|Può interferire con la terapia|Pompelmo;Melagrana;Tè matcha;Vino;Birra;Superalcolici
`;
