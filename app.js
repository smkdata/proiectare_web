'use strict';

// API-ul pe care il folosim
const ADRESA_API = 'https://jsonplaceholder.typicode.com/posts';

// Aici salvam platile in browser
const CHEIE_STOCARE = 'payflow-plati-demo-v2';


// Luam elementele din HTML
const lista = document.querySelector('#transaction-list');
const stareLista = document.querySelector('#list-status');
const cautare = document.querySelector('#search');
const formular = document.querySelector('#payment-form');
const mesajFormular = document.querySelector('#form-message');
const butonTrimitere = document.querySelector('#submit-button');


// Elementele pentru statistici
const elementTotal = document.querySelector('#total-amount');
const elementNumar = document.querySelector('#transaction-count');
const elementNoi = document.querySelector('#new-count');

const zonaCautare = document.querySelector('.zona-cautare');


// Variabile pentru tranzactii
let tranzactiiAPI = [];
let tranzactiiLocale = [];

let createInSesiune = 0;
let incarcare = true;
let eroareIncarcare = '';


// Formatam suma in euro
const formatSuma = suma => {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR'
    }).format(suma);
};


// Afisam un mesaj sub formular
function afiseazaMesaj(text, tip = '') {

    mesajFormular.textContent = text;

    mesajFormular.className = 'mesaj-formular';

    if (tip !== '') {
        mesajFormular.classList.add(tip);
    }
}


// Afisam un mesaj pentru lista
function seteazaStareLista(text, eroare = false) {

    stareLista.textContent = text;
    stareLista.className = 'stare-lista';

    if (eroare) {
        stareLista.classList.add('eroare');
    }
}


// Citim platile salvate in browser
function citesteLocale() {

    try {

        const date = JSON.parse(
            localStorage.getItem(CHEIE_STOCARE) || '[]'
        );

        if (!Array.isArray(date)) {
            return [];
        }

        return date.filter(item => {
            return item &&
                typeof item.recipient === 'string' &&
                typeof item.description === 'string' &&
                Number.isFinite(item.amount);
        });

    } catch (eroare) {

        return [];

    }
}


// Punem toate tranzactiile intr-o singura lista
function toateTranzactiile() {

    return [...tranzactiiLocale, ...tranzactiiAPI];

}


// Actualizam statisticile de sus
function actualizeazaStatistici() {

    const toate = toateTranzactiile();

    let total = 0;

    for (const plata of toate) {
        total = total + plata.amount;
    }

    elementTotal.textContent = formatSuma(total);

    elementNumar.textContent = String(toate.length);

    elementNoi.textContent = String(createInSesiune);

}


// Afisam tranzactiile pe pagina
function afiseazaTranzactii() {

    // Golim lista veche
    lista.replaceChildren();


    // Daca inca se incarca datele
    if (incarcare) {

        seteazaStareLista('Se incarca tranzactiile din API...');

        return;
    }


    // Luam ce a scris utilizatorul la cautare
    const termen = cautare.value.trim().toLowerCase();


    // Filtram tranzactiile
    const filtrate = toateTranzactiile().filter(plata => {

        const text = plata.recipient + ' ' + plata.description;

        return text.toLowerCase().includes(termen);

    });


    // Verificam daca avem eroare sau lista goala
    if (eroareIncarcare) {

        seteazaStareLista(eroareIncarcare, true);

    } else if (filtrate.length === 0) {

        if (termen !== '') {

            seteazaStareLista(
                'Nu exista tranzactii care corespund cautarii.'
            );

        } else {

            seteazaStareLista('Lista este goala.');

        }

    } else {

        seteazaStareLista('');

    }


    // Pregatim elementele pentru lista
    const fragment = document.createDocumentFragment();


    // Trecem prin fiecare tranzactie
    for (const plata of filtrate) {

        // Cream un element li
        const element = document.createElement('li');

        element.className = 'element-tranzactie';


        // Cream avatarul
        const avatar = document.createElement('span');

        avatar.className = 'avatar-tranzactie';

        avatar.textContent =
            plata.recipient.charAt(0).toUpperCase() || 'P';


        // Cream zona cu detalii
        const detalii = document.createElement('div');

        detalii.className = 'detalii-tranzactie';


        // Numele destinatarului
        const nume = document.createElement('strong');

        nume.textContent = plata.recipient;


        // Descrierea platii
        const descriere = document.createElement('small');

        descriere.textContent = plata.description;


        // Punem numele si descrierea in div
        detalii.append(nume, descriere);


        // Cream zona pentru suma
        const coloanaSuma = document.createElement('div');

        coloanaSuma.className = 'suma-tranzactie';


        // Suma platii
        const suma = document.createElement('strong');

        suma.textContent = formatSuma(plata.amount);


        // Textul de sub suma
        const stare = document.createElement('small');


        if (plata.sursa === 'api') {

            stare.textContent = 'Date demonstrative din GET';

        } else if (plata.creataAcum) {

            stare.textContent = 'Creata acum (POST 201)';

        } else {

            stare.textContent = 'Salvata in browser';

        }


        // Punem suma si starea in div
        coloanaSuma.append(suma, stare);


        // Punem toate elementele in tranzactie
        element.append(avatar, detalii, coloanaSuma);


        // Adaugam tranzactia in lista pregatita
        fragment.append(element);

    }


    // Afisam toate tranzactiile
    lista.append(fragment);

}


// Citim mesajul de eroare primit de la API
async function citesteEroareServer(raspuns) {

    const text = await raspuns.text().catch(() => '');

    try {

        const date = JSON.parse(text);

        if (typeof date.message === 'string') {
            return date.message;
        }

        if (typeof date.error === 'string') {
            return date.error;
        }

    } catch (eroare) {

        // Daca raspunsul nu este JSON, folosim textul simplu

    }

    return text.trim().slice(0, 200) ||
        `Eroare HTTP ${raspuns.status}.`;

}


// Incarcam tranzactiile de la API
async function incarcaTranzactii() {

    incarcare = true;

    eroareIncarcare = '';

    afiseazaTranzactii();


    try {

        // Trimitem cererea GET
        const raspuns = await fetch(ADRESA_API);


        // Verificam daca raspunsul este bun
        if (!raspuns.ok) {

            throw new Error(
                await citesteEroareServer(raspuns)
            );

        }


        // Transformam raspunsul in JSON
        const date = await raspuns.json();


        // Verificam daca am primit o lista
        if (!Array.isArray(date)) {

            throw new Error(
                'API-ul a returnat un format neasteptat.'
            );

        }


        // Transformam postarile in plati fictive
        tranzactiiAPI = date.map(postare => {

            return {
                id: `api-${postare.id}`,
                recipient: `Utilizator demonstrativ ${postare.userId}`,
                description: String(postare.title || 'Fara descriere'),
                amount: Number(postare.id) || 0,
                sursa: 'api'
            };

        });


    } catch (eroare) {

        // Daca GET nu functioneaza
        eroareIncarcare =
            `Nu s-au putut incarca datele: ${eroare.message || 'Eroare de retea.'}`;


    } finally {

        // Oprim mesajul de incarcare
        incarcare = false;

        // Actualizam pagina
        actualizeazaStatistici();

        afiseazaTranzactii();

    }

}


// Cand utilizatorul trimite formularul
formular.addEventListener('submit', async function(eveniment) {

    // Nu reincarcam pagina
    eveniment.preventDefault();


    // Verificam formularul
    if (!formular.reportValidity()) {
        return;
    }


    // Luam datele din formular
    const date = new FormData(formular);

    const destinatar = String(
        date.get('recipient') || ''
    ).trim();

    const descriere = String(
        date.get('description') || ''
    ).trim();

    const suma = Number(date.get('amount'));


    // Verificam datele introduse
    if (
        !destinatar ||
        !descriere ||
        !Number.isFinite(suma) ||
        suma < 0.01 ||
        suma > 1000000
    ) {

        afiseazaMesaj(
            'Completeaza corect destinatarul, suma si descrierea.',
            'eroare'
        );

        return;
    }


    // Afisam mesajul de trimitere
    afiseazaMesaj('Se trimite cererea POST...');

    // Dezactivam butonul pana primim raspuns
    butonTrimitere.disabled = true;


    try {

        let raspuns;


        try {

            // Trimitem cererea POST
            raspuns = await fetch(ADRESA_API, {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    title: `Plata demonstrativa catre ${destinatar}`,

                    body: descriere,

                    userId: 1,

                    recipient: destinatar,

                    description: descriere,

                    amount: suma

                })

            });


        } catch (eroare) {

            // Daca nu avem internet
            afiseazaMesaj(
                'Eroare de retea. Verifica internetul si incearca din nou.',
                'eroare'
            );

            return;

        }


        // Verificam daca API-ul a returnat o eroare
        if (!raspuns.ok) {

            const mesaj = await citesteEroareServer(raspuns);

            afiseazaMesaj(mesaj, 'eroare');

            return;

        }


        // Verificam daca POST a returnat 201
        if (raspuns.status !== 201) {

            afiseazaMesaj(
                `Raspuns neasteptat: HTTP ${raspuns.status}.`,
                'eroare'
            );

            return;

        }


        // Citim confirmarea de la API
        const confirmare = await raspuns.json();


        // Cream plata noua
        const plata = {

            id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,

            idApi: confirmare.id,

            recipient: destinatar,

            description: descriere,

            amount: suma,

            sursa: 'local',

            creataAcum: true

        };


        // Adaugam plata la inceputul listei
        tranzactiiLocale.unshift(plata);


        // Incercam sa salvam plata in browser
        try {

            localStorage.setItem(
                CHEIE_STOCARE,
                JSON.stringify(tranzactiiLocale)
            );

            afiseazaMesaj(
                'Cerere acceptata (201). Plata demonstrativa a fost salvata local.',
                'succes'
            );

        } catch (eroare) {

            afiseazaMesaj(
                'Cerere acceptata (201), dar browserul nu permite salvarea locala.',
                'succes'
            );

        }


        // Crestem numarul de plati noi
        createInSesiune = createInSesiune + 1;


        // Golim formularul
        formular.reset();


        // Golim cautarea
        cautare.value = '';


        // Actualizam statisticile
        actualizeazaStatistici();


        // Afisam plata noua fara alt GET
        afiseazaTranzactii();


    } catch (eroare) {

        afiseazaMesaj(
            'Nu s-a putut procesa raspunsul API-ului.',
            'eroare'
        );


    } finally {

        // Activam din nou butonul
        butonTrimitere.disabled = false;

    }

});


// Cautam tranzactiile cand utilizatorul scrie
// Evenimentul este pus pe containerul cautarii
zonaCautare.addEventListener('input', function(eveniment) {

    if (eveniment.target.matches('#search')) {

        afiseazaTranzactii();

    }

});


// Citim platile salvate in browser
tranzactiiLocale = citesteLocale();

// Afisam statisticile
actualizeazaStatistici();

// Incarcam tranzactiile din API
incarcaTranzactii();