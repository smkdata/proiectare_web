PayFlow

PayFlow este un proiect facut cu HTML, CSS si JavaScript.
Aplicatia afiseaza plati fictive si permite adaugarea unor plati noi.

API folosit

Am folosit API-ul:
https://jsonplaceholder.typicode.com/posts

Cand deschid pagina, aplicatia foloseste GET ca sa ia datele de la API si sa le afiseze.

Cand adaug o plata, aplicatia foloseste POST ca sa trimita datele la API.

API-ul nu salveaza platile permanent, asa ca am folosit localStorage pentru a le pastra in browser.

CORS

CORS permite unui site sa primeasca date de la un API de pe alt site.

JSONPlaceholder permite acest lucru, deci nu am avut nevoie de un server separat sau de un proxy.

Coduri HTTP

* 200 - Datele au fost primite cu succes.
* 201 - Plata a fost creata.
* 400 - Cererea nu este corecta.
* 404 - Resursa nu a fost gasita.
* 500 - Problema la server.

Daca apare o eroare, aplicatia afiseaza un mesaj.

Alte functionalitati

Pot cauta plati in lista si pot adauga plati noi.

Formularul verifica daca am completat campurile obligatorii.

Aplicatia functioneaza si pe telefon.

Platile sunt doar pentru test, nu sunt plati reale.