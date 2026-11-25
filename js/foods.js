/* Enciclopedia degli alimenti di Appanzay: dati neutri, uguali per tutti.
 *
 * Una riga per alimento:
 *   nome|categoria|kcal per 100 g|unità|sinonimi|nota
 *
 * kcal:     valori medi indicativi per 100 g di parte edibile, arrotondati. Sono stime da verificare.
 * unità:    "singolare/plurale:grammi" separate da ";" (es. "kiwi/kiwi:85;fetta/fette:30").
 *           Servono per inserire "2 kiwi" senza conoscere i grammi.
 * sinonimi: separati da virgola, per la ricerca.
 * nota:     solo informazioni oggettive (es. "Peso secco."), mai indicazioni di dieta.
 *
 * Previsto / sconsigliato / vietato NON stanno qui: li decide il piano di ogni utente
 * (vedi la cartella modello/ e il campo "alimenti" del piano).
 */
window.APZ_FOODS_RAW = `
Latte senza lattosio|Latticini|46|tazza/tazze:200;bicchiere/bicchieri:200|latte delattosato,latte zymil,latte alta digeribilita|
Yogurt senza lattosio|Latticini|63|vasetto/vasetti:125|yogurt delattosato|
Parmigiano / grana|Latticini|392|cucchiaio grattugiato/cucchiai grattugiati:10;cucchiaino grattugiato/cucchiaini grattugiati:5;scaglia/scaglie:10|parmigiano reggiano,grana padano,formaggio grattugiato|
Fontina|Latticini|343|fetta/fette:30||
Emmenthal|Latticini|380|fetta/fette:25|emmental|
Yogurt greco|Latticini|97|vasetto/vasetti:150||
Mozzarella|Latticini|253|mozzarella/mozzarelle:125;bocconcino/bocconcini:25|fiordilatte,fior di latte|
Ricotta|Latticini|146|cucchiaio/cucchiai:30||
Stracchino|Latticini|300|confezione/confezioni:100||
Scamorza|Latticini|334|fetta/fette:30||
Crescenza|Latticini|281|confezione/confezioni:100||
Robiola|Latticini|300|confezione/confezioni:100||
Feta|Latticini|250|fetta/fette:30||
Burrata|Latticini|300|burrata/burrate:125||
Formaggio spalmabile|Latticini|250|cucchiaio/cucchiai:20|philadelphia|
Mascarpone|Latticini|453|cucchiaio/cucchiai:15||
Latte vaccino|Latticini|64|tazza/tazze:200|latte intero,latte parzialmente scremato,latte scremato|
Gelato|Latticini|218|coppetta/coppette:100;cono/coni:80||
Panna|Latticini|337|cucchiaio/cucchiai:15||
Pecorino|Latticini|387|cucchiaio grattugiato/cucchiai grattugiati:10;fetta/fette:30||
Provolone|Latticini|374|fetta/fette:30||
Caciotta|Latticini|364|fetta/fette:30||
Provola|Latticini|345|fetta/fette:30||
Asiago|Latticini|356|fetta/fette:30||
Gorgonzola|Latticini|324|porzione/porzioni:50||
Bevanda di soia|Latticini|33|tazza/tazze:200|latte di soia|
Bevanda di riso|Latticini|47|tazza/tazze:200|latte di riso|
Bevanda di mandorla|Latticini|24|tazza/tazze:200|latte di mandorla|
Riso|Cereali|360|porzione/porzioni:80|riso bianco,risotto,basmati,carnaroli,arborio,riso parboiled,riso thai,riso jasmine|
Pasta senza glutine|Cereali|355|porzione/porzioni:80|pasta gluten free|
Pasta di mais|Cereali|355|porzione/porzioni:80||
Pane senza glutine|Cereali|260|fetta/fette:30;panino/panini:60||
Pane|Cereali|275|fetta/fette:30;panino/panini:60|pane bianco,rosetta,pagnotta,baguette,ciabatta,michetta,pane casereccio,filone|
Pasta di grano|Cereali|353|porzione/porzioni:80|pasta,spaghetti,penne,maccheroni,fusilli,rigatoni,linguine,bucatini,farfalle,orecchiette,mezze maniche,paccheri,ditalini,anelletti,busiate|
Cous cous|Cereali|360|porzione/porzioni:80|couscous|
Fette biscottate|Cereali|390|fetta/fette:7||1 fetta = 7 g.
Grissini|Cereali|410|grissino/grissini:5||1 grissino medio = 5 g.
Crackers|Cereali|430|cracker/cracker:5;pacchetto/pacchetti:25|cracker|1 cracker = 5 g.
Gallette di riso|Cereali|380|galletta/gallette:8||
Patate|Cereali|77|patata media/patate medie:150|patata,pure|
Pizza margherita o alle verdure|Cereali|250|pizza/pizze:330;trancio/tranci:150|pizza|
Orzo|Cereali|319|porzione/porzioni:80||
Segale|Cereali|335|fetta/fette:30|pane di segale|
Pasta integrale|Cereali|337|porzione/porzioni:80||
Pane integrale|Cereali|243|fetta/fette:30||
Riso integrale|Cereali|337|porzione/porzioni:80||
Pane in cassetta|Cereali|280|fetta/fette:25|pancarre|
Piadina|Cereali|300|piadina/piadine:100||
Farro|Cereali|335|porzione/porzioni:80||
Quinoa|Cereali|368|porzione/porzioni:80||
Fiocchi d'avena|Cereali|389|porzione/porzioni:40|avena|
Polenta (farina di mais)|Cereali|362|porzione/porzioni:80|farina di mais|Peso a crudo.
Gnocchi di patate|Cereali|150|porzione/porzioni:200|gnocchi|
Biscotti secchi|Cereali|416|biscotto/biscotti:8|biscotti|
Taralli|Cereali|450|tarallo/taralli:8||
Corn flakes|Cereali|380|tazza/tazze:30|cornflakes,cereali da colazione|
Pollo|Carne e uova|100|fettina/fettine:100|petto di pollo|
Tacchino|Carne e uova|107|fettina/fettine:100|petto di tacchino|
Vitello|Carne e uova|92|fettina/fettine:100||
Manzo magro|Carne e uova|130|fettina/fettine:100|manzo,bistecca,carne rossa|
Coniglio|Carne e uova|118|porzione/porzioni:100||
Uovo|Carne e uova|128|uovo/uova:55|uova,frittata|1 uovo medio ≈ 55 g di parte edibile.
Fesa di tacchino|Carne e uova|105|fetta/fette:15||
Prosciutto cotto|Carne e uova|215|fetta/fette:20||
Prosciutto crudo|Carne e uova|224|fetta/fette:15||
Bresaola|Carne e uova|151|fetta/fette:10||
Hamburger di manzo|Carne e uova|200|hamburger/hamburger:100||
Cavallo|Carne e uova|105|fettina/fettine:100|carne di cavallo|
Carne di maiale|Carne e uova|160|fettina/fettine:100|maiale,lonza,braciola|
Salsiccia|Carne e uova|300|salsiccia/salsicce:100||
Wurstel|Carne e uova|270|wurstel/wurstel:50||
Mortadella|Carne e uova|317|fetta/fette:15||
Salame|Carne e uova|400|fetta/fette:8||
Speck|Carne e uova|300|fetta/fette:15||
Fegato e interiora|Carne e uova|140|porzione/porzioni:100|fegato,trippa|
Pancetta / lardo|Carne e uova|660|fetta/fette:10|pancetta,lardo,strutto|
Agnello|Carne e uova|160|porzione/porzioni:100||
Animelle|Carne e uova|120|porzione/porzioni:100||
Carni gelatinose / gelatina|Carne e uova|90|porzione/porzioni:100||
Pesce magro|Pesce|80|filetto/filetti:120|merluzzo,nasello,orata,spigola,branzino,sogliola,platessa|
Tonno in salamoia|Pesce|103|scatoletta sgocciolata/scatolette sgocciolate:56|tonno al naturale|Peso sgocciolato.
Salmone|Pesce|185|filetto/filetti:150||
Pesce spada|Pesce|109|fetta/fette:150||
Tonno fresco|Pesce|159|fetta/fette:150||
Tonno sott'olio|Pesce|192|scatoletta sgocciolata/scatolette sgocciolate:56||Peso sgocciolato.
Sgombro|Pesce|170|filetto/filetti:120||
Alici / acciughe|Pesce|96|porzione/porzioni:150|alici,acciughe|Fresche; quelle sotto sale sono molto salate.
Sardine|Pesce|129|porzione/porzioni:150|sarde|
Gamberi|Pesce|71|gambero/gamberi:15|gamberetti|
Calamari|Pesce|68|porzione/porzioni:150|totani,seppie|
Polpo|Pesce|57|porzione/porzioni:150|polipo|
Cozze e vongole|Pesce|80|porzione/porzioni:100|cozze,vongole|Peso sgusciato.
Baccalà|Pesce|95|porzione/porzioni:150|stoccafisso|Peso dopo l'ammollo.
Bastoncini di pesce|Pesce|190|bastoncino/bastoncini:25||
Lattuga / insalata|Verdure|15|ciotola/ciotole:80|lattuga,insalata,insalata mista,iceberg,lattughino|
Pomodori|Verdure|18|pomodoro medio/pomodori medi:120;pomodorino/pomodorini:15|pomodoro,pomodorini,ciliegini|
Zucchine|Verdure|17|zucchina/zucchine:200|zucchina|
Carote|Verdure|35|carota/carote:80|carota|
Cetrioli|Verdure|14|cetriolo/cetrioli:200|cetriolo|
Melanzane|Verdure|18|melanzana/melanzane:300|melanzana|
Mais|Verdure|86|cucchiaio/cucchiai:15;scatoletta sgocciolata/scatolette sgocciolate:140|granturco|
Germogli di soia|Verdure|30|porzione/porzioni:50||
Peperoni|Verdure|26|peperone/peperoni:200|peperone|
Rucola|Verdure|28|manciata/manciate:20||
Zucca|Verdure|18|porzione/porzioni:200||
Valeriana|Verdure|20|manciata/manciate:30|songino|
Asparagi|Verdure|20|asparago/asparagi:15|asparago|
Carciofi|Verdure|22|carciofo/carciofi:50|carciofo|
Cavolfiore|Verdure|25|porzione/porzioni:200||
Biete|Verdure|19|porzione/porzioni:200|bietola,bietole,coste|
Erbette|Verdure|19|porzione/porzioni:200||
Indivia|Verdure|16|ciotola/ciotole:80|scarola|
Crescione|Verdure|20|manciata/manciate:20||
Finocchi|Verdure|31|finocchio/finocchi:250|finocchio|
Radicchio|Verdure|23|cespo/cespi:100||
Funghi|Verdure|22|porzione/porzioni:150|champignon,porcini|
Cipolla|Verdure|28|cipolla/cipolle:100|cipolle|
Porri / scalogno|Verdure|30|porro/porri:100|porro,scalogno|
Barbabietola|Verdure|43|barbabietola/barbabietole:100|rapa rossa|
Sedano|Verdure|20|costa/coste:40||
Spinaci|Verdure|23|porzione/porzioni:200|spinacio|
Fagiolini|Verdure|31|porzione/porzioni:150||
Broccoli|Verdure|27|porzione/porzioni:200|broccolo,cime di rapa|
Cavolo / verza|Verdure|25|porzione/porzioni:200|cavolo,verza,cavolo nero,cavolo cappuccio|
Cavolini di Bruxelles|Verdure|43|porzione/porzioni:150||
Rape|Verdure|18|porzione/porzioni:150|rapa|
Cicoria|Verdure|17|porzione/porzioni:200||
Rabarbaro|Verdure|21|porzione/porzioni:100||
Acetosella|Verdure|22|porzione/porzioni:50||
Ceci|Legumi|334|porzione secca/porzioni secche:50|cece|Peso secco.
Hummus|Legumi|177|cucchiaio/cucchiai:30||
Soia|Legumi|398|porzione secca/porzioni secche:50||Peso secco.
Tofu|Legumi|76|porzione/porzioni:100||
Piselli|Legumi|81|porzione/porzioni:150|pisello|
Fagioli|Legumi|300|porzione secca/porzioni secche:50|fagiolo,borlotti,cannellini|Peso secco.
Lenticchie|Legumi|325|porzione secca/porzioni secche:50|lenticchia|Peso secco.
Fave|Legumi|340|porzione secca/porzioni secche:50|fava|Peso secco.
Arachidi|Legumi|598|manciata/manciate:30|noccioline|
Mandarini|Frutta|50|mandarino/mandarini:60|mandarino|
Kiwi|Frutta|44|kiwi/kiwi:85||
Melone giallo|Frutta|33|fetta/fette:200|melone|
Nespole|Frutta|28|nespola/nespole:40|nespola|
Pompelmo|Frutta|26|pompelmo/pompelmi:250||Può interagire con alcuni farmaci: chiedi al medico se ne prendi.
Frutto della passione|Frutta|97|frutto/frutti:20|maracuja|
Mirtilli|Frutta|57|cestino/cestini:125|mirtillo|
Lamponi|Frutta|52|cestino/cestini:125|lampone|
Clementine|Frutta|47|clementina/clementine:60|clementina|
Melagrana|Frutta|63|melagrana/melagrane:150|melograno|
Castagne|Frutta|165|castagna/castagne:10|caldarroste|Fresche.
Mela|Frutta|45|mela media/mele medie:180|mele|
Pere|Frutta|36|pera/pere:180|pera|
Pesche|Frutta|31|pesca/pesche:150|pesca,pesca noce|
Ciliegie|Frutta|39|ciliegia/ciliegie:6|ciliegia|
Cachi|Frutta|65|caco/cachi:180|kaki,caco|
Prugne fresche / susine|Frutta|42|prugna/prugne:40|prugna,susina,susine|
Mango|Frutta|60|mango/manghi:300||
Avocado|Frutta|160|avocado/avocado:150||
Cocco|Frutta|354|pezzo/pezzi:30||
Frutta sciroppata|Frutta|70|porzione/porzioni:150|frutta in scatola|
Frutta essiccata|Frutta|280|manciata/manciate:30|frutta disidratata|
Datteri|Frutta|280|dattero/datteri:8|dattero|
Noci|Frutta|654|noce/noci:5;manciata/manciate:30|noce|
Nocciole|Frutta|655|manciata/manciate:30|nocciola|
Pistacchi|Frutta|562|manciata/manciate:30|pistacchio|
Arance|Frutta|47|arancia/arance:200|arancia,arancio|
Banane|Frutta|89|banana/banane:120|banana|
Fragole|Frutta|32|fragola/fragole:12|fragola|
Uva|Frutta|69|grappolo/grappoli:150|acini|
Uvetta|Frutta|283|cucchiaio/cucchiai:10|uva passa,uva sultanina|
Albicocche|Frutta|48|albicocca/albicocche:40|albicocca|
Ananas|Frutta|50|fetta/fette:100||
More|Frutta|43|cestino/cestini:125|mora|
Fichi|Frutta|74|fico/fichi:50|fico,fichi d'india|
Cocomero / anguria|Frutta|30|fetta/fette:300|cocomero,anguria|
Prugne secche|Frutta|240|prugna/prugne:8||
Ribes|Frutta|56|cestino/cestini:125||
Mandorle|Frutta|603|mandorla/mandorle:1.2;manciata/manciate:30|mandorla,pasta di mandorle|
Olio extravergine d'oliva|Condimenti|899|cucchiaio/cucchiai:10;cucchiaino/cucchiaini:5|olio,olio evo,olio d'oliva|1 cucchiaino = 5 g, 1 cucchiaio = 10 g.
Sugo di pomodoro|Condimenti|40|cucchiaio/cucchiai:20|salsa di pomodoro,passata|
Erba cipollina|Condimenti|30|cucchiaino/cucchiaini:2||
Basilico|Condimenti|40|foglia/foglie:1||
Origano|Condimenti|265|pizzico/pizzichi:1||
Limone|Condimenti|29|cucchiaio di succo/cucchiai di succo:10|succo di limone|
Rosmarino / salvia / timo|Condimenti|100|pizzico/pizzichi:1|rosmarino,salvia,timo,erbe aromatiche|
Aceto|Condimenti|10|cucchiaio/cucchiai:10|aceto di vino,aceto balsamico|
Olio di semi|Condimenti|899|cucchiaio/cucchiai:10|olio di girasole,olio di arachidi|
Sale|Condimenti|0|cucchiaino/cucchiaini:5;pizzico/pizzichi:1||
Aglio|Condimenti|41|spicchio/spicchi:4||
Pesto|Condimenti|450|cucchiaio/cucchiai:15|pesto alla genovese|
Besciamella|Condimenti|120|cucchiaio/cucchiai:20||
Maionese e salse grasse|Condimenti|680|cucchiaio/cucchiai:15|maionese,salsa rosa,tonnata|
Ketchup|Condimenti|100|cucchiaio/cucchiai:15||
Burro|Condimenti|758|noce/noci:10||
Salsa di soia|Condimenti|53|cucchiaio/cucchiai:15||
Prezzemolo|Condimenti|30|cucchiaino/cucchiaini:2||
Pepe|Condimenti|255|pizzico/pizzichi:1|pepe nero|
Olive|Condimenti|145|oliva/olive:4|oliva|
Dado da brodo|Condimenti|250|dado/dadi:10|dado,brodo granulare|
Acqua oligominerale|Bevande|0|bicchiere/bicchieri:200;bottiglia/bottiglie:500|acqua,acqua naturale|
Acqua frizzante|Bevande|0|bicchiere/bicchieri:200|acqua gassata|
Tisane|Bevande|1|tazza/tazze:200|camomilla,tisana,infuso|
Vino|Bevande|75|bicchiere/bicchieri:125||
Birra|Bevande|34|bottiglia/bottiglie:330||
Acque alcaline|Bevande|0|bicchiere/bicchieri:200||
Orzo solubile|Bevande|3|tazza/tazze:200|caffe d'orzo|
Succhi di frutta|Bevande|45|bicchiere/bicchieri:200;brick/brick:200|succo di frutta,succo ace,nettare|
Bibite gassate / cola|Bevande|40|lattina/lattine:330|coca cola,aranciata,gassosa,bibita|
Energy drink|Bevande|45|lattina/lattine:250||
Sherry / porto|Bevande|150|bicchierino/bicchierini:50||
Caffè|Bevande|2|tazzina/tazzine:40|espresso,caffe|
Caffè decaffeinato|Bevande|2|tazzina/tazzine:40|deca|
Cappuccino|Bevande|50|tazza/tazze:150|latte macchiato,caffelatte|
Tè|Bevande|1|tazza/tazze:200|te,the,te verde|
Tè freddo|Bevande|30|bottiglia/bottiglie:500|the freddo|
Spremuta d'arancia|Bevande|33|bicchiere/bicchieri:200|succo d'arancia|
Superalcolici|Bevande|240|bicchierino/bicchierini:40|whisky,vodka,amaro,limoncello,grappa|
Zucchero|Dolci e altro|392|cucchiaino/cucchiaini:5;bustina/bustine:5||
Cacao / cioccolato|Dolci e altro|540|quadratino/quadratini:5|cioccolato,cioccolata,cacao,cioccolato fondente|
Crema spalmabile al cacao|Dolci e altro|540|cucchiaino/cucchiaini:10|nutella|
Biscotti al cioccolato|Dolci e altro|480|biscotto/biscotti:10||
Tiramisù|Dolci e altro|300|porzione/porzioni:100||
Miele|Dolci e altro|304|cucchiaino/cucchiaini:5||
Marmellata|Dolci e altro|222|cucchiaino/cucchiaini:5|confettura|1 cucchiaino = 5 g.
Dolci e merendine|Dolci e altro|420|merendina/merendine:35|merendina,dolce|
Cornetto|Dolci e altro|410|cornetto/cornetti:50|croissant|
Brioche col tuppo|Dolci e altro|360|brioche/brioche:80|brioche|
Granita|Dolci e altro|120|granita/granite:200||
Cannolo siciliano|Dolci e altro|380|cannolo/cannoli:120|cannolo|
Crostata|Dolci e altro|380|fetta/fette:80||
Torta|Dolci e altro|350|fetta/fette:80|ciambellone,torta margherita|
Caramelle|Dolci e altro|390|caramella/caramelle:5||
Sorbetto|Dolci e altro|130|coppetta/coppette:100||
Dolcificanti polioli|Dolci e altro|240|bustina/bustine:1|sorbitolo,xilitolo,maltitolo,chewing gum|
Lasagne|Piatti pronti|160|porzione/porzioni:300|pasta al forno|
Arancino|Piatti pronti|240|arancino/arancini:200|arancina,arancine|
Parmigiana di melanzane|Piatti pronti|170|porzione/porzioni:250|parmigiana|
Gelsi|Frutta|43|cestino/cestini:125|more di gelso,celsi|
Papaya|Frutta|28|fetta/fette:150||
Litchi|Frutta|66|frutto/frutti:10|lychee|
Lime|Frutta|30|lime/lime:50||
Cedro|Frutta|30|fetta/fette:30||
Kumquat|Frutta|71|frutto/frutti:20|mandarino cinese|
Pera nashi|Frutta|42|frutto/frutti:200|nashi|
Guava|Frutta|68|frutto/frutti:100||
Frutto del drago|Frutta|60|frutto/frutti:200|pitaya|
Mela cotogna|Frutta|57|frutto/frutti:200|cotogna|
Frutti di bosco misti|Frutta|45|cestino/cestini:125|frutti di bosco|
Carambola|Frutta|31|frutto/frutti:90||
Bacche di goji|Frutta|349|cucchiaio/cucchiai:10|goji|
Fichi secchi|Frutta|256|fico/fichi:20||
Albicocche secche|Frutta|241|albicocca/albicocche:8||
Anacardi|Frutta|553|manciata/manciate:30|anacardo|
Noci pecan|Frutta|691|manciata/manciate:30|pecan|
Noci di macadamia|Frutta|718|manciata/manciate:30|macadamia|
Noci del Brasile|Frutta|656|noce/noci:5|noce brasiliana|
Pinoli|Frutta|673|cucchiaio/cucchiai:10||
Semi di girasole|Frutta|584|cucchiaio/cucchiai:10||
Semi di zucca|Frutta|559|cucchiaio/cucchiai:10||
Semi di chia|Frutta|486|cucchiaio/cucchiai:12|chia|
Semi di lino|Frutta|534|cucchiaio/cucchiai:10|lino|
Semi di sesamo|Frutta|573|cucchiaio/cucchiai:9|sesamo,tahina|
Burro di arachidi|Frutta|588|cucchiaio/cucchiai:16||
Cavolo romanesco|Verdure|27|porzione/porzioni:200|broccolo romanesco|
Cavolo riccio|Verdure|49|porzione/porzioni:150|kale|
Cavolo cinese|Verdure|13|porzione/porzioni:150|pak choi,bok choy|
Friarielli|Verdure|22|porzione/porzioni:200||
Catalogna|Verdure|17|porzione/porzioni:200|puntarelle|
Tarassaco|Verdure|45|porzione/porzioni:100|dente di leone|
Taccole|Verdure|42|porzione/porzioni:150||
Ravanelli|Verdure|16|ravanello/ravanelli:10|ravanello|
Topinambur|Verdure|73|porzione/porzioni:150||
Fiori di zucca|Verdure|15|fiore/fiori:10||
Cardi|Verdure|17|porzione/porzioni:200|cardo|
Agretti|Verdure|17|porzione/porzioni:150|barba di frate|
Borragine|Verdure|21|porzione/porzioni:150||
Pomodori secchi|Verdure|258|pezzo/pezzi:5||
Melanzane grigliate|Verdure|30|porzione/porzioni:150|melanzane alla griglia|
Verdure grigliate miste|Verdure|45|porzione/porzioni:200|grigliata di verdure|
Capperi|Condimenti|23|cucchiaino/cucchiaini:5||
Peperoncino|Condimenti|40|pizzico/pizzichi:1|peperoncino piccante|
Zenzero|Condimenti|80|cucchiaino/cucchiaini:2||
Curcuma|Condimenti|312|cucchiaino/cucchiaini:3||
Cannella|Condimenti|247|cucchiaino/cucchiaini:3||
Noce moscata|Condimenti|525|pizzico/pizzichi:1||
Paprika|Condimenti|282|cucchiaino/cucchiaini:2||
Curry|Condimenti|325|cucchiaino/cucchiaini:2||
Menta|Condimenti|70|foglia/foglie:1||
Finocchietto selvatico|Condimenti|43|ciuffo/ciuffi:5|finocchietto,aneto|
Zafferano|Condimenti|310|bustina/bustine:0.15||
Margarina|Condimenti|717|cucchiaino/cucchiaini:5||
Senape|Condimenti|66|cucchiaino/cucchiaini:5|mostarda|
Salsa barbecue|Condimenti|170|cucchiaio/cucchiai:15|barbecue|
Tzatziki|Condimenti|90|cucchiaio/cucchiai:30||
Guacamole|Condimenti|160|cucchiaio/cucchiai:30||
Salsa verde|Condimenti|300|cucchiaio/cucchiai:15||
Pesto alla trapanese|Condimenti|350|cucchiaio/cucchiai:15||
Pesto di pistacchio|Condimenti|550|cucchiaio/cucchiai:15||
Ragù di carne|Condimenti|110|porzione/porzioni:100|ragu,bolognese|
Brodo vegetale fatto in casa|Condimenti|7|tazza/tazze:250|brodo vegetale|
Brodo di pollo|Condimenti|10|tazza/tazze:250|brodo di carne|
Fagioli lessati|Legumi|100|scatoletta sgocciolata/scatolette sgocciolate:240|fagioli in scatola|Peso lessato o sgocciolato.
Ceci lessati|Legumi|120|cucchiaio/cucchiai:25;scatoletta sgocciolata/scatolette sgocciolate:240|ceci in scatola|Peso lessato.
Lenticchie lessate|Legumi|110|porzione/porzioni:150|lenticchie in scatola|Peso lessato.
Lupini|Legumi|114|manciata/manciate:30||
Edamame|Legumi|121|porzione/porzioni:100||
Cicerchie|Legumi|340|porzione secca/porzioni secche:50||Peso secco.
Tempeh|Legumi|192|porzione/porzioni:100||
Falafel|Legumi|333|falafel/falafel:20||
Seitan|Cereali|140|porzione/porzioni:100||
Pasta all'uovo|Cereali|366|porzione/porzioni:80|tagliatelle,fettuccine,pappardelle,tagliolini|
Pasta fresca ripiena|Cereali|250|porzione/porzioni:125|tortellini,ravioli,agnolotti,cappelletti|
Riso venere|Cereali|360|porzione/porzioni:80|riso nero|
Pasta di riso|Cereali|355|porzione/porzioni:80|spaghetti di riso,noodles di riso|
Pasta di legumi|Cereali|340|porzione/porzioni:80|pasta di lenticchie,pasta di piselli|
Noodles di grano|Cereali|360|porzione/porzioni:80|noodles,udon,ramen secchi|
Grano saraceno|Cereali|343|porzione/porzioni:80||
Miglio|Cereali|356|porzione/porzioni:80||
Amaranto|Cereali|371|porzione/porzioni:80||
Bulgur|Cereali|342|porzione/porzioni:80||
Semolino|Cereali|360|cucchiaio/cucchiai:10||
Farina di grano|Cereali|343|cucchiaio/cucchiai:10|farina 00,farina 0|
Pangrattato|Cereali|351|cucchiaio/cucchiai:10|pane grattugiato|
Pane di semola|Cereali|265|fetta/fette:30|pane di casa,pane siciliano,pane di rimacinato|
Pane a lievitazione naturale|Cereali|260|fetta/fette:30|pane con lievito madre,pane di pasta madre|
Focaccia|Cereali|330|trancio/tranci:100||
Pane arabo|Cereali|275|pita/pite:60|pita|
Tortilla|Cereali|300|tortilla/tortillas:40||
Friselle|Cereali|385|frisella/friselle:40|freselle|
Fette biscottate integrali|Cereali|380|fetta/fette:8||
Fette biscottate senza glutine|Cereali|400|fetta/fette:8||
Muesli|Cereali|370|porzione/porzioni:40|granola|
Riso soffiato|Cereali|380|tazza/tazze:15||
Gallette di mais|Cereali|380|galletta/gallette:8||
Pancake|Cereali|227|pancake/pancake:40||
Crêpes|Cereali|215|crêpe/crêpes:50|crepes,crespelle|
Popcorn|Cereali|387|ciotola/ciotole:25|pop corn|
Patatine fritte|Cereali|312|porzione/porzioni:120|french fries|
Patatine in busta|Cereali|536|sacchetto/sacchetti:25|chips,patatine|
Purè di patate|Cereali|95|porzione/porzioni:200|pure|
Crocchette di patate|Cereali|230|crocchetta/crocchette:30|crocche,cazzilli|
Patata dolce|Cereali|86|patata/patate:200|batata,patata americana|
Cosce di pollo|Carne e uova|172|coscia/cosce:120|coscia di pollo,sovracosce|
Carne macinata magra|Carne e uova|150|porzione/porzioni:100|macinato|
Polpette|Carne e uova|220|polpetta/polpette:30||
Cotoletta impanata|Carne e uova|230|cotoletta/cotolette:120|cotoletta alla milanese|
Coppa|Carne e uova|398|fetta/fette:10|capocollo|
Guanciale|Carne e uova|655|fetta/fette:10||
Capretto|Carne e uova|120|porzione/porzioni:100||
Anatra|Carne e uova|160|porzione/porzioni:100|petto d'anatra|
Faraona|Carne e uova|143|porzione/porzioni:100||
Cinghiale|Carne e uova|123|porzione/porzioni:100||
Albume|Carne e uova|43|albume/albumi:33|chiare d'uovo|
Pesce bianco di mare|Pesce|90|filetto/filetti:120|cernia,dentice,sarago,pagello,rombo,palombo,san pietro|
Trota|Pesce|119|filetto/filetti:120||
Salmone affumicato|Pesce|147|fetta/fette:15||Molto salato.
Aringa|Pesce|216|filetto/filetti:100||
Ricciola|Pesce|136|trancio/tranci:150||
Scampi|Pesce|71|scampo/scampi:20||
Surimi|Pesce|100|bastoncino/bastoncini:17||
Ostriche|Pesce|69|ostrica/ostriche:15||
Latte di capra|Latticini|69|tazza/tazze:200||
Latte condensato|Latticini|321|cucchiaio/cucchiai:20||
Kefir|Latticini|64|bicchiere/bicchieri:200||
Skyr|Latticini|63|vasetto/vasetti:150||
Yogurt intero|Latticini|66|vasetto/vasetti:125|yogurt bianco,yogurt alla frutta|
Yogurt di soia|Latticini|60|vasetto/vasetti:125|yogurt vegetale|
Bevanda d'avena|Latticini|45|tazza/tazze:200|latte di avena|
Bevanda di cocco|Latticini|20|tazza/tazze:200|latte di cocco|
Caciocavallo|Latticini|439|fetta/fette:30|ragusano|
Primo sale|Latticini|260|fetta/fette:30|tuma|
Ricotta salata|Latticini|280|cucchiaio grattugiato/cucchiai grattugiati:10||
Mozzarella di bufala|Latticini|288|mozzarella/mozzarelle:125|bufala|
Fiocchi di latte|Latticini|100|vasetto/vasetti:150|cottage cheese|
Taleggio|Latticini|315|fetta/fette:30||
Brie|Latticini|330|fetta/fette:30|camembert|
Cheddar|Latticini|403|fetta/fette:20||
Groviera|Latticini|389|fetta/fette:25|gruyere,gruviera|
Sottilette|Latticini|280|sottiletta/sottilette:20|formaggio fuso|
Proteine in polvere|Latticini|380|misurino/misurini:30|whey,proteine whey|
Zucchero di canna|Dolci e altro|380|cucchiaino/cucchiaini:5|zucchero grezzo|
Sciroppo d'acero|Dolci e altro|260|cucchiaino/cucchiaini:7||
Sciroppo d'agave|Dolci e altro|310|cucchiaino/cucchiaini:7|agave|
Melassa|Dolci e altro|290|cucchiaino/cucchiaini:7||
Dolcificanti (aspartame, stevia)|Dolci e altro|0|bustina/bustine:1|aspartame,stevia,saccarina,sucralosio|
Cioccolato bianco|Dolci e altro|539|quadratino/quadratini:5||
Pandoro|Dolci e altro|410|fetta/fette:80||
Panettone|Dolci e altro|350|fetta/fette:80||
Colomba|Dolci e altro|400|fetta/fette:80||
Biscotti frollini|Dolci e altro|450|biscotto/biscotti:10|frollini,biscotti al burro|
Wafer|Dolci e altro|500|wafer/wafer:10||
Muffin|Dolci e altro|380|muffin/muffin:80||
Cheesecake|Dolci e altro|321|fetta/fette:100||
Panna cotta|Dolci e altro|220|porzione/porzioni:120|pannacotta|
Budino|Dolci e altro|120|vasetto/vasetti:125|creme caramel|
Babà|Dolci e altro|300|baba/babà:60|baba|
Chiacchiere|Dolci e altro|450|porzione/porzioni:50|bugie,cenci|
Cassata siciliana|Dolci e altro|350|fetta/fette:100|cassata|
Paste di mandorla|Dolci e altro|430|pasticcino/pasticcini:20|frutta martorana,marzapane|
Torrone|Dolci e altro|450|pezzo/pezzi:20||
Minne di Sant'Agata|Dolci e altro|350|minna/minne:100|minnuzze|
Liquirizia|Dolci e altro|375|pezzo/pezzi:5||
Barrette ai cereali|Dolci e altro|400|barretta/barrette:25||
Barrette proteiche|Dolci e altro|360|barretta/barrette:50|protein bar|
Acqua tonica|Bevande|34|lattina/lattine:330|chinotto|
Kombucha|Bevande|20|bottiglia/bottiglie:330||
Tè matcha|Bevande|1|tazza/tazze:200|matcha|
Caffè al ginseng|Bevande|40|tazzina/tazzine:40|ginseng|
Cioccolata calda|Bevande|90|tazza/tazze:200||
Frullato|Bevande|60|bicchiere/bicchieri:250|smoothie,frappè,milkshake|
Spremuta di mandarino|Bevande|45|bicchiere/bicchieri:200||
Prosecco|Bevande|70|calice/calici:120|spumante,champagne|
Spritz|Bevande|62|bicchiere/bicchieri:200|aperol spritz|
Birra analcolica|Bevande|24|bottiglia/bottiglie:330||
Bevande isotoniche|Bevande|25|bottiglia/bottiglie:500|gatorade,powerade|
Acqua di cocco|Bevande|19|bicchiere/bicchieri:200||
Pasta al pomodoro|Piatti pronti|140|porzione/porzioni:250|spaghetti al pomodoro,pasta al sugo|
Pasta al tonno|Piatti pronti|160|porzione/porzioni:280||
Pasta al ragù|Piatti pronti|170|porzione/porzioni:280|tagliatelle al ragu,spaghetti alla bolognese|
Pasta alla carbonara|Piatti pronti|300|porzione/porzioni:250|carbonara|
Cacio e pepe|Piatti pronti|290|porzione/porzioni:250||
Pasta all'amatriciana|Piatti pronti|230|porzione/porzioni:250|amatriciana|
Pasta alla norma|Piatti pronti|170|porzione/porzioni:300|norma|
Pasta con le sarde|Piatti pronti|190|porzione/porzioni:300||
Pasta e fagioli|Piatti pronti|110|porzione/porzioni:350||
Pasta e ceci|Piatti pronti|130|porzione/porzioni:350||
Pasta e lenticchie|Piatti pronti|120|porzione/porzioni:350||
Pasta al pesto|Piatti pronti|260|porzione/porzioni:250|trofie al pesto|
Pasta ai frutti di mare|Piatti pronti|150|porzione/porzioni:300|spaghetti alle vongole,spaghetti allo scoglio,risotto alla pescatora|
Risotto ai funghi|Piatti pronti|140|porzione/porzioni:300||
Risotto alla milanese|Piatti pronti|160|porzione/porzioni:300|risotto allo zafferano|
Insalata di riso|Piatti pronti|180|porzione/porzioni:300||
Gnocchi al pomodoro|Piatti pronti|130|porzione/porzioni:300||
Minestrone|Piatti pronti|45|porzione/porzioni:300||
Vellutata di zucca|Piatti pronti|50|ciotola/ciotole:300|crema di zucca|
Pollo al curry|Piatti pronti|150|porzione/porzioni:250||
Pesce al cartoccio|Piatti pronti|90|porzione/porzioni:150|orata al forno,spigola al forno|
Polpette al sugo|Piatti pronti|190|porzione/porzioni:200||
Caponata|Piatti pronti|130|porzione/porzioni:150||
Peperonata|Piatti pronti|80|porzione/porzioni:150||
Insalata caprese|Piatti pronti|160|porzione/porzioni:250|caprese|
Insalata greca|Piatti pronti|110|porzione/porzioni:250||
Frittata di verdure|Piatti pronti|150|fetta/fette:100||
Toast prosciutto e formaggio|Piatti pronti|260|toast/toast:120|toast|
Panino con prosciutto|Piatti pronti|270|panino/panini:150|panino|
Tramezzino|Piatti pronti|250|tramezzino/tramezzini:100||
Hamburger nel panino|Piatti pronti|250|panino/panini:220|cheeseburger,burger|
Hot dog|Piatti pronti|250|panino/panini:150||
Nuggets di pollo|Piatti pronti|270|pezzo/pezzi:18|crocchette di pollo|
Kebab|Piatti pronti|215|panino/panini:350|doner,gyros|
Pizza diavola|Piatti pronti|270|pizza/pizze:330||
Pizza capricciosa|Piatti pronti|250|pizza/pizze:350||
Pizza quattro formaggi|Piatti pronti|300|pizza/pizze:330||
Calzone|Piatti pronti|260|calzone/calzoni:350||
Sushi|Piatti pronti|150|pezzo/pezzi:30|nigiri,maki,uramaki|
Sashimi|Piatti pronti|130|pezzo/pezzi:15||
Poke|Piatti pronti|140|ciotola/ciotole:400|poke bowl|
Paella|Piatti pronti|160|porzione/porzioni:350||
Cous cous di pesce|Piatti pronti|150|porzione/porzioni:350|cuscus trapanese|
Ramen|Piatti pronti|90|ciotola/ciotole:500||
Tacos|Piatti pronti|220|taco/tacos:100||
Burrito|Piatti pronti|200|burrito/burritos:300||
Chili con carne|Piatti pronti|110|porzione/porzioni:300||
Panelle|Piatti pronti|300|panella/panelle:30||
Scacciata catanese|Piatti pronti|270|fetta/fette:150|scacciata|
Cipollina catanese|Piatti pronti|350|cipollina/cipolline:120|cipollina|
Sfincione|Piatti pronti|250|trancio/tranci:150||
`;
