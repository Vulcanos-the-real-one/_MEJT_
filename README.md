# MEJT Website — Setup-Anleitung

Diese Website ist eine komplette, statische Seite (HTML/CSS/JS) im AAA-Game-Look,
passend zu eurem Logo. Sie läuft komplett auf **GitHub Pages** (kostenlos) und
enthält ein echtes, funktionierendes **Gutschein-System** für VIP/MVP-Codes.

Kurzüberblick, was drin ist:

- `index.html` – Startseite (Hero mit Partikeln & Maskottchen, Live-Serverstatus,
  Features, Ranks, Join-Anleitung)
- `redeem.html` – Seite zum Einlösen von Gutscheincodes
- `admin.html` – geschütztes Adminpanel: Codes erstellen & Übersicht aller Codes
- `agb.html` – eure AGB (aus der bestehenden Seite übernommen)
- `404.html` – gestaltete Fehlerseite
- `css/`, `js/`, `images/` – Styles, Skripte, euer Logo & generierte Icons
- `firestore.rules` – Sicherheitsregeln für die Datenbank (siehe unten)

Wichtig zu verstehen: **GitHub Pages liefert nur statische Dateien aus** – es gibt
keinen eigenen Server, der Codes speichern oder Nachrichten verschicken kann.
Damit "Code erstellen → verteilen → einlösen → Benachrichtigung" trotzdem
funktioniert, nutzt die Seite **Firebase** (kostenlose Google-Datenbank) für die
Codes und einen **Discord-Webhook** für die Benachrichtigung. Beides ist gratis
und braucht nur einmalig ein paar Minuten Einrichtung – danach läuft alles von
selbst.

---

## 1. Auf GitHub Pages veröffentlichen

1. Erstellt ein neues Repository auf GitHub, z. B. `mejt-website`.
2. Ladet **alle Dateien aus diesem Ordner** in das Repository hoch (per
   `git push` oder einfach per Drag & Drop im Browser über "Add file → Upload
   files").
3. Geht im Repo auf **Settings → Pages**.
4. Bei "Branch" wählt ihr `main` und Ordner `/ (root)`, dann **Save**.
5. Nach ca. 1 Minute ist die Seite live unter
   `https://<euer-github-name>.github.io/mejt-website/`.
6. Eigene Domain (z. B. `mejt.bunix.de`): Legt eine Datei `CNAME` mit eurem
   Domainnamen als einzigem Inhalt an, und setzt bei eurem Domain-Anbieter
   einen CNAME-Eintrag auf `<euer-github-name>.github.io`. GitHub zeigt euch
   den genauen Wert unter Settings → Pages an, sobald ihr die Domain dort
   einträgt.

Passt danach in `index.html`, `redeem.html`, `agb.html` und `sitemap.xml` die
Stellen mit `mejt.bunix.de` an eure tatsächliche Domain an (falls ihr eine
andere nutzt).

---

## 2. Firebase einrichten (für das Gutschein-System)

1. Geht zu <https://console.firebase.google.com> und erstellt ein neues,
   kostenloses Projekt (z. B. "mejt-server").
2. Klickt auf das **Web-Symbol (`</>`)**, um eine Web-App hinzuzufügen. Gebt
   ihr einen Namen (z. B. "mejt-website") und klickt auf "App registrieren".
3. Firebase zeigt euch jetzt ein Code-Snippet mit einem Objekt
   `firebaseConfig = { apiKey: ..., authDomain: ..., ... }`. Kopiert genau
   diese Werte in die Datei **`js/firebase-init.js`** in diesem Projekt, an
   die Stelle, wo aktuell `"YOUR_API_KEY"` usw. steht.
4. Im Firebase-Menü links: **Build → Firestore Database → Datenbank
   erstellen**. Startmodus: "Produktionsmodus" wählen (die Regeln fügt ihr
   gleich manuell ein), Region z. B. `eur3 (europe-west)`.
5. Danach oben im Firestore-Bereich auf den Tab **"Regeln"** klicken, den
   kompletten Inhalt der Datei `firestore.rules` (aus diesem Projekt) hinein
   kopieren und auf **"Veröffentlichen"** klicken.
6. Im Firebase-Menü: **Build → Authentication → Get started → Sign-in method
   → E-Mail/Passwort → aktivieren**.
7. Dort im Tab **"Users" → "Add user"** einen einzigen Benutzer für euch
   selbst anlegen (eure E-Mail + ein sicheres Passwort). Das sind eure
   Zugangsdaten für `admin.html`. **Legt hier keine weiteren Nutzer an** –
   jeder eingetragene Nutzer kann im Adminpanel Codes erstellen.

Damit ist das Gutschein-System technisch fertig. Sobald `firebase-init.js`
eure echten Werte enthält, verschwindet der rote "nicht verbunden"-Hinweis auf
`redeem.html` und `admin.html` automatisch.

### Wie das System funktiert

- Auf `/admin.html` meldet ihr euch mit eurer E-Mail/Passwort an und könnt VIP-
  oder MVP-Codes in beliebiger Menge erzeugen (z. B. 10 VIP-Codes auf einmal),
  optional mit Ablaufdatum und einer Notiz nur für euch.
- Ihr gebt so einen Code an einen Spieler weiter (z. B. nach Zahlungseingang).
- Der Spieler öffnet `/redeem.html`, gibt Code + Minecraft-Name ein.
- Der Code wird in der Datenbank als eingelöst markiert (ein Code funktioniert
  nur **einmal**), die Seite zeigt eine Erfolgsmeldung mit kleiner
  Konfetti-Animation.
- Ihr bekommt sofort eine Discord-Nachricht mit Rang, Minecraft-Name und Code
  (siehe Schritt 3).
- In `/admin.html` seht ihr in Echtzeit, welche Codes noch offen und welche
  bereits eingelöst sind (inkl. von wem).

Das Vergeben des Rangs im Spiel selbst (z. B. via Plugin/`/lp`-Befehl) bleibt
weiterhin ein manueller Schritt bei euch — das System ersetzt nur das
Verwalten und Prüfen der Codes.

---

## 3. Discord-Benachrichtigung einrichten

1. In eurem Discord-Server: **Servereinstellungen → Integrationen →
   Webhooks → Neuer Webhook**.
2. Wählt den Kanal, in dem ihr Einlösungen sehen wollt, benennt den Webhook
   (z. B. "Gutschein-Bot") und klickt auf **"Webhook-URL kopieren"**.
3. Fügt diese URL in `js/firebase-init.js` bei `DISCORD_WEBHOOK_URL` ein.

**Sicherheitshinweis:** Diese URL steht im öffentlichen Quellcode der Seite.
Jemand, der sie im Quelltext findet, könnte theoretisch selbst Nachrichten in
den Kanal posten (er kann dadurch aber **keine** Codes fälschen oder
einlösen — das prüft weiterhin Firestore). Für ein Hobby-/Community-Projekt
ist das ein üblicher, akzeptabler Kompromiss. Wer das später absichern
möchte, kann den Webhook-Aufruf hinter eine kleine Serverless-Funktion (z. B.
einen kostenlosen Cloudflare Worker) legen — bei Bedarf helfe ich gern beim
nächsten Schritt.

---

## 4. Inhalte anpassen

- **Logo/Farben:** `images/logo.jpg` sowie die Icons in `images/` stammen aus
  eurem hochgeladenen Logo. Farben (Magenta, Orange, Cyan, Gold, Grün) sind
  als CSS-Variablen ganz oben in `css/style.css` definiert (`:root { ... }`)
  – dort lässt sich das gesamte Farbschema zentral ändern.
- **MVP-Preis/Perks:** Aktuell steht bei MVP bewusst "Price: TBA – ask on
  Discord" und Beispiel-Perks, da mir dazu keine echten Werte vorlagen. Sucht
  in `index.html` nach `rank-card mvp` und passt Preis/Liste an.
- **Texte:** Alle sichtbaren Texte sind direkt in den `.html`-Dateien in
  Klartext enthalten (Englisch, wie gewünscht) und lassen sich einfach
  durchsuchen und ersetzen.
- **Server-Status-Anzeige:** nutzt die kostenlose, öffentliche API
  `api.mcsrvstat.us` mit eurer Adresse `mejt.bunix.de` (in `index.html`,
  Attribut `data-server-status`).

---

## 5. Kurz-Checkliste

- [ ] Dateien in ein GitHub-Repo hochgeladen, Pages aktiviert
- [ ] Firebase-Projekt erstellt, Config in `js/firebase-init.js` eingetragen
- [ ] Firestore aktiviert, `firestore.rules` eingefügt & veröffentlicht
- [ ] Authentication (E-Mail/Passwort) aktiviert, euren Admin-Nutzer angelegt
- [ ] Discord-Webhook erstellt, URL in `js/firebase-init.js` eingetragen
- [ ] Eigene Domain (optional) verbunden, `mejt.bunix.de` in den Dateien
      geprüft/angepasst

Bei Fragen zu einzelnen Schritten einfach melden — ich kann auch gezielt an
einzelnen Dateien weiterhelfen (z. B. MVP-Preise final eintragen, weitere
Seiten ergänzen, Cloudflare-Worker für den Webhook einrichten).
