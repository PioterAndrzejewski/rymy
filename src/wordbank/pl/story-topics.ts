// Tematy do trybu Historia + powiązane z nimi słownictwo.
//
// 1000 tematów rozłożonych na 50 kategorii (po 20). Każda kategoria ma własny
// bank ~45 słów, więc każdy temat ma z czego losować słowa "w klimacie".
// Dane trzymamy jako stringi rozdzielone spacją / pionową kreską — czyta się
// równie dobrze, a plik jest o połowę krótszy niż tablice literałów.

export type CategoryId = keyof typeof CATEGORY_WORDS;

const CATEGORY_WORDS = {
  dom: 'klucz próg kanapa dywan lampa okno firanka łazienka korytarz schody winda sąsiad remont ściana sufit podłoga szafa łóżko koc poduszka herbata pilot telewizor pralka zlew kran śmieci balkon parapet doniczka bałagan sprzątanie odkurzacz zapach cisza wieczór rachunki listonosz skrzynka dzwonek klatka mieszkanie czajnik ręcznik gniazdko żarówka',
  kuchnia: 'garnek patelnia nóż deska widelec talerz obiad zupa rosół pierogi ziemniaki chleb masło ser jajko cebula czosnek pieprz sól cukier mąka ciasto piekarnik kuchenka lodówka mleko kawa śniadanie kolacja przepis babcia zapach smak głód apetyt pomidor ogórek makaron ryż mięso kotlet sałatka deser piernik fartuch',
  miasto: 'ulica chodnik latarnia tramwaj autobus przystanek dworzec plac rynek kamienica blok osiedle sklep witryna neon korek klakson syrena tłum przechodzień bruk graffiti mural park ławka fontanna gołąb śmietnik metro most rzeka bulwar kiosk barierka zebra światła skrzyżowanie taksówka rower hulajnoga beton przejście deszcz brud pośpiech',
  podroze: 'walizka plecak bilet paszport mapa kompas hostel hotel namiot autostop pociąg samolot prom granica celnik pamiątka aparat zdjęcie widokówka droga kilometr trasa nocleg śpiwór szlak przewodnik obcy język waluta lotnisko peron morze góry pustynia wyspa port tęsknota powrót przygoda bagaż przystanek zmęczenie wolność horyzont',
  praca: 'biuro szef korporacja kawa deadline mail spotkanie prezentacja excel drukarka komputer biurko krzesło umowa wypłata premia nadgodziny urlop zwolnienie awans kariera kolega zespół projekt klient faktura telefon kalendarz przerwa kanapka winda identyfikator poniedziałek piątek zmęczenie stres rutyna cel raport ocena rekrutacja rozmowa cv etat',
  szkola: 'dzwonek tablica kreda ławka zeszyt długopis plecak lekcja sprawdzian ocena dziennik nauczyciel dyrektor woźna korytarz szatnia stołówka przerwa boisko wagary klasa ściąga zadanie matura studia wykład egzamin sesja indeks akademik biblioteka mundurek apel wycieczka świadectwo wakacje pierwszak dyktando geografia matematyka kolokwium promocja tornister linijka piórnik',
  milosc: 'serce pocałunek dotyk spojrzenie tęsknota randka kwiaty wiadomość obietnica zdrada rozstanie powrót łzy uśmiech noc rano perfumy sweter zapach dłoń palce obrączka ślub wesele przysięga zazdrość kłótnia przeprosiny wybaczenie czułość ciepło bliskość dystans list zdjęcie wspomnienie imię głos oddech motyle wiosna szczęście telefon nadzieja',
  rodzina: 'matka ojciec siostra brat babcia dziadek wnuk ciocia wujek kuzyn chrzest wesele pogrzeb święta wigilia opłatek stół obiad kłótnia pojednanie dzieciństwo album zdjęcie imieniny prezent list wychowanie zasady kara pochwała duma wstyd dziedzictwo nazwisko krew korzenie rozwód alimenty opieka wnuczka kołyska rocznica sekret milczenie',
  przyjazn: 'kumpel ekipa podwórko rower piłka tajemnica obietnica wsparcie rozmowa impreza wyjazd namiot ognisko gitara piwo śmiech żart przezwisko kłótnia zdrada wybaczenie lojalność zaufanie ramię pomoc przysługa wspomnienie zdjęcie klasa drużyna podróż gadanie milczenie obecność dystans lata spotkanie rocznica brat siostra sąsiad numer wiadomość dług',
  smutek: 'łzy żal pustka cisza deszcz szarość noc bezsenność wspomnienie strata rozstanie pogrzeb list zdjęcie okno papieros herbata koc samotność ciężar serce gardło oddech westchnienie milczenie mrok jesień listopad cmentarz świeca modlitwa nadzieja czas rana blizna przeprosiny wybaczenie tęsknota matka dzieciństwo powrót żałoba pamięć zmęczenie',
  radosc: 'śmiech uśmiech taniec słońce lato wakacje przyjaciele impreza muzyka piosenka prezent niespodzianka sukces medal dyplom awans dziecko narodziny wesele podróż morze plaża lody karuzela balon fajerwerki gwiazdy ognisko gitara skok bieg energia lekkość ulga wolność wdzięczność spotkanie powrót list wiadomość zwycięstwo marzenie spełnienie wiosna świt',
  zlosc: 'krzyk pięść ściana drzwi trzask przekleństwo kłótnia szef zdrada niesprawiedliwość korek kolejka rachunek awaria spóźnienie hałas sąsiad plotka kłamstwo oskarżenie zemsta gniew furia nerwy oddech liczenie milczenie łzy wstyd żal przeprosiny granica cierpliwość wybuch iskra ogień krew skronie zęby szczęka puls spokój telefon hamulec pretensja',
  strach: 'ciemność cień dźwięk krok schody piwnica las wilk burza błyskawica wysokość przepaść samolot winda tłum scena mikrofon egzamin lekarz diagnoza igła wynik telefon cisza serce puls oddech pot dreszcz koszmar sen dziecko matka ucieczka drzwi zamek klucz alarm policja szpital nadzieja odwaga próg noc',
  sport: 'bieg boisko piłka bramka gol sędzia gwizdek kibic trybuna koszulka trener trening siłownia sztanga rower kask basen pływanie start meta stoper medal puchar rekord przegrana zwycięstwo kontuzja bandaż pot oddech serce mięśnie nogi ręce rywal drużyna kapitan mecz derby ring rękawice cios runda mistrz',
  muzyka: 'bit mikrofon studio nagranie tekst zwrotka refren rym flow scena koncert publiczność klub kolumny bas perkusja gitara klawisze płyta singiel klip trasa hotel próba głos oddech trema brawa bis autograf producent mix sampel słuchawki radio playlista wers punchline freestyle cypher bitwa kabel statyw fanka',
  film: 'kamera reżyser aktor scenariusz plan klaps ujęcie kadr scena rola statysta kostium charakteryzacja światło mikrofon montaż napisy premiera kino bilet popcorn fotel ekran seans zwiastun serial odcinek sezon finał zwrot bohater złoczyńca fabuła dialog muzyka festiwal krytyk recenzja kanapa pilot maraton łzy śmiech gala',
  internet: 'ekran telefon laptop wifi hasło konto profil zdjęcie selfie lajk komentarz hejt trol post relacja stream czat emotka wiadomość powiadomienie algorytm reklama influencer zasięg obserwujący hasztag mem filtr blokada ghosting randka aplikacja ładowarka bateria router klawiatura kursor link wyszukiwarka prywatność dane scroll anonim awatar wirus',
  technologia: 'robot algorytm kod program serwer chmura dane czujnik dron kamera ekran procesor kabel ładowarka aktualizacja błąd awaria restart hasło szyfr klucz sieć satelita laser drukarka proteza implant autopilot fabryka taśma maszyna silnik prąd panel akumulator przyszłość postęp wynalazek patent laboratorium naukowiec eksperyment prototyp bateria interfejs',
  pieniadze: 'portfel banknot moneta karta bankomat konto kredyt rata dług komornik rachunek faktura paragon wypłata premia oszczędności skarbonka lokata inwestycja giełda akcje kantor kurs waluta euro złotówka bieda bogactwo luksus zegarek willa czynsz wynajem podatek urząd zarobek etat zlecenie napiwek loteria kupon prowizja odsetki wyciąg',
  zakupy: 'koszyk wózek kolejka kasa paragon promocja rabat wyprzedaż centrum sklep półka regał reklamówka torba lista chleb mleko owoce warzywa mięso słodycze napoje kasjerka ochroniarz terminal gotówka karta bon przymierzalnia rozmiar metka zwrot reklamacja kurier paczka przesyłka zamówienie dostawa targ bazar stragan cena kod portfel',
  las: 'drzewo sosna dąb brzoza liść igła kora korzeń mech grzyb borowik jagoda malina ścieżka szlak strumień źródło polana gałąź szyszka wiewiórka sarna dzik lis sowa dzięcioł ptak echo cisza szum wiatr mgła rosa świt zmierzch ognisko namiot plecak kompas gajowy leśniczówka drewno siekiera pożar paproć',
  morze: 'fala piasek muszla plaża parasol ręcznik krem słońce oparzenie mewa latarnia molo port łódź kuter sieć rybak sól wiatr sztorm horyzont statek żagiel kotwica pokład kapitan wyspa skały klif zachód nurkowanie maska rekin meduza krab kamyk bursztyn deptak gofry lody wakacje sierpień tęsknota głębia przypływ',
  gory: 'szczyt szlak plecak buty kije schronisko przełęcz grań perć dolina potok wodospad hala owca baca oscypek mgła chmura śnieg lawina skała ściana lina karabinek wspinaczka widok panorama wschód zmierzch zmęczenie oddech wysokość tlen ratownik helikopter krzyż kapliczka cisza echo wiatr mróz termos herbata siarczysty stok',
  pogoda: 'deszcz słońce chmura wiatr burza grzmot błyskawica tęcza mgła szron mróz śnieg zamieć upał susza ulewa kałuża parasol kalosze wilgoć ciśnienie front prognoza barometr termometr stopnie wichura huragan powódź grad rosa szadź przymrozek odwilż słota niebo horyzont zachmurzenie promień cień duszno parno powiew grzmoty',
  zima: 'śnieg mróz lód sanki narty łyżwy bałwan kulig szalik czapka rękawiczki kurtka piec kominek herbata grzaniec święta choinka bombka prezent kolęda opłatek wigilia sylwester fajerwerki styczeń luty ferie zaspa łopata odśnieżanie ślizgawica sopel szron para oddech ciemność zmierzch koc kot okno mandarynki piernik zmarznięte rękawice',
  lato: 'słońce upał plaża woda jezioro rower lody arbuz burza wieczór komary namiot ognisko gitara festiwal koncert wakacje pole zboże mak chabry łąka ścieżka hamak ogród grill kiełbaska lemoniada klapki okulary krem opalenizna piegi wiatr chłód noc gwiazdy meteor świt ptaki sierpień wolność sianokosy żniwa',
  noc: 'ciemność księżyc gwiazdy latarnia bezsenność sen koszmar poduszka zegar godzina cisza szept oddech myśli lęk telefon ekran papieros balkon okno miasto neon taksówka powrót klucze drzwi schody winda pies syrena karetka szpital dyżur czuwanie kawa świt ptaki mgła rosa bezruch sowa cień pustka szmer',
  poranek: 'budzik alarm kawa herbata prysznic ręcznik szczoteczka lustro twarz kanapka tost jajecznica radio wiadomości korek autobus tramwaj spóźnienie płaszcz buty klucze winda mgła rosa słońce świt ptaki gazeta listonosz pies spacer energia plan lista kalendarz poniedziałek nadzieja początek zaspany pościel firanka światło pierwszy łyk',
  zdrowie: 'ból gorączka kaszel katar tabletka syrop apteka recepta lekarz badanie krew wynik dieta warzywa woda sen odpoczynek stres nerwy serce ciśnienie waga siłownia bieg oddech płuca kręgosłup plecy kolano bandaż rana blizna szczepienie odporność witamina zioła herbata miód czosnek zwolnienie rehabilitacja masaż nawyk równowaga puls',
  szpital: 'korytarz oddział sala łóżko kroplówka igła strzykawka pielęgniarka lekarz chirurg operacja narkoza skalpel monitor tętno karetka sygnał izba przyjęcie kolejka wynik prześwietlenie gips bandaż opatrunek dyżur noc cisza kwiaty odwiedziny rodzina diagnoza nadzieja wypis rekonwalescencja ból ulga modlitwa oczekiwanie telefon fartuch maska tlen kartoteka',
  samochody: 'kierownica silnik koło opona bagażnik maska klakson lusterko pas fotel radio muzyka trasa autostrada zjazd stacja paliwo bak olej warsztat mechanik usterka awaria laweta mandat patrol prędkość wypadek stłuczka ubezpieczenie prawko egzamin instruktor korek objazd mapa nawigacja deszcz wycieraczki reflektory garaż kluczyk hamulec bieg',
  pociagi: 'peron tor bilet konduktor przedział wagon lokomotywa gwizd semafor rozkład opóźnienie przesiadka dworzec hala kasa tablica walizka plecak okno widok pola słupy tunel most stukot koła kawa termos książka drzemka współpasażer rozmowa cisza granica noc świt przyjazd pożegnanie bagaż spóźnienie powrót ostatni kurs bufet',
  lotnisko: 'terminal odprawa bilet paszport bramka bagaż taśma kontrola detektor buty pas fotel stewardessa kapitan start lądowanie turbulencja chmury okno skrzydło silnik hałas ciśnienie uszy kawa koc film opóźnienie odlot przylot tablica hala taksówka walizka celnik strefa sklep pożegnanie powitanie łzy obcy kraj wiza karta pokładowa',
  wies: 'pole łąka miedza traktor kombajn żniwa siano stodoła obora krowa świnia kura kogut gęś pies studnia płot furtka sad jabłoń grusza malina agrest ogród grządka ziemniaki marchew obornik wóz konie siodło dziadek babcia chałupa piec drewno siekiera kościół dzwon odpust sąsiad cisza gwiazdy błoto kalosze',
  zwierzeta: 'pies kot chomik królik papuga rybka żółw koń krowa owca koza kura kaczka gęś świnia mysz szczur nietoperz jeż wiewiórka sarna dzik lis wilk niedźwiedź ryś borsuk bóbr żaba wąż jaszczurka pająk pszczoła mrówka motyl ważka wrona sroka gołąb sowa bocian jaskółka łabędź jeleń schronisko',
  dziecinstwo: 'podwórko trzepak piaskownica huśtawka rower hulajnoga kredki bajka kreskówka klocki lalka miś guma cukierki oranżada wakacje babcia dziadek plecak zeszyt kolega tajemnica szałas drzewo kolano rana plaster łzy śmiech urodziny balon tort świeczki prezent zdjęcie album pamięć zapach ciepło niewinność strach ciemność sen kolonie',
  starosc: 'zmarszczki siwizna laska okulary aparat tabletki apteka emerytura ławka park gołębie wnuki album zdjęcia wspomnienia opowieść powtórka cisza samotność telefon wizyta kościół cmentarz żona mąż choroba szpital fotel telewizor radio herbata sweter koc okno ogród róże czas przemijanie mądrość godność spokój kapcie zegar pamięć',
  smierc: 'pogrzeb trumna grób cmentarz świeca znicz kwiaty wieniec ksiądz modlitwa dzwon czerń welon łzy żałoba stypa wspomnienie zdjęcie list testament spadek pustka cisza brak imię data kamień napis ziemia deszcz listopad zaduszki pamięć duch sen nadzieja niebo wieczność strach ulga pożegnanie ostatni oddech krzyż',
  wiara: 'kościół ołtarz świeca krzyż modlitwa różaniec msza kazanie ksiądz organy pieśń chór ministrant komunia spowiedź grzech pokuta wybaczenie łaska anioł niebo piekło dusza sumienie post wigilia wielkanoc pielgrzymka klasztor zakonnica cisza medytacja mantra karma los przeznaczenie znak cud wątpliwość pytanie sens nadzieja pokora dzwonek',
  polityka: 'wybory urna karta kandydat kampania plakat obietnica sondaż debata mównica sejm ustawa poseł minister premier prezydent partia koalicja opozycja protest transparent marsz strajk związek podatek budżet reforma media telewizja propaganda kłamstwo prawda obywatel głos sąsiad spór granica flaga hymn historia komisja mandat afera trybuna',
  policja: 'radiowóz syrena kajdanki mandat patrol legitymacja komisariat cela areszt przesłuchanie protokół świadek zeznanie adwokat prokurator sąd wyrok kara grzywna więzienie krata strażnik spacerniak wolność ucieczka pościg alarm włamanie złodziej kradzież sejf ślad odcisk kamera monitoring dowód alibi sprawa akta detektyw śledztwo prawda kłamstwo latarka',
  wojna: 'żołnierz mundur karabin hełm okop bunkier front linia atak odwrót czołg samolot bomba wybuch dym gruz ruina schron syrena alarm ewakuacja uchodźca walizka granica pociąg matka dziecko list zdjęcie rozkaz generał mapa strategia zwycięstwo klęska pokój traktat cmentarz pamięć bohater tchórz strach głód apel',
  kosmos: 'gwiazda planeta księżyc słońce galaktyka kometa meteoryt orbita rakieta statek kapsuła skafander hełm astronauta start odliczanie grawitacja nieważkość próżnia tlen panel satelita stacja teleskop obserwatorium osobliwość dziura mgławica pył krater mars wenus saturn pierścień sonda transmisja sygnał cisza bezkres ciemność zimno samotność tęsknota ziemia',
  magia: 'czar zaklęcie różdżka księga runy amulet talizman eliksir kocioł miotła wiedźma czarownica mag druid smok elf krasnolud goblin rycerz miecz tarcza zbroja zamek wieża loch skarb klucz portal wymiar przepowiednia wyrocznia klątwa błogosławieństwo duch upiór wilkołak wampir krew pełnia księżyc mgła legenda kruk ołtarz',
  sztuka: 'obraz płótno farba pędzel sztaluga galeria wernisaż kurator krytyk muzeum rzeźba glina dłuto marmur szkic ołówek węgiel akwarela portret pejzaż abstrakcja kolor światło cień perspektywa rama aukcja kolekcjoner atelier natchnienie muza styl epoka wiersz poeta strofa metafora powieść rozdział wydawca książka biblioteka podpis',
  impreza: 'klub bramkarz kolejka szatnia parkiet bit światła stroboskop bar barman drink shot piwo wódka lód cytryna kieliszek toast taniec pot tłum krzyk muzyka bas głośniki papieros palarnia rozmowa numer telefon taksówka świt kac aspiryna woda wstyd zdjęcia relacja rachunek kumpel after powrót urodziny konfetti',
  nalogi: 'papieros zapalniczka popielniczka dym kaszel butelka kieliszek kac głód drżenie ręce noc bezsenność kłamstwo ukrywanie wstyd wina rodzina obietnica próba odwyk terapia grupa spotkanie mityng abstynencja dzień licznik pokusa nawrót wsparcie przyjaciel lekarz tabletki automat zakład kupon ekran telefon uzależnienie kontrola wolność powrót dno',
  marzenia: 'cel plan lista notes kalendarz krok wysiłek trening dyscyplina poranek nawyk wiara nadzieja wizja obraz przyszłość dom podróż scena mikrofon medal dyplom firma pomysł ryzyko odwaga strach porażka lekcja upór cierpliwość czas rok zmiana początek sukces duma radość wdzięczność spełnienie szczyt droga sens iskra',
  porazka: 'błąd upadek wstyd cisza spojrzenie ocena wynik odrzucenie list rozmowa koniec zwolnienie długi bankructwo rozstanie egzamin poprawka scena gwizd publiczność mikrofon pustka noc bezsenność myśli pytanie wina lekcja wniosek pokora nadzieja start powrót szansa wsparcie przyjaciel matka ręka upór blizna doświadczenie dojrzałość dno próba',
  samotnosc: 'cisza mieszkanie ekran telefon brak wiadomość powiadomienie kolacja talerz kanapa film koc okno deszcz miasto tłum obcy ławka park pies spacer muzyka słuchawki myśli rozmowa wspomnienie zdjęcie święta urodziny tort świeczka nadzieja spotkanie sąsiad kawiarnia książka list dziennik noc sen poranek wolność spokój siła echo',
} as const;

const CATEGORY_TOPICS: Record<CategoryId, string> = {
  dom: 'poranek w kuchni|zapomniane klucze|awaria windy|hałas u sąsiada|remont łazienki|przeprowadzka do nowego mieszkania|pierwsza noc w pustym mieszkaniu|zepsuta pralka|wieczór przed telewizorem|sprzątanie po imprezie|awizo w skrzynce|kot na parapecie|zapach obiadu na klatce|zgubiony pilot|kłótnia o rower w piwnicy|blok o czwartej rano|ostatnie pudło z rzeczami|dzień bez prądu|kwiaty, które uschły|cisza po wyprowadzce',
  kuchnia: 'gotowanie pierogów|niedzielny rosół|przypalony obiad|przepis po babci|pusta lodówka przed wypłatą|śniadanie do łóżka|pierwsze ciasto w życiu|kolacja dla dwojga|smak dzieciństwa|kawa o piątej rano|nóż, który się stępił|zakalec na urodziny|kiszenie ogórków|wigilijny stół|makaron o północy|obiad u teściowej|zapach chleba z piekarni|święto pieczonego ziemniaka|kuchnia po remoncie|ostatni kawałek tortu',
  miasto: 'nocny tramwaj|korek w godzinach szczytu|mural na ścianie kamienicy|kolejka do kiosku|gołębie na rynku|deszcz na przystanku|neon starego kina|spacer po pustym mieście|ulica, która się zmieniła|dziecko na ławce w parku|syrena w oddali|graffiti pod blokiem|most o świcie|targ w sobotę|hulajnoga na chodniku|zgubiony w metrze|osiedle z wielkiej płyty|latarnia, która nie świeci|bezdomny pod sklepem|miasto po burzy',
  podroze: 'stopem przez Bałkany|weekend w Krakowie|zaginiona walizka|nocny prom przez Bałtyk|hostel w Amsterdamie|nocleg w namiocie nad jeziorem|autostop w deszczu|pociąg do Berlina|granica o północy|mapa bez zasięgu|tydzień w Rzymie|samotny wyjazd w góry|powrót do rodzinnego miasta|kajakiem po Krutyni|wycieczka szkolna do muzeum|obcy język w sklepie|ostatnie euro w portfelu|widokówka do domu|przypadkowy współpasażer|droga bez celu',
  praca: 'pierwszy dzień w nowej pracy|deadline o północy|rozmowa kwalifikacyjna|zwolnienie w piątek|awans, którego nie chciałem|kawa z kolegą z biura|spotkanie, które mogło być mailem|nadgodziny przed świętami|szef, który nie słucha|wypłata na koncie|urlop po dwóch latach|prezentacja przed zarządem|drukarka, która nie działa|winda z prezesem|ostatni dzień w firmie|zmiana branży po trzydziestce|praca zdalna z kuchni|kolega, który podkrada pomysły|premia, która nie przyszła|poniedziałek rano w korporacji',
  szkola: 'pierwszy dzwonek|ściąga w rękawie|sprawdzian z matematyki|wagary nad rzeką|wycieczka klasowa w góry|matura z polskiego|nauczyciel, którego się bało|szatnia po wuefie|apel na sto lat szkoły|ostatnia lekcja przed wakacjami|dyktando z błędami|studniówka|akademik nad ranem|sesja i kawa|kolokwium bez przygotowania|nowy w klasie|przezwisko, które zostało|świadectwo z paskiem|boisko po lekcjach|pierwsza dwója',
  milosc: 'pierwsza miłość|randka w deszczu|wiadomość bez odpowiedzi|złamane serce|zdrada w wakacje|oświadczyny na dachu|wesele w małej wsi|rozstanie na dworcu|powrót po latach|sweter, który został|zapach jej perfum|kłótnia o nic|pierwszy pocałunek|dwa lata na odległość|randka w ciemno|obrączka w szufladzie|list, którego nie wysłałem|zazdrość o przeszłość|noc bez słów|miłość po pięćdziesiątce',
  rodzina: 'święta u babci|kłótnia przy wigilijnym stole|rozwód rodziców|narodziny brata|telefon od mamy|pogrzeb dziadka|album ze zdjęciami na strychu|rodzinne imieniny|ojciec, który wrócił|sekret trzymany latami|wnuczka na kolanach|nazwisko, które ciąży|list od dawnego kuzyna|obiad u teściów|opieka nad chorą matką|dziedzictwo po dziadku|dzień z siostrą po latach|wychowanie bez ojca|rodzinne zdjęcie sprzed lat|pojednanie po dekadzie',
  przyjazn: 'kumpel z podwórka|ekipa z osiedla|ognisko nad jeziorem|przyjaciel, który zniknął|pożyczka, której nie oddał|wyjazd we trzech|tajemnica sprzed lat|kłótnia po latach przyjaźni|telefon o trzeciej w nocy|wspólna wyprawa rowerowa|milczenie zamiast rozmowy|nowy kolega w ekipie|przyjaciółka z dzieciństwa|zdjęcie z wakacji|dług wdzięczności|spotkanie po dziesięciu latach|rozmowa, która wszystko zmieniła|zdrada zaufania|wsparcie w najgorszym tygodniu|obietnica dana na podwórku',
  smutek: 'żal po rozstaniu|deszczowy listopad|pusty pokój|telefon, który nie dzwoni|list od zmarłej babci|noc bez snu|szare popołudnie|tęsknota za latem|świeca na parapecie|wspomnienie, które boli|papieros na balkonie|milczenie przy stole|blizna po stracie|jesienny cmentarz|ostatni dzień w starym domu|herbata, która wystygła|ciężar na piersi|pożegnanie bez słów|zdjęcie w szufladzie|smutek bez powodu',
  radosc: 'radość po zdanym egzaminie|narodziny dziecka|pierwsza wypłata|wygrana w ostatniej minucie|niespodziewany prezent|spotkanie po latach|taniec w kuchni|fajerwerki nad miastem|ostatni dzwonek przed wakacjami|list z dobrą wiadomością|śmiech do łez|pierwszy dzień wolności|medal na szyi|powrót do domu|wspólne śniadanie|karuzela na odpuście|piosenka, która ratuje dzień|słońce po tygodniu deszczu|niespodziewany telefon|szczęście w drobiazgach',
  zlosc: 'wściekłość na szefa|kłótnia o miejsce parkingowe|korek, przez który się spóźniłem|niesprawiedliwa ocena|plotka, która obiegła osiedle|rachunek za prąd|awantura o pilota|sąsiad z wiertarką o siódmej|kłamstwo, które wyszło|zemsta, której żałuję|trzaśnięte drzwi|krzyk, którego nie cofnę|kolejka, która nie idzie|gniew na siebie|zdrada kolegi|niedotrzymana obietnica|bunt przy stole|nerwy przed rozmową|spokój po wybuchu|granica cierpliwości',
  strach: 'strach przed ciemnością|pierwsze wystąpienie na scenie|wynik badania|nocny telefon|winda, która stanęła|burza nad domem|obcy na klatce|lęk przed lataniem|zgubione dziecko w markecie|krok na schodach|diagnoza u lekarza|piwnica w starej kamienicy|egzamin, którego się bałem|sen, który wraca|cień za oknem|ucieczka przed psem|wysokość na moście|noc w pustym domu|alarm o trzeciej|odwaga mimo strachu',
  sport: 'ostatnia minuta meczu|kontuzja przed sezonem|pierwszy maraton|trening o szóstej rano|derby na trybunach|przegrany finał|rzut karny|powrót po urazie|nowy rekord życiowy|kibic, który nie odpuszcza|trener, który uwierzył|basen o poranku|rower przez całą Polskę|walka na ringu|drużyna z podwórka|medal za trzecie miejsce|siłownia po pracy|gwizdek sędziego|puchar w gablocie|bieg z przeszkodami',
  muzyka: 'pierwszy koncert|trema przed wejściem na scenę|nagrywanie w piwnicy|bitwa freestyle|zapomniany tekst|trasa koncertowa busem|płyta, która nie wyszła|refren, który został w głowie|studio o czwartej rano|fanka pod sceną|producent, który nie oddzwonił|gitara sprzedana za bilet|pierwszy mikrofon|bis na koniec|autograf na plakacie|zespół, który się rozpadł|piosenka o niej|kolumny za głośne|próba przed występem|utwór, którego nikt nie usłyszał',
  film: 'pierwszy dzień na planie|casting bez sukcesu|statysta w tłumie|reżyser, który krzyczy|premiera w małym kinie|seans w pustej sali|serial oglądany do rana|zwiastun lepszy niż film|klaps i cisza|scena powtarzana dwadzieścia razy|napisy końcowe|rola życia|krytyk, który zmiażdżył|festiwal w deszczu|kostium z drugiej ręki|popcorn i bilet|maraton w sobotę|aktor bez tekstu|montaż, który zmienił wszystko|gala i puste ręce',
  internet: 'hejt pod zdjęciem|zapomniane hasło|profil sprzed dziesięciu lat|viral na jeden dzień|randka z aplikacji|ghosting po trzech dniach|komentarz, którego żałuję|zdjęcie, które obiegło sieć|telefon padł przed wyjściem|scrollowanie do trzeciej w nocy|algorytm, który wie za dużo|blokada od bliskiej osoby|stream dla trzech osób|mem o mnie|reklama, która czyta w myślach|prywatność sprzedana za zniżkę|stare wiadomości|filtr zamiast twarzy|zasięg, który spadł|wylogowanie na tydzień',
  technologia: 'robot w fabryce|awaria serwera|pierwszy komputer w domu|dron nad podwórkiem|sztuczny głos w słuchawce|aktualizacja, która wszystko zepsuła|hasło zapisane na kartce|proteza po wypadku|samochód, który jedzie sam|eksperyment w laboratorium|wynalazek w garażu|prąd, który zniknął|maszyna zamiast człowieka|kod, który działa przypadkiem|kamera na każdym rogu|dane, które wyciekły|prototyp przed premierą|satelita nad domem|naukowiec, którego nie słuchano|przyszłość za dziesięć lat',
  pieniadze: 'wypłata przed świętami|dług u kolegi|komornik pod drzwiami|kredyt na trzydzieści lat|kupon, który wygrał|bieda przed pierwszym|wynajem, którego nie stać|rachunek za ogrzewanie|inwestycja, która przepadła|skarbonka rozbita młotkiem|napiwek od nieznajomego|zwolnienie i kredyt|kurs waluty|premia, która zmieniła miesiąc|portfel znaleziony na ulicy|oszczędności na czarną godzinę|pierwsze własne mieszkanie|podatek i urząd|luksus na kredyt|pożyczka od rodziny',
  zakupy: 'kolejka w sklepie|ostatni bochenek chleba|promocja, która nie była promocją|reklamacja butów|paczka od kuriera|zakupy na targu|centrum handlowe w sobotę|zapomniana lista|kasjerka, która zna mnie z imienia|zwrot po dwóch tygodniach|przymierzalnia i rozmiar|bazar w niedzielę|koszyk pełen niepotrzebnych rzeczy|prezent kupiony w ostatniej chwili|paragon w kieszeni|dostawa, która nie przyszła|wyprzedaż o północy|ochroniarz i podejrzenie|stragan z owocami|cena, która zaskoczyła',
  las: 'grzybobranie o świcie|zabłądzenie w lesie|pożar lasu|ognisko na polanie|sarna na ścieżce|noc pod namiotem|szum drzew po burzy|leśniczówka na końcu drogi|jagody w lipcu|drzewo, które pamięta wojnę|strumień w dolinie|echo między sosnami|siekiera dziadka|mgła nad polaną|ślady na śniegu|sowa o północy|stary dąb na rozstaju|wyprawa z kompasem|cisza między szlakami|powrót z pełnym koszem',
  morze: 'sztorm nad Bałtykiem|spacer po plaży o świcie|bursztyn w piasku|rybak i pusta sieć|latarnia morska|molo w sezonie|pierwsza kąpiel w morzu|mewa i gofr|wakacje sprzed lat|statek na horyzoncie|nurkowanie w zimnej wodzie|opalenizna i oparzenie|kuter w porcie|zachód słońca nad wodą|muszla przywieziona do domu|deptak w sierpniu|meduzy przy brzegu|klif, który się osuwa|kotwica i pożegnanie|szum fal zamiast muzyki',
  gory: 'wschód słońca na szczycie|mgła na grani|schronisko pełne ludzi|lawina w dolinie|baca i owce|zejście po ciemku|deszcz na szlaku|termos z herbatą|ratownik z helikoptera|krzyż na przełęczy|pierwsza wspinaczka|buty, które się rozpadły|panorama z wierzchołka|potok po ulewie|zmęczenie na ostatnim odcinku|nocleg w dolinie|śnieg w czerwcu|echo w kotle|oscypek na przełęczy|góry zimą',
  pogoda: 'burza w środku nocy|upał w mieście|pierwszy śnieg|tęcza po ulewie|mgła na drodze|wichura nad dachami|powódź w małym mieście|susza i puste pola|kałuża pod oknem|prognoza, która się nie sprawdziła|grad w maju|przymrozek na kwiatach|odwilż w styczniu|parasol wywrócony przez wiatr|piorun w drzewo|rosa o poranku|duszne popołudnie|zamieć na trasie|niebo przed burzą|deszcz przez cały tydzień',
  zima: 'sylwester w Zakopanem|pierwsza jazda na nartach|kulig z pochodniami|odśnieżanie o szóstej rano|zamarznięte rury|choinka kupiona w ostatniej chwili|kolędy przy stole|prezent, który nie pasował|lód na jeziorze|bałwan przed blokiem|ferie u dziadków|mróz i wysiadający akumulator|święta bez rodziny|pierwsza gwiazdka|sopel nad wejściem|ślizgawica na chodniku|grzaniec na jarmarku|zima w mieście|opłatek i cisza|styczeń bez planów',
  lato: 'wakacje nad jeziorem|festiwal w błocie|noc spadających gwiazd|lody, które się roztopiły|komary nad namiotem|grill u sąsiada|rower o zachodzie|upalna noc bez snu|pole zboża w lipcu|pierwsza samodzielna wyprawa|hamak w ogrodzie|arbuz na plaży|burza nad jeziorem|sianokosy u dziadka|klapki zgubione w wodzie|ognisko do rana|sierpień na wsi|wakacyjna miłość|ostatni dzień wakacji|świt po całonocnej rozmowie',
  noc: 'bezsenność przed decyzją|powrót taksówką o czwartej|nocna zmiana|rozmowa do rana|koszmar, który wraca|neony w deszczu|karetka pod blokiem|papieros na balkonie o trzeciej|księżyc nad osiedlem|czuwanie przy chorym|nocny dyżur|pies wyjący w ciemności|myśli, które nie dają spać|ostatni tramwaj|świt po nieprzespanej nocy|klucze zgubione po ciemku|szept za ścianą|miasto o drugiej w nocy|zegar, który tyka za głośno|noc przed egzaminem',
  poranek: 'budzik, którego nie słyszałem|pierwsza kawa|poranny bieg|spóźniony autobus|mgła nad polami|śniadanie w pośpiechu|poniedziałek po urlopie|pies proszący o spacer|listonosz o ósmej|świt za oknem pociągu|lustro i zmęczona twarz|plan na dzień|radio z wiadomościami|zimny prysznic|ptaki przed szóstą|klucze zapomniane na stole|pierwszy dzień nowego nawyku|korek w drodze do pracy|cisza przed wstaniem domu|nowy początek o siódmej',
  zdrowie: 'diagnoza po badaniach|pierwszy trening po latach|dieta od poniedziałku|gorączka w środku nocy|rzucanie papierosów|kolejka do specjalisty|kontuzja kolana|ból pleców przy biurku|zwolnienie na tydzień|apteka po dwudziestej trzeciej|wyniki krwi|bezsenność i stres|masaż po miesiącach|herbata z miodem|szczepienie i strach przed igłą|powrót do formy|puls o poranku|nawyk, który się przyjął|waga, która nie kłamie|równowaga zamiast diety',
  szpital: 'noc na oddziale|karetka na sygnale|operacja o świcie|oczekiwanie na wynik|pierwsza kroplówka|pielęgniarka z nocnej zmiany|kwiaty od nieznajomego|izba przyjęć w piątek|dyżur bez przerwy|gips na trzy tygodnie|odwiedziny po pracy|wypis do domu|narkoza i sen|monitor z tętnem|korytarz pełen łóżek|diagnoza, która zmieniła plany|modlitwa na korytarzu|kolejka na prześwietlenie|lekarz, który powiedział prawdę|ulga po operacji',
  samochody: 'pierwszy egzamin na prawo jazdy|awaria na autostradzie|stłuczka na parkingu|mandat za dziesięć kilometrów|nocna trasa przez kraj|mechanik, który wiedział lepiej|pusty bak pod lasem|stary samochód po dziadku|deszcz i zepsute wycieraczki|holowanie o północy|muzyka na długiej trasie|garaż i weekendowe naprawy|korek przed świętami|pierwsze własne auto|wypadek, którego uniknąłem|instruktor bez cierpliwości|zjazd z autostrady|reflektory we mgle|zapach nowego wnętrza|sprzedaż auta po dziesięciu latach',
  pociagi: 'pociąg do Pragi o świcie|spóźniony pociąg o północy|przedział pełen obcych|konduktor bez litości|ostatnia przesiadka|widok z okna przez trzy godziny|dworzec o świcie|termos i kanapki|drzemka przy oknie|rozmowa ze współpasażerem|peron trzeci, tor pierwszy|walizka zostawiona w wagonie|nocny pociąg przez granicę|opóźnienie o dwie godziny|pożegnanie na peronie|bufet na dworcu|stukot kół zamiast muzyki|tunel i nagła ciemność|powrót tą samą trasą po latach|ostatni kurs w rozkładzie',
  lotnisko: 'pierwszy lot samolotem|turbulencje nad Alpami|odprawa w ostatniej chwili|zagubiony bagaż|kontrola i zdjęte buty|opóźniony odlot|pożegnanie przy bramkach|powitanie w hali przylotów|nocleg na lotnisku|samolot, który zawrócił|widok chmur z okna|stewardessa i kubek kawy|start w deszczu|celnik i pytania|wiza, której zabrakło|taksówka z lotniska|lądowanie po dwunastu godzinach|obcy kraj po wyjściu z terminalu|tablica pełna odwołanych lotów|ostatnie miejsce w samolocie',
  wies: 'żniwa w sierpniu|noc w stodole|studnia za domem|pies od sąsiada|dojenie o piątej rano|odpust w niedzielę|traktor na polnej drodze|babcia i piec chlebowy|sad pełen jabłek|błoto po deszczu|kogut zamiast budzika|kościół na wzgórzu|dziadek i jego siekiera|zima na wsi|kalosze przy drzwiach|wóz pełen siana|gwiazdy nad polami|sąsiedzka pomoc przy żniwach|chałupa, której już nie ma|powrót na wieś po latach',
  zwierzeta: 'pies ze schroniska|kot, który przyszedł sam|pierwsza jazda konna|jeż w ogrodzie|bocian na słupie|ucieczka chomika|papuga, która mówi za dużo|wilk z opowieści dziadka|pszczoły na balkonie|pająk w wannie|sarna przy drodze|pies, który czekał do końca|kaczki w parku|nietoperz na strychu|kot i zazdrość o dziecko|ryby w akwarium|mrówki w kuchni|sowa nad polem|zwierzak, który odszedł|adopcja starego psa',
  dziecinstwo: 'podwórko z trzepakiem|pierwszy rower bez bocznych kółek|wakacje u babci|kolonie i tęsknota za domem|kolano rozbite na asfalcie|bajka oglądana w kółko|szałas na drzewie|pierwsze urodziny z kolegami|zapach kredek|schowana torebka cukierków|pierwszy dzień w przedszkolu|tajemnica z podwórka|oranżada w szklanej butelce|zabawa do zmroku|klocki na dywanie|strach przed ciemnym korytarzem|album ze zdjęciami z dzieciństwa|huśtawka i lot|prezent, o którym się marzyło|ostatnie lato dzieciństwa',
  starosc: 'emerytura po czterdziestu latach pracy|ławka w parku|wnuki na weekend|tabletki w organizerze|siwizna w lustrze|opowieść powtarzana trzeci raz|wizyta, na którą się czeka|kapcie przy łóżku|ogród i róże|stary album|telefon, który dzwoni raz w tygodniu|dom spokojnej starości|zegar w pustym mieszkaniu|spacer z laską|cmentarz w listopadzie|mądrość, której nikt nie chce|zdjęcie ślubne na komodzie|choroba, o której się nie mówi|ostatnie mieszkanie|godność mimo wszystko',
  smierc: 'pogrzeb w deszczu|znicz na grobie|stypa i śmiech przez łzy|testament po dziadku|ostatnia rozmowa|pusty fotel|list znaleziony po latach|zaduszki na wsi|dzwon w małym kościele|pożegnanie w szpitalu|wieniec od nieznajomych|imię wyryte w kamieniu|sen o zmarłym|cisza w domu|czarny garnitur|spadek, który poróżnił rodzinę|ostatnie zdjęcie|listopadowy cmentarz|ulga po długiej chorobie|pamięć zamiast obecności',
  wiara: 'pierwsza komunia|spowiedź po latach|pielgrzymka na Jasną Górę|msza o świcie|utrata wiary|klasztor w górach|modlitwa przed operacją|kolęda w blokach|ministrant, który zasnął|kazanie, które trafiło|cud, w który nikt nie wierzy|post i pokusa|anioł stróż z dzieciństwa|wątpliwość w środku nocy|świeca w oknie|chór na Wielkanoc|rozmowa z księdzem|sens po stracie|medytacja o poranku|pokora po upadku',
  polityka: 'wybory w małym mieście|obietnica z plakatu|protest pod urzędem|debata w telewizji|sąsiad z innym poglądem|strajk w fabryce|podatek, który zabolał|kampania w internecie|urna i pusta karta|reforma szkolnictwa|afera na pierwszych stronach|flaga na balkonie|hymn na stadionie|granica i kolejka|propaganda w wiadomościach|obywatel bez głosu|marsz przez centrum|budżet i puste obietnice|spór przy rodzinnym stole|historia pisana od nowa',
  policja: 'nocny patrol|mandat za przejście na czerwonym|włamanie do mieszkania|przesłuchanie o świcie|świadek, który zmienił zeznania|pościg ulicami miasta|areszt na dobę|adwokat z urzędu|wyrok w zawieszeniu|monitoring, który nagrał wszystko|złodziej z sąsiedztwa|alibi bez pokrycia|akta sprzed dwudziestu lat|detektyw i zimna sprawa|krata i pierwsza noc|kajdanki przy sąsiadach|ślad, który wszystko zmienił|kradzież roweru|sąd i cztery godziny czekania|wolność po trzech latach',
  wojna: 'list z frontu|ewakuacja o świcie|schron pod szkołą|żołnierz, który wrócił inny|matka czekająca na wieści|walizka spakowana w pięć minut|granica pełna uchodźców|rozkaz, którego nie wykonał|ruiny rodzinnego miasta|pierwszy alarm|zdjęcie w kieszeni munduru|pokój podpisany za późno|bohater z przypadku|głód w oblężonym mieście|pociąg pełen dzieci|cmentarz wojenny|dziadek, który nie opowiadał|ostatnia noc przed atakiem|pamięć po siedemdziesięciu latach|dom, do którego nie ma powrotu',
  kosmos: 'pierwszy człowiek na Marsie|start rakiety|cisza w próżni|awaria na stacji kosmicznej|widok Ziemi z orbity|sygnał z głębokiego kosmosu|astronauta tęskniący za domem|spacer kosmiczny|teleskop w górach|kometa raz na sto lat|kolonia na Księżycu|odliczanie do startu|meteoryt nad miastem|samotność w kapsule|czarna dziura w opowieści|sonda, która przestała nadawać|nieważkość i pierwsza noc|pierścienie Saturna|obserwatorium nad ranem|powrót po roku na orbicie',
  magia: 'zaklęcie, które zadziałało za dobrze|wiedźma z sąsiedniej wsi|miecz w kamieniu|smok nad doliną|klątwa rodu|portal w piwnicy|przepowiednia wyroczni|amulet po babci|pełnia i wilkołak|księga w zakazanym języku|rycerz bez zbroi|eliksir wypity przez pomyłkę|zamek, w którym nikt nie mieszka|elf w ludzkim mieście|duch w starym młynie|skarb pod dębem|mag, który stracił moc|kruk przynoszący wieści|mgła nad bagnami|legenda opowiadana przy ogniu',
  sztuka: 'pierwsza wystawa|obraz sprzedany za bezcen|natchnienie o trzeciej w nocy|krytyk na wernisażu|portret nieznajomej|glina pod paznokciami|wiersz napisany na serwetce|muza, która odeszła|pusta galeria|aukcja i szalona cena|szkic znaleziony po latach|rzeźba, która pękła|poeta bez wydawcy|kolor, którego nie da się nazwać|biblioteka o zmierzchu|rozdział, który nie chce się napisać|marmur i cierpliwość|podpis na dole płótna|muzeum w poniedziałek|sztuka, której nikt nie rozumie',
  impreza: 'urodziny, które wymknęły się spod kontroli|kolejka przed klubem|dj, który uratował wieczór|pierwszy shot|taniec do rana|numer zapisany na dłoni|kac w niedzielę|rachunek za wszystkich|zdjęcia, których nie chcę widzieć|bramkarz i zły humor|after u kolegi|toast za starych znajomych|palarnia i szczera rozmowa|taksówka o piątej|zgubiona kurtka w szatni|muzyka za głośna na rozmowę|impreza, na której nikogo nie znałem|powrót pieszo przez miasto|konfetti na podłodze|ostatni gość',
  nalogi: 'pierwszy papieros|obietnica rzucenia od poniedziałku|butelka schowana w szafie|mityng w piwnicy kościoła|licznik dni bez picia|nawrót po roku|automat w barze|kłamstwo przed rodziną|noc bez snu i drżenie rąk|terapia grupowa|przyjaciel, który zauważył|telefon zamiast ludzi|dno i pierwszy krok|ojciec, który pił|odwyk w zimie|pokusa na weselu|wstyd po weekendzie|kupon zamiast wypłaty|trzy lata bez alkoholu|rozmowa, która uratowała',
  marzenia: 'plan zapisany w notesie|pierwszy krok po latach zwlekania|wymarzony dom|scena, o której się śniło|firma założona w kuchni|ryzyko rzucenia etatu|trening o piątej rano|lista celów na nowy rok|marzenie z dzieciństwa|odwaga po trzydziestce|dyplom na ścianie|podróż odkładana dziesięć lat|pomysł, który nie dawał spać|zmiana, która się udała|cierpliwość zamiast pośpiechu|szczyt po latach wspinaczki|wdzięczność na końcu drogi|iskra po długiej przerwie|pierwszy klient|sens znaleziony po czasie',
  porazka: 'oblany egzamin|odrzucona aplikacja|firma, która upadła|występ, który poszedł źle|długi po nieudanym pomyśle|rozmowa kończąca współpracę|publiczność, która wygwizdała|błąd kosztujący wszystko|powrót do rodzinnego domu po porażce|wstyd przed swoimi|drugie podejście|list z odmową|pytanie dlaczego o trzeciej w nocy|lekcja wyciągnięta za późno|upadek na oczach wszystkich|pokora po pysze|wsparcie, gdy wszystko runęło|blizna, która została|dno i pierwszy oddech|start od zera',
  samotnosc: 'samotność w wielkim mieście|kolacja dla jednego|święta bez nikogo|urodziny bez telefonu|ławka w parku i obcy ludzie|mieszkanie pełne ciszy|rozmowa z psem|kawiarnia i książka|pierwszy tydzień po przeprowadzce|tłum, w którym nikt nie zna twojego imienia|wieczór z filmem i kocem|dziennik zamiast rozmowy|sąsiad, którego nigdy nie poznałem|spacer po zmroku|wiadomość wysłana i bez odpowiedzi|tort z jedną świeczką|spokój, który przyszedł po samotności|okno naprzeciwko|siła znaleziona w ciszy|powrót do ludzi',
};

export type StoryTopic = { text: string; category: CategoryId };

export const CATEGORY_IDS = Object.keys(CATEGORY_WORDS) as CategoryId[];

const WORDS: Record<CategoryId, string[]> = Object.fromEntries(
  CATEGORY_IDS.map((id) => [id, CATEGORY_WORDS[id].split(' ')]),
) as Record<CategoryId, string[]>;

export const STORY_TOPICS: readonly StoryTopic[] = CATEGORY_IDS.flatMap((category) =>
  CATEGORY_TOPICS[category].split('|').map((text) => ({ text, category })),
);

const BY_TEXT = new Map(STORY_TOPICS.map((t) => [t.text.toLowerCase(), t]));

const STOPWORDS = new Set([
  'który', 'która', 'które', 'którego', 'której', 'żeby', 'przez', 'przed', 'nad',
  'pod', 'bez', 'przy', 'dla', 'jest', 'było', 'ktoś', 'coś', 'tego', 'tym', 'moja',
  'mojego', 'jego', 'jej', 'nie', 'się', 'jak', 'już', 'tylko', 'jeszcze',
]);

/** Crude Polish stem: enough to match "pociągu" with "pociąg". */
export function stem(word: string): string {
  return word.toLowerCase().replace(/[^a-ząćęłńóśźż]/g, '').slice(0, 5);
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-ząćęłńóśźż]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

/** The topic as written, if it comes from our list. */
export function findTopic(text: string): StoryTopic | undefined {
  return BY_TEXT.get(text.trim().toLowerCase());
}

/**
 * Best-effort category for anything the user typed themselves: score every
 * category by how many of its words (or its own topic phrases) share a stem
 * with the text, and take the winner. Returns null when nothing matches.
 */
function guessCategory(text: string): CategoryId | null {
  const stems = new Set(tokens(text).map(stem));
  if (stems.size === 0) return null;

  let best: CategoryId | null = null;
  let bestScore = 0;
  for (const id of CATEGORY_IDS) {
    let score = 0;
    for (const w of WORDS[id]) if (stems.has(stem(w))) score += 2;
    for (const t of CATEGORY_TOPICS[id].split('|')) {
      for (const w of tokens(t)) if (stems.has(stem(w))) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return bestScore > 0 ? best : null;
}

/** ~45 words in the same world as the topic. Empty when we can't place it. */
export function topicWords(text: string): string[] {
  const known = findTopic(text);
  const category = known?.category ?? guessCategory(text);
  return category ? WORDS[category] : [];
}

export function randomTopic(): StoryTopic {
  return STORY_TOPICS[Math.floor(Math.random() * STORY_TOPICS.length)];
}

export function randomTopics(count: number): StoryTopic[] {
  const out: StoryTopic[] = [];
  const seen = new Set<string>();
  while (out.length < count && seen.size < STORY_TOPICS.length) {
    const t = randomTopic();
    if (seen.has(t.text)) continue;
    seen.add(t.text);
    out.push(t);
  }
  return out;
}

/** Nazwy kategorii do pokazania — te same tematy widzi Historia, Pałac i Łańcuch. */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  dom: 'Dom', kuchnia: 'Kuchnia', miasto: 'Miasto', podroze: 'Podróże', praca: 'Praca',
  szkola: 'Szkoła', milosc: 'Miłość', rodzina: 'Rodzina', przyjazn: 'Przyjaźń',
  smutek: 'Smutek', radosc: 'Radość', zlosc: 'Złość', strach: 'Strach', sport: 'Sport',
  muzyka: 'Muzyka', film: 'Film', internet: 'Internet', technologia: 'Technologia',
  pieniadze: 'Pieniądze', zakupy: 'Zakupy', las: 'Las', morze: 'Morze', gory: 'Góry',
  pogoda: 'Pogoda', zima: 'Zima', lato: 'Lato', noc: 'Noc', poranek: 'Poranek',
  zdrowie: 'Zdrowie', szpital: 'Szpital', samochody: 'Samochody', pociagi: 'Pociągi',
  lotnisko: 'Lotnisko', wies: 'Wieś', zwierzeta: 'Zwierzęta', dziecinstwo: 'Dzieciństwo',
  starosc: 'Starość', smierc: 'Śmierć', wiara: 'Wiara', polityka: 'Polityka',
  policja: 'Policja', wojna: 'Wojna', kosmos: 'Kosmos', magia: 'Magia', sztuka: 'Sztuka',
  impreza: 'Impreza', nalogi: 'Nałogi', marzenia: 'Marzenia', porazka: 'Porażka',
  samotnosc: 'Samotność',
};

/** Etykieta kategorii; nieznane id zwracamy bez zmian. */
export function categoryLabel(id: string): string {
  return CATEGORY_LABELS[id as CategoryId] ?? id;
}

/** Wszystkie słowa z jednej kategorii — używają ich też tryby „Pałac" i „Łańcuch". */
export function categoryWords(id: CategoryId): string[] {
  return WORDS[id];
}
