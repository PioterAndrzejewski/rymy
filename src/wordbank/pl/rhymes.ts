// Słownik rymów dla trybu „Wypluj się z rymów".
//
// Osobny od banku poziomów (level-*.json): tam słowa są dobierane pod cue,
// tutaj chodzi o głębię jednej rodziny rymów — żeby po rundzie było co pokazać.
// Format: jeden string na końcówkę, słowa rozdzielone spacją.

const RHYME_WORDS: Record<string, string> = {
  'ość': 'agresywność aktualność aktywność barwność bezbarwność bezczelność bezstronność bezużyteczność biegłość bierność bliskość błyskotliwość brutalność bystrość całość chciwość chorobliwość chytrość ciekawość cielesność ciemność cierpliwość częstotliwość czułość czystość dbałość delikatność długość dojrzałość dokładność domyślność donośność dostępność dowcipność duchowość dwulicowość dziwność elastyczność fałszywość giętkość gładkość głębokość głośność godność gorliwość gospodarność gotowość grubość grzeczność grzeszność gwałtowność hałaśliwość hardość hojność ilość jakość jaskrawość jasność kłamliwość konieczność konkretność kruchość lekkomyślność lekkość litość łagodność łatwość mądrość mglistość miękkość miłość młodość możliwość mściwość naiwność namiętność nerwowość niedbałość niegrzeczność niemożliwość nieobecność nieprzytomność nierealność nieświadomość nietrwałość nieważność niezależność niezwykłość nikczemność normalność nowość obecność obojętność obowiązkowość oczywistość odległość odporność ogólnikowość ospałość ostrość ostrożność oszczędność otwartość oziębłość pewność płynność płytkość podłość pojemność pomocność porywczość powierzchowność powszechność pracowitość prawdomówność prawość prostolinijność próżność przebiegłość przeszłość przezorność przydatność przyjemność przykrość przyszłość przytomność punktualność radosność radość realność rozrzutność roztropność ruchliwość rzadkość rzeczowość rzeczywistość rzetelność samotność schludność serdeczność skromność skuteczność słabość słodkość solidność spokojność sprawiedliwość sprawność srogość stanowczość staranność starość stronniczość sumienność surowość szarość szczelność szczerość szerokość szlachetność szorstkość sztywność śmiałość śmieszność świadomość świeżość świętość tajemniczość tchórzliwość teraźniejszość terminowość troskliwość trudność trwałość twardość uczciwość uczuciowość umiejętność uprzejmość uważność użyteczność wartość ważność wdzięczność wesołość wierność witalność wolność wrażliwość wściekłość wydajność wyjątkowość wyniosłość wyrazistość wyrozumiałość wysokość wytrwałość wytrzymałość zachłanność zaciekłość zależność zapalczywość zapobiegliwość zaradność zawiłość zawziętość zazdrość zdolność zdrowotność złożoność zmysłowość zuchwałość zwyczajność życzliwość żywotność',
  'anie': 'badanie bieganie budowanie bujanie całowanie celowanie chowanie chrapanie chwytanie chybianie czekanie czesanie czytanie danie dorzucanie dotrzymywanie drukowanie dyskutowanie dźwiganie finiszowanie gadanie gotowanie granie gwizdanie hamowanie holowanie huśtanie improwizowanie kichanie kiwanie klaskanie klękanie kochanie kołysanie komponowanie kopanie kopiowanie kupowanie latanie ładowanie łamanie łapanie machanie malowanie mieszanie mieszkanie mijanie miksowanie mruganie nagrywanie naprawianie narzekanie narzucanie notowanie obejmowanie obiecywanie oddalanie oddawanie oddychanie odejmowanie odmawianie odpinanie odpoczywanie odtwarzanie odwiedzanie oglądanie oklaskiwanie opowiadanie opuszczanie otwieranie pakowanie pamiętanie parkowanie pchanie pilnowanie pisanie planowanie płakanie pływanie podkreślanie podlewanie podróżowanie podrzucanie pokazywanie porządkowanie potrząsanie pożyczanie pranie prasowanie próbowanie przegrywanie przesuwanie przyglądanie przyjmowanie przyspieszanie przytulanie pukanie puszczanie pytanie rachowanie ratowanie rąbanie rozbieranie rozdawanie rozdzielanie rozklejanie rozładowywanie rozmawianie rozpalanie rozwiązywanie rysowanie ryzykowanie rzucanie siadanie skakanie skanowanie sklejanie słuchanie sortowanie spacerowanie spajanie spanie spotykanie sprawdzanie sprzątanie sprzedawanie stanie startowanie stawianie strzelanie sumowanie szeptanie szukanie ściganie ścinanie śniadanie śpiewanie tankowanie testowanie trafianie trenowanie trzymanie tupanie ubieranie ubranie uciekanie układanie wdychanie wiązanie wirowanie witanie wklejanie wołanie wpatrywanie wracanie wrzucanie wspominanie wstawanie wybieranie wyglądanie wygrywanie wygwizdywanie wyjaśnianie wymazywanie wypoczywanie wypożyczanie wyprzedzanie wyrzucanie występowanie wzdychanie zaczynanie zaglądanie zakładanie zamykanie zapinanie zapisywanie zapominanie zapraszanie zaznaczanie zbieranie zbliżanie zdanie zdejmowanie zgadzanie ziewanie zmywanie znajdowanie zrywanie zrzucanie zwalnianie zwiedzanie zwracanie żartowanie żegnanie',
  'enie': 'budzenie burzenie chłodzenie chodzenie chwalenie cierpienie ćwiczenie doświadczenie duszenie dzielenie ganienie gaszenie gniecenie golenie karmienie kiszenie klejenie kładzenie kruszenie krzyczenie kwaszenie leczenie lepienie leżenie liczenie łączenie marzenie miażdżenie mielenie mierzenie milczenie mnożenie mówienie mrożenie myślenie niszczenie noszenie nudzenie oczyszczenie odliczenie odnowienie odróżnienie ogłoszenie określenie omówienie opóźnienie orzeczenie ostrzenie ostrzeżenie oświadczenie oświetlenie oznaczenie ożywienie palenie parzenie pieczenie podnoszenie pojenie połączenie położenie pomieszczenie porozumienie poruszenie postanowienie poświęcenie powiedzenie powiększenie powodzenie pozwolenie pragnienie proszenie prześwietlenie przybliżenie przypomnienie przyrzeczenie przyspieszenie robienie rozliczenie rozłączenie rozmieszczenie rozmnożenie rozproszenie rozróżnienie rozświetlenie sadzenie skupienie słodzenie słyszenie smażenie solenie spalenie spełnienie spojrzenie studzenie stwierdzenie suszenie szkolenie tępienie tłumaczenie topienie tuczenie tworzenie ubezpieczenie uczczenie uczenie uderzenie ukojenie ukończenie ulepszenie umieszczenie uniesienie uproszczenie urodzenie uspokojenie ustalenie ustawienie uszkodzenie utrudnienie uwolnienie uzupełnienie warzenie ważenie westchnienie wędzenie widzenie wiercenie wierzenie wnoszenie wrażenie wręczenie wspomnienie wtrącenie wybaczenie wyciszenie wydarzenie wygaszenie wyjaśnienie wykluczenie wykończenie wykroczenie wyleczenie wyliczenie wymierzenie wymówienie wynagrodzenie wyobrażenie wypełnienie wyposażenie wyrażenie wyróżnienie wyświetlenie wytłumaczenie wzmocnienie wzruszenie zabezpieczenie zadowolenie zagrożenie zakażenie zakończenie założenie zamówienie zanieczyszczenie zaokrąglenie zapalenie zapewnienie zapomnienie zaproszenie zaskoczenie zastanowienie zastąpienie zaświadczenie zatrudnienie zawieszenie zbliżenie zdarzenie zdziwienie zgłoszenie zgromadzenie zjednoczenie złagodzenie złączenie zmartwienie zmęczenie zmniejszenie zmuszenie znaczenie zniechęcenie zniszczenie znoszenie znudzenie znużenie zwątpienie zwiększenie zwolnienie żywienie',
  'acja': 'aplikacja edukacja generacja gradacja gratulacja identyfikacja iluminacja imitacja implementacja improwizacja inauguracja indoktrynacja inflacja informacja inicjacja innowacja inspiracja instalacja integracja interpretacja intonacja irygacja izolacja kalkulacja kombinacja kompensacja kompilacja komplikacja komunikacja koncentracja kondensacja konfiguracja konfrontacja koniugacja konsolidacja konsultacja kontemplacja kooperacja koordynacja korelacja kreacja kremacja kultywacja kwalifikacja kwotacja legalizacja legitymacja likwidacja limitacja lokalizacja manifestacja manipulacja medytacja migracja moderacja modernizacja modyfikacja motywacja nawigacja negacja nominacja normalizacja notacja nowelizacja obserwacja okupacja operacja optymalizacja oracja organizacja orientacja oscylacja owacja penetracja perforacja personalizacja plantacja polaryzacja populacja prezentacja prowokacja publikacja racja radiacja realizacja recytacja reformacja regulacja rehabilitacja reinkarnacja rejestracja reklamacja rekomendacja rekrutacja relacja relaksacja renowacja reprezentacja reputacja restauracja rezerwacja rezygnacja rotacja sanacja segregacja sensacja separacja socjalizacja specjalizacja specyfikacja spekulacja stabilizacja stacja stagnacja standaryzacja sterylizacja stymulacja symulacja synchronizacja systematyzacja sytuacja tabulacja transformacja translacja transplantacja uzurpacja wakacja walidacja wariacja wegetacja wentylacja weryfikacja wibracja windykacja wizualizacja wizytacja',
  'ek': 'bębenek brzeżek brzuszek budynek chlebek człowiek czubek czwartek daszek dodatek dołek domek dymek dzbanek dzbanuszek dzwonek ganek garnek garnuszek grzybek guzek kabelek kamyczek kawałek kieliszek kierunek klocek kołek kominek koniuszek korzonek koszyczek kotek krzaczek kubek kwiatek kwiatuszek listeczek listek majątek malunek meldunek młotek mostek nieporządek nosek numerek obrazek ogonek ogórek okruszek ołówek orzeszek pagórek paluszek papierek patyczek piasek piątek piesek placek płotek pocałunek początek podarunek podatek pomidorek poranek porządek proszek przypadek ptaszek pyłek rachunek ranek ratunek rondelek rowerek rymek rysunek schodek serek skrawek słoiczek smyczek soczek spadek statek stołek strzępek supełek szacunek sznurek środek trunek uczynek upadek uszek węgielek węzełek wiaterek wieczorek wierzchołek worek wtorek wyjątek wypadek wzgórek zadatek zamek ząbek znaczek żołądek żwirek',
  'ka': 'aktorka alejka altanka apaszka aptekarka bańka beczka biegaczka bluzka bombka bramka bransoletka broszka budka butelka chmurka choinka chusteczka ciotka czapka deskorolka dolinka drabinka dróżka dziennikarka dziewczynka ekspedientka filiżanka fotka fotografka fryzjerka furtka gazetka górka gumka gwiazdka huśtawka kamizelka kartka kasetka kasjerka kelnerka klamerka klatka klientka kokardka koleżanka kopertówka koronka koszulka kredka kropelka książka kucharka kulka kurtka lalka lampka lekarka linijka ławeczka łączka łódka łyżka malarka marynarka mgiełka modelka monetka motorówka muszelka narciarka nauczycielka nitka opaska paczka pasażerka perełka pielęgniarka piłka piosenkarka pisarka piżamka pływaczka pocztówka podróżniczka poetka polanka policjantka półka prawniczka projektantka przepaska przewodniczka przyjaciółka puszka rakietka ramka rękawiczka rolka rowerzystka rybka rzeczka sąsiadka sekretarka siatka siostrzyczka skakanka skałka skarpetka skrzynka spinka sportsmenka strażaczka strużka studentka sukienka szafka szkatułka szklanka szpulka ścieżka tancerka teczka temperówka tłumaczka torebka turystka uliczka ulotka urzędniczka walizka wędka wiosenka wizytówka wnuczka wrotka wstążka zabawka zawieszka żaglówka',
  'nik': 'bezpiecznik celnik chłodnik cukiernik czajnik czeladnik dłużnik dziennik gołębnik górnik grzejnik grzesznik hurtownik kierownik klucznik kurnik latarnik leśnik licznik łącznik męczennik miesięcznik modlitewnik naczelnik najemnik napastnik następnik notatnik ogrodnik pamiętnik płatnik podatnik podręcznik podróżnik pojemnik pomocnik poprzednik poradnik pracownik prawnik przeciwnik przełącznik przewodnik pustelnik ratownik robotnik rocznik rolnik rytownik rzecznik rzemieślnik rzeźnik skarbnik słownik sojusznik sternik strażnik śmietnik śpiewnik taternik technik tygodnik uczestnik urzędnik wędrownik włącznik wojownik wskaźnik współpracownik wyłącznik zakonnik zawodnik zbiornik zwolennik',
  'arz': 'aptekarz bajarz bednarz betoniarz bibliotekarz blacharz bramkarz brukarz bursztyniarz cmentarz dekarz drukarz dziennikarz farbiarz garbarz garncarz gawędziarz gołębiarz gorzelarz gospodarz grabarz kalendarz kamieniarz kolarz kolejarz kominiarz koniarz koszykarz kotlarz księgarz kucharz kwiaciarz lekarz ludwisarz łyżwiarz malarz marynarz masarz mleczarz młynarz modelarz murarz narciarz owczarz owocarz parkieciarz piekarz piłkarz pisarz posadzkarz pszczelarz puszkarz rusznikarz rymarz rzeźbiarz siatkarz siodlarz stolarz szklarz ślusarz taksówkarz tokarz tramwajarz tynkarz wędliniarz winiarz włodarz zabawkarz zbrojarz zielarz żeglarz',
  'owy': 'atomowy autobusowy balkonowy bananowy bankowy beżowy bitowy blokowy bordowy brzoskwiniowy budżetowy burzowy cebulowy cenowy chmurowy chwilowy cukrowy cyfrowy cytrynowy czekoladowy czosnkowy dachowy deszczowy domowy drogowy drzwiowy dyniowy ekranowy etapowy festiwalowy fiołkowy fotelowy garażowy gazowy głośnikowy godzinowy gotówkowy gruszkowy grzybowy gumowy guzikowy handlowy internetowy jabłkowy jagodowy jądrowy kablowy kanapowy kartonowy klawiszowy klipowy klubowy kolejowy kominowy komputerowy koncertowy korytarzowy kredytowy kremowy krzyżowy księżycowy kwadratowy kwiatowy lampowy laserowy liliowy liniowy lodowy łazienkowy łąkowy łóżkowy makowy malinowy meblowy metalowy mieszkaniowy migdałowy mikrofonowy miodowy morelowy mostowy odcinkowy ogórkowy ogrodowy olejowy oliwkowy orzechowy osiedlowy owocowy paliwowy papierowy parkowy piaskowy pieprzowy pionowy plastikowy plażowy płytowy podatkowy podłogowy pokojowy polowy pomarańczowy pomidorowy poziomowy półkowy prądowy programowy punktowy rakietowy refrenowy rowerowy różowy rymowy rynkowy samochodowy serwerowy sieciowy singlowy słonecznikowy słuchawkowy służbowy sportowy sprzętowy stalowy stołowy stożkowy strychowy sufitowy systemowy szkieletowy śliwkowy śniegowy tekstowy tekturowy tramwajowy trasowy truskawkowy tunelowy tygodniowy walcowy waniliowy warstwowy wersowy węglowy wiatrowy wiekowy wiśniowy zimowy ziołowy zwrotkowy',
  'ony': 'broniony ceniony chroniony doceniony duszony dzielony gaszony karmiony kwaszony leczony lubiony mrożony nachylony nagłośniony nagrodzony nakręcony narzucony nauczony obniżony obudzony obwiniony odkręcony odmieniony ogłoszony ograniczony onieśmielony oskarżony ośmielony ośmieszony oświetlony otworzony ożywiony palony parzony pieczony pochylony pocieszony podłączony podniesiony podwyższony podzielony połączony położony pomniejszony poniżony poruszony postawiony powiększony proszony przechylony przedłużony przekrzywiony przerażony przestawiony przetłumaczony przyciszony przyćmiony przykręcony przyniesiony przyuczony rozbudzony rozdzielony rozgrzeszony rozjaśniony rozkręcony rozłączony rozłożony rozproszony rozszerzony rozświetlony rozzłoszczony skończony skręcony skrócony skupiony słodzony smażony solony strudzony stworzony suszony uchylony ucieszony uciszony uczony ukojony ukręcony ułożony upokorzony uproszczony uspokojony ustawiony uśpiony wędzony wkręcony włączony wrzucony wyciszony wydłużony wyjaśniony wykrzywiony wyłączony wymieniony wynagrodzony wyniesiony wyproszony wyrzucony wytłumaczony wytworzony wyuczony wywyższony wzruszony zachęcony zachwycony zaciemniony zakręcony zakrzywiony zamieniony zaniepokojony zaniesiony zaproszony zarzucony zaskoczony zasłużony zaszczycony zawiedziony zawstydzony zbudzony zburzony zdziwiony zgłoszony zgromadzony zgubiony zjednoczony złożony zmartwiony zmęczony zmieniony zmniejszony znaleziony zniechęcony zniszczony znudzony zrobiony zwiększony żywiony',
  'ać': 'badać brać bujać chrapać chwytać czekać czytać dać deptać dostać drukować gadać grać gwizdać huśtać kichać kiwać klaskać kochać kołysać kopać kopiować lać latać łamać łapać machać mieszać mijać mrugać nagrywać naprawiać narzekać notować obiecywać oddać oddychać odmawiać odwiedzać otwierać pchać pilnować płakać podać podlewać prać przegrywać przestać pukać puszczać pytać ratować rąbać rwać rzucać siać siadać skakać spać spotykać sprawdzać sprzedać stać stawiać szeptać szukać ścinać śpiewać trzymać tupać ubierać uciekać wiać wirować witać wracać wspominać wstać wybierać wydać wyglądać wygrywać zaczynać zaglądać zakładać zamiatać zamykać zapominać zapraszać zbierać zdać ziewać znać zostać zrywać zwracać',
  'owa': 'atomowa autobusowa balkonowa bananowa bitowa blokowa budowa bukowa burzowa chwilowa cukrowa cyfrowa cytrynowa dachowa deszczowa dębowa domowa drogowa drzwiowa ekranowa festiwalowa fiołkowa fotelowa garażowa gazowa głośnikowa głowa godzinowa gotowa gruszkowa gumowa guzikowa internetowa jabłkowa jądrowa kablowa kanapowa klawiszowa klipowa klubowa kolejowa kolorowa kominowa komputerowa koncertowa korytarzowa królowa krzyżowa księżycowa kwadratowa kwiatowa lampowa laserowa liliowa liniowa lipowa lodowa łąkowa łóżkowa makowa meblowa metalowa mieszkaniowa mikrofonowa miodowa mostowa mowa namowa nowa odnowa ogrodowa olejowa osiedlowa paliwowa papierowa parkowa pionowa plażowa płytowa podkowa podłogowa pokojowa polowa połowa poziomowa półkowa prądowa punktowa rakietowa refrenowa rowerowa rozmowa różowa rymowa samochodowa sieciowa singlowa słuchawkowa sosnowa sportowa stalowa sufitowa surowa śliwkowa śniegowa tekstowa tramwajowa trasowa tunelowa tygodniowa umowa warstwowa wersowa węglowa wiatrowa wiekowa wierzbowa wiśniowa wymowa zdrowa ziołowa zwrotkowa',
  'ami': 'barwami bębnami bitami chmurami cieniami czasami dachami deszczami długopisami dniami domami drogami drzewami drzwiami dźwiękami falami filmami fletami gitarami głosami głośnikami górami gwiazdami kablami klawiszami kolanami kolorami kominami krokami krzesłami krzykami książkami księżycami kwiatami lasami latami łąkami łóżkami łzami marzeniami miesiącami mikrofonami morzami mostami myślami nocami nogami obrazami oczami oknami palcami piętrami piosenkami placami plecami pokojami polami półkami ramionami refrenami rękami rymami rzekami sami schodami sercami skrzypcami słowami stołami stopami strunami szafami szeptami ścianami ścieżkami śniegami światłami tekstami trąbkami tygodniami ulicami ustami wersami wiatrami wiekami włosami wspomnieniami zdjęciami zeszytami zwrotkami',
  'ego': 'białego biednego bliskiego bogatego brudnego brzydkiego całego cichego ciemnego cienkiego ciepłego ciężkiego czarnego czerwonego czystego dalekiego długiego dobrego drogiego drugiego dziwnego fałszywego głośnego głupiego gorącego grubego innego jakiego jasnego jednego jego każdego krótkiego którego lekkiego ładnego łatwego małego mądrego młodego mocnego mojego mokrego możliwego nerwowego niczego niebieskiego niedobrego niemałego niewielkiego niskiego nowego obcego ostatniego pełnego pewnego pierwszego prawdziwego pustego samego słabego smutnego spokojnego starego suchego swojego szerokiego szybkiego świeżego takiego taniego tego trudnego trzeciego twojego ważnego wąskiego wesołego wielkiego własnego wolnego wspólnego wszystkiego wysokiego zielonego zimnego złego znanego zwykłego żadnego żółtego',
  'ina': 'baranina bieganina brzezina chałupina chudzina chwilina cielęcina dębina dolina drabina drobina dziedzina gadanina gęsina glina głębina godzina jagnięcina kalina kobiecina kotlina kraina krzątanina krzewina lawina łupina malina mieszanina nizina nowina odrobina osina plątanina psina rodzina roślina równina ruina słonina starowina szczelina ślina tkanina trzcina wieprzowina wiklina wina witamina wołowina',
  'ał': 'badał brał bujał chrapał chwytał czekał czytał dał deptał dostał drukował finał gadał grał gwizdał huśtał kanał kichał kiwał klaskał kochał kołysał kopał lał latał łamał łapał machał materiał mieszał mijał mrugał nagrywał naprawiał narzekał notował obiecywał oddał oddychał oddział odmawiał odwiedzał otwierał pchał pilnował płakał podał podlewał podział prał przegrywał przestał pukał puszczał pytał ratował rąbał rwał rzucał siadał siał skakał spał spotykał sprawdzał sprzedał stał stawiał sygnał szał szeptał szukał ścinał śpiewał trzymał tupał ubierał uciekał udział upał wiał wirował witał wracał wspominał wstał wybierał wydał wyglądał wygrywał wystrzał zaczynał zaglądał zakładał zamiatał zamykał zapał zapominał zapraszał zbierał zdał ziewał znał został zrywał zwracał',
  'ała': 'badała biała brała cała chrapała chwała chwytała czekała czytała dała deptała dojrzała doskonała dostała gadała grała kichała kiwała kochała kopała lała latała łamała łapała machała mała mieszała mijała mrugała naprawiała narzekała nieśmiała obiecywała oddała oddychała odmawiała odwiedzała otwierała pchała pilnowała płakała pochwała podała podlewała prała przegrywała przestała pukała puszczała pytała ratowała rąbała rwała rzucała siadała siała skakała skała spała spotykała sprawdzała sprzedała stała stawiała szeptała szukała ścinała śmiała śpiewała trzymała ubierała uciekała wiała witała wracała wspaniała wspominała wstała wybierała wydała wyglądała wygrywała zaczynała zaglądała zakładała zamiatała zamykała zapominała zapraszała zbierała zdała ziewała znała została zrywała zwracała',
  'cie': 'bicie bycie ciągnięcie dobicie dotknięcie drgnięcie kłucie kopnięcie krycie machnięcie mrugnięcie mycie nabicie nawinięcie objęcie odbicie odczucie odkrycie odwinięcie osiągnięcie otwarcie owinięcie pchnięcie picie pobicie pociągnięcie poczęcie poczucie podjęcie przebicie przeczucie przyjęcie przykrycie rozbicie rozwinięcie skinięcie starcie szycie tchnięcie tycie ubicie uczucie ujęcie ukrycie uśmiechnięcie westchnięcie wybicie wycie wyczucie wyjęcie wynajęcie wzięcie zabicie zajęcie zamknięcie zdarcie zdjęcie zerknięcie zniknięcie zwinięcie życie',
};

export type RhymeEnding = string;

/** Endings we consider deep enough to drill for a few minutes. */
export const RHYME_ENDINGS: RhymeEnding[] = Object.keys(RHYME_WORDS)
  .sort((a, b) => a.localeCompare(b, 'pl'));

/**
 * Słowa podstawowe — słowa powiązane z miłością i emocjami, których używamy
 * jako seed w trybie „Słowa podstawowe". Zamiast losowych słów z ogólnej puli
 * ćwiczysz rymy do słów, które naprawdę pojawiają się w piosenkach.
 */
export const BASIC_SONG_WORDS: ReadonlyArray<{ word: string; ending: string }> = [
  // -ość: uczucia i stany
  { word: 'miłość',      ending: 'ość' },
  { word: 'złość',       ending: 'ość' },
  { word: 'czułość',     ending: 'ość' },
  { word: 'radość',      ending: 'ość' },
  { word: 'samotność',   ending: 'ość' },
  { word: 'bliskość',    ending: 'ość' },
  { word: 'wolność',     ending: 'ość' },
  { word: 'wierność',    ending: 'ość' },
  { word: 'namiętność',  ending: 'ość' },
  { word: 'zazdrość',    ending: 'ość' },
  { word: 'wrażliwość',  ending: 'ość' },
  { word: 'wieczność',   ending: 'ość' },
  // -anie: działania i stany emocjonalne
  { word: 'kochanie',    ending: 'anie' },
  { word: 'wołanie',     ending: 'anie' },
  { word: 'śpiewanie',   ending: 'anie' },
  { word: 'płakanie',    ending: 'anie' },
  { word: 'czekanie',    ending: 'anie' },
  { word: 'całowanie',   ending: 'anie' },
  { word: 'szeptanie',   ending: 'anie' },
  { word: 'wspominanie', ending: 'anie' },
  { word: 'żegnanie',    ending: 'anie' },
  { word: 'trzymanie',   ending: 'anie' },
  { word: 'wzdychanie',  ending: 'anie' },
  { word: 'zakochanie',  ending: 'anie' },
  // -enie: uczucia i doświadczenia
  { word: 'pragnienie',  ending: 'enie' },
  { word: 'marzenie',    ending: 'enie' },
  { word: 'westchnienie', ending: 'enie' },
  { word: 'wspomnienie', ending: 'enie' },
  { word: 'spełnienie',  ending: 'enie' },
  { word: 'wzruszenie',  ending: 'enie' },
  { word: 'milczenie',   ending: 'enie' },
  { word: 'uniesienie',  ending: 'enie' },
  { word: 'cierpienie',  ending: 'enie' },
  { word: 'zauroczenie', ending: 'enie' },
  { word: 'przebudzenie', ending: 'enie' },
  // -ać: bezokoliczniki emocji
  { word: 'kochać',      ending: 'ać' },
  { word: 'śpiewać',     ending: 'ać' },
  { word: 'płakać',      ending: 'ać' },
  { word: 'czekać',      ending: 'ać' },
  { word: 'szeptać',     ending: 'ać' },
  { word: 'wracać',      ending: 'ać' },
  { word: 'żegnać',      ending: 'ać' },
  { word: 'wołać',       ending: 'ać' },
  // -ami: obrazy z piosenek
  { word: 'łzami',       ending: 'ami' },
  { word: 'słowami',     ending: 'ami' },
  { word: 'ustami',      ending: 'ami' },
  { word: 'oczami',      ending: 'ami' },
  { word: 'nocami',      ending: 'ami' },
  { word: 'ramionami',   ending: 'ami' },
  { word: 'sercami',     ending: 'ami' },
];

const cache = new Map<string, string[]>();

/** Every rhyme we know for an ending, alphabetically (Polish collation). */
export function rhymeWords(ending: string): string[] {
  const hit = cache.get(ending);
  if (hit) return hit;
  const words = (RHYME_WORDS[ending] ?? '').split(' ').filter(Boolean);
  cache.set(ending, words);
  return words;
}

export function rhymeCount(ending: string): number {
  return rhymeWords(ending).length;
}

export function randomRhymeEnding(): RhymeEnding {
  return RHYME_ENDINGS[Math.floor(Math.random() * RHYME_ENDINGS.length)];
}

// ---------------------------------------------------------------------------
// Czy to w ogóle rym?
// ---------------------------------------------------------------------------

/**
 * Zapis ≠ dźwięk. Do porównania końcówek sprowadzamy ogonek słowa do postaci
 * „jak brzmi": y=i (dolina/dziewczyna), ó=u, rz=ż. Bez tego wpisany rym
 * odpadłby tylko dlatego, że po polsku pisze się go inną literą.
 */
function phonetic(s: string): string {
  return s.toLowerCase().replace(/rz/g, 'ż').replace(/y/g, 'i').replace(/ó/g, 'u');
}

/** Czy `word` kończy się tak jak rodzina `ending` (i nie jest samą końcówką). */
export function matchesEnding(word: string, ending: string): boolean {
  const w = word.trim().toLowerCase();
  if (w.length <= ending.length) return false;
  return phonetic(w.slice(-ending.length)) === phonetic(ending);
}

/** Czy słowo jest w naszym banku dla tej końcówki. */
export function isInBank(word: string, ending: string): boolean {
  return rhymeWords(ending).includes(word.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Które słowa warto mieć w głowie
// ---------------------------------------------------------------------------

const VOWELS = 'aąeęioóuy';

/** Sylaby po polsku ≈ samogłoski; „i" przed samogłoską tylko zmiękcza (ciasto = 2). */
export function syllables(word: string): number {
  const w = word.toLowerCase();
  let n = 0;
  for (let i = 0; i < w.length; i++) {
    if (!VOWELS.includes(w[i])) continue;
    if (w[i] === 'i' && i + 1 < w.length && VOWELS.includes(w[i + 1])) continue;
    n++;
  }
  return n;
}

const PREFIXES = ['niedo', 'najbardziej', 'nie', 'naj', 'roz', 'prze', 'przy', 'wy', 'za', 'po', 'od', 'pod', 'nad', 'do', 'ob', 'o', 'u', 's', 'z', 'w'];

/**
 * Im niżej, tym bardziej warto to słowo pamiętać.
 *
 * Zasada: nie ma sensu wkuwać słowa, które i tak wyprodukujesz w locie.
 * „nieprzytomność" to „przytomność" z przedrostkiem, a „ogólnikowość" to sześć
 * sylab, których nigdy nie zaśpiewasz — jedno i drugie zjada powtórki, które
 * powinny iść na krótkie, konkretne słowa.
 */
function memoScore(word: string, family: Set<string>): number {
  const derived = PREFIXES.some((p) => word.startsWith(p) && family.has(word.slice(p.length)));
  return syllables(word) + (derived ? 2 : 0) + (word.length > 12 ? 1 : 0);
}

const coreCache = new Map<string, string[]>();

/**
 * Trzon rodziny: słowa uszeregowane od najbardziej „śpiewalnych".
 * To one liczą się do postępu i one wracają w powtórkach — reszta banku wciąż
 * jest akceptowana, jeśli sam ją wpiszesz.
 */
export function corePool(ending: string): string[] {
  const hit = coreCache.get(ending);
  if (hit) return hit;
  const all = rhymeWords(ending);
  const family = new Set(all);
  const size = Math.min(all.length, Math.max(20, Math.round(all.length * 0.5)));
  const core = [...all]
    .sort((a, b) => memoScore(a, family) - memoScore(b, family) || a.localeCompare(b, 'pl'))
    .slice(0, size);
  coreCache.set(ending, core);
  return core;
}

export function coreCount(ending: string): number {
  return corePool(ending).length;
}

// ---------------------------------------------------------------------------
// Co usłyszał mikrofon
// ---------------------------------------------------------------------------

export type HeardMatch =
  | { kind: 'bank'; word: string }    // trafienie w bank (może po korekcie)
  | { kind: 'own'; word: string }     // spoza banku, ale końcówka się zgadza
  | { kind: 'reject'; word: string }; // nie rym albo szum

/** Odległość Levenshteina, dwa wiersze — bank ma ~200 słów, liczymy na bieżąco. */
function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let best = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < best) best = curr[j];
    }
    // cały wiersz gorszy niż próg — dalej może być tylko gorzej
    if (best > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Krótkie słowa przyklejają się do wszystkiego, więc korygujemy tylko dłuższe. */
const MIN_FUZZY_LENGTH = 6;

/**
 * Dopasowanie usłyszanego słowa do rodziny rymów.
 *
 * Rozpoznawanie mowy ciągnie w stronę częstych słów — „zdolność" wraca jako
 * „zdolnść", „wolność" jako „wolnosc". Sam bank rymów jest tu słownikiem
 * korekcyjnym: token o dwie literówki od słowa z rodziny przyjmujemy jako
 * wersję z banku, inaczej mikrofon gubiłby połowę trafień.
 *
 * Próg zależy od tego, czy usłyszane słowo samo w sobie jest poprawnym rymem:
 *
 * - **nie jest** (jak „zdolnść") — to na pewno przekręcenie, korygujemy do
 *   odległości 2,
 * - **jest** (jak „gibkość") — to prawdopodobnie twoje własne słowo, więc
 *   podmieniamy je tylko przy oczywistej literówce (odległość 1).
 *
 * Bez tego rozróżnienia korekta zjadała autorskie rymy: „gibkość" wracało jako
 * „giętkość", czyli aplikacja zapisywała coś, czego nie powiedziałeś, i jeszcze
 * doliczała to sobie do pokrycia banku.
 */
export function matchHeard(token: string, ending: string): HeardMatch {
  const word = token.trim().toLowerCase();
  if (!word) return { kind: 'reject', word: token };

  const bank = rhymeWords(ending);
  if (bank.includes(word)) return { kind: 'bank', word };

  const rhymesAsHeard = matchesEnding(word, ending);
  const maxDistance = rhymesAsHeard ? 1 : 2;

  if (word.length >= MIN_FUZZY_LENGTH) {
    let best = '';
    let bestDist = maxDistance + 1;
    for (const candidate of bank) {
      // porównujemy tylko z sensownie podobnej długości
      if (Math.abs(candidate.length - word.length) > maxDistance) continue;
      const d = levenshtein(word, candidate, maxDistance);
      if (d < bestDist) { bestDist = d; best = candidate; }
      if (d === 1) break; // bliżej niż o jedną literę już nie będzie
    }
    if (best && bestDist <= maxDistance) return { kind: 'bank', word: best };
  }

  // Twój własny rym: nie ma go u nas, ale końcówka się zgadza.
  if (rhymesAsHeard) return { kind: 'own', word };

  return { kind: 'reject', word };
}
