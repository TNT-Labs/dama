# Sistema di Auto-Aggiornamento 🚀

Questa applicazione è configurata per aggiornarsi automaticamente ad ogni deploy.

## Come funziona

### 1. Service Worker con Versioning
Il file `sw.js` contiene una costante `APP_VERSION` che identifica la versione corrente dell'app.

```javascript
const APP_VERSION = 'v1.0.0';
```

Ad ogni installazione del Service Worker:
- Viene creata una nuova cache con il nome `dama-${APP_VERSION}`
- Le vecchie cache vengono eliminate automaticamente
- Il nuovo service worker prende il controllo immediatamente grazie a `skipWaiting()`

### 2. Auto-Update nell'HTML
L'applicazione controlla automaticamente la presenza di aggiornamenti:
- Ogni 60 secondi viene controllato se c'è una nuova versione
- Quando viene rilevato un aggiornamento, la pagina si ricarica automaticamente
- Gli utenti riceveranno sempre l'ultima versione senza intervento manuale

### 3. GitHub Actions per Deploy Automatico
Il workflow `.github/workflows/deploy.yml` si attiva automaticamente ad ogni push sul branch `main`:

**Processo automatico:**
1. ✅ Legge la versione corrente da `sw.js`
2. ✅ Incrementa automaticamente il numero di versione (patch)
3. ✅ Aggiorna `sw.js` e `manifest.json` con la nuova versione
4. ✅ Crea un commit con le modifiche
5. ✅ Fa il deploy su GitHub Pages
6. ✅ Crea una release su GitHub con tag della versione

### 4. Strategia di Caching
- **Network First**: L'app prova sempre a scaricare la versione più recente dalla rete
- **Fallback su Cache**: Se offline, usa la versione in cache
- **Auto-pulizia**: Le vecchie versioni vengono rimosse automaticamente

## Come fare un deploy manuale

Puoi anche attivare manualmente il deploy:

1. Vai su GitHub Actions nella tua repository
2. Seleziona il workflow "Auto Deploy e Update"
3. Clicca su "Run workflow"

## Incrementare manualmente la versione

Se vuoi fare un major o minor update invece che patch:

```bash
# Modifica manualmente la versione in sw.js
const APP_VERSION = 'v2.0.0';  # Major update
# oppure
const APP_VERSION = 'v1.1.0';  # Minor update
```

Poi fai commit e push:
```bash
git add sw.js
git commit -m "Bump version to v2.0.0"
git push
```

## Configurazione GitHub Pages

Per abilitare GitHub Pages:

1. Vai nelle **Settings** della repository
2. Clicca su **Pages** nel menu laterale
3. In **Source**, seleziona **GitHub Actions**
4. Salva le impostazioni

L'app sarà disponibile su: `https://<username>.github.io/<repo-name>/`

## Monitoraggio Aggiornamenti

Puoi vedere lo stato degli aggiornamenti nella console del browser:

```
[SW] Installazione versione: v1.0.0
[SW] Caching assets per versione: v1.0.0
[SW] Attivazione versione: v1.0.0
[App] Service Worker registrato con successo
[App] Nuovo Service Worker trovato, installazione in corso...
[App] Nuova versione disponibile!
[App] Nuova versione attivata, ricarico la pagina...
```

## FAQ

**Q: Quanto tempo ci vuole perché gli utenti vedano l'aggiornamento?**
A: Massimo 60 secondi se l'app è già aperta, immediatamente al prossimo caricamento.

**Q: Cosa succede se un utente è offline?**
A: L'app continuerà a funzionare con la versione in cache. Al prossimo collegamento online si aggiornerà automaticamente.

**Q: Posso disabilitare l'auto-update?**
A: Sì, rimuovi il `setInterval` da `index.html` e il `skipWaiting()` da `sw.js`.

**Q: Come verifico quale versione sta usando un utente?**
A: Apri la console del browser e digita:
```javascript
navigator.serviceWorker.getRegistration().then(reg => console.log('Cache:', reg));
```
