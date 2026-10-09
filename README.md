# DSA Tracker

A small shared tracker for two people practising DSA. Each person logs their own sessions and can view the other's progress **read-only**, updated live. No rankings or comparisons.

## Features
- Log sessions: topic, platform, difficulty, questions solved, question links, hours, notes, "needs revision" flag
- Weekly target vs. questions actually solved (weeks run Mon-Sun, target carries forward)
- Daily streak (current and longest), activity heatmap, totals by topic and platform
- Live read-only view of your friend's tracker; only the owner can edit theirs
- JSON export/import for backups
- Works offline (browser storage) until Firebase is configured

## Project structure
```
index.html       page markup
style.css        styles
app.js           app logic + Firebase sync
config.js        your Firebase web config (edit this)
firestore.rules  security rules (edit the two emails)
firebase.json    optional Firebase Hosting config
```

## Setup
1. **Firebase project**: console.firebase.google.com -> Add project.
2. **Auth**: Build -> Authentication -> Sign-in method -> enable **Google**.
3. **Firestore**: Build -> Firestore Database -> Create database (production mode).
4. **Web app config**: Project settings -> Your apps -> Web (`</>`) -> register, then copy the values into `config.js`.
5. **Rules**: put both Google emails in `firestore.rules`, then paste the file into Firestore -> Rules -> Publish (or run `firebase deploy --only firestore:rules`).

## Deploy (pick one)
**GitHub Pages**
```bash
git init
git add .
git commit -m "DSA tracker"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
Then repo **Settings -> Pages -> Deploy from branch -> main / (root)**. Your link will be `https://<you>.github.io/<repo>/`.

**Netlify Drop**: drag this folder onto app.netlify.com/drop.

**Firebase Hosting**: `npm i -g firebase-tools && firebase login && firebase init` (reuse `firebase.json`) then `firebase deploy`.

## After deploying
Add your site's domain (e.g. `<you>.github.io`) under Firebase -> Authentication -> Settings -> **Authorized domains**, otherwise Google sign-in will be blocked.

Send the link to your friend. You both sign in with Google; her name then appears as a button at the top of your page, and yours on hers.

## Notes
- Firebase web config values are not secrets; access is protected by the rules above. Keep the email allowlist up to date.
- Data lives in Firestore under `trackers/<user id>`; each person can only write their own document.
- Local run: serve the folder (e.g. `python3 -m http.server`) and open http://localhost:8000. Add `localhost` to Authorized domains for sign-in to work locally.
