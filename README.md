# 🔐 Agents Cyber

Jeu sérieux **accessible** sur la cybersécurité pour le collège (5e, 4e, 3e), conçu pour des élèves à besoins éducatifs particuliers (dys, TDAH, TSA, déficience visuelle).

Les élèves, recrutés comme hackers éthiques stagiaires, réalisent **6 missions**. Chaque mission réussie donne un **code** à noter sur la fiche. Avec les 6 codes, ils ouvrent un **coffre-fort** qui contient la **synthèse imprimable** de leur activité.

Durée prévue : une séance de 50 minutes, après le cours et les vidéos.

## Les missions

| # | Mission | Notions |
|---|---|---|
| 1 | Le mot de passe | Force brute, recommandations CNIL, testeur local |
| 2 | Les 4 attaques | Force brute, ingénierie sociale, exploration du réseau, vol de données |
| 3 | La boîte mail piégée | Hameçonnage (phishing) : repérer les indices |
| 4 | Le chiffrement | Symétrique / asymétrique, code de César (le mot déchiffré **est** le code) |
| 5 | Le métier de hacker éthique | Rôle, compétences, études |
| 6 | Stop à la cyberviolence | Formes de cyberviolence, 3018 |

**Trois niveaux de difficulté** : en 5e, moins de questions, plus d'aide et une petite clé César donnée. En 4e, des situations en plus. En 3e, des messages plus piégeux, et la clé César doit être trouvée par force brute.

## Anti-triche

- Au départ, chaque groupe reçoit un **numéro d'agent** tiré au hasard (ex. `K7FA`). Tous ses codes en dépendent : les codes d'un autre groupe n'ouvrent pas le coffre.
- Le code de la mission 4 est le **mot déchiffré** (mot et clé différents selon le groupe).
- Les réponses apparaissent dans un **ordre différent** d'un groupe à l'autre.
- L'**espace enseignant** affiche les codes attendus pour un numéro d'agent. Vous pouvez ainsi vérifier une fiche en quelques secondes.
- La synthèse indique combien de missions ont été faites **sur l'appareil**.

⚠️ Sans serveur, rien n'est inviolable : ces protections dissuadent, elles ne résistent pas à une personne qui lit le code source.

## Accessibilité

L'application vise le niveau AA des **WCAG 2.2**, avec le **RGAA 4.1.2** comme grille de vérification. Elle n'a pas été auditée.

- Navigation complète au clavier, focus très visible, une question par écran.
- Bouton **« Écouter »** sur chaque consigne et chaque question : synthèse vocale du navigateur, hors ligne. Les codes sont épelés (« K comme Koala »).
- **Réglages** : taille du texte jusqu'à 175 %, polices Arial, Verdana, Luciole ou OpenDyslexic (ces deux dernières si elles sont installées), espacements, thèmes clair, sombre ou contraste élevé jaune sur noir, animations supprimées, vitesse de la voix, lecture automatique.
- **Aide à la lecture** : un bouton « mode lecture facilitée » active d'un coup un texte plus grand, le fond crème, les espacements du critère WCAG 1.4.12 (interligne ≥ 1,5, lettres 0,12 em, mots 0,16 em, paragraphes 2 em), des lignes courtes, les mots en deux couleurs et la lecture au clic. Le guide de lecture (bande qui suit la souris) s'active à part.
- Missions **dans l'ordre** : une mission reste verrouillée tant que la précédente n'est pas réussie. En cas de changement d'ordinateur, l'élève débloque une mission déjà faite en saisissant son code.
- Synthèse imprimable en **12 à 20 points**.
- Ni chronomètre, ni glisser-déposer. Indice et explication à chaque erreur. Les réponses fausses sont barrées, ce qui réduit les choix.
- Codes sans caractères ambigus : pas de 0/O, 1/I/L, ni b/d/p/q.
- **Version papier (variante low-tech)** : fiche imprimable et roue de César à découper.

## Installation sur GitHub Pages

1. Créez un dépôt et déposez-y tous les fichiers.
2. Dans *Settings > Pages*, choisissez la branche `main` et le dossier `/ (root)`.
3. L'adresse du jeu sera `https://<votre-compte>.github.io/<nom-du-depot>/`.

Le jeu fonctionne aussi hors ligne : il suffit d'ouvrir `index.html` dans un navigateur.

## Code enseignant

L'Espace enseignant est protégé par un code. Le fichier `js/config.js` n'en contient que l'empreinte, jamais le code lui-même.

- **Changer le code** : *Espace enseignant > Changer mon code*, puis recopiez l'empreinte affichée dans `EMPREINTE_CODE_ENSEIGNANT`.
- **Changer tous les codes du jeu** (par exemple à chaque nouvelle année) : modifiez la phrase `SEL` dans `js/config.js`.

Vous réutilisez ce jeu dans votre établissement ? Changez ces deux valeurs : sinon, vos élèves auraient les mêmes codes que ceux de l'EREA Pleyel.

## Modifier les contenus

Tous les textes (questions, réponses, indices, synthèse, questions de la fiche) se trouvent dans **`js/missions.js`**. Aucun autre fichier n'est à modifier pour cela. Chaque étape indique les niveaux qui la voient (`niv: ["5","4","3"]`).

## Fiches

- Fiche imprimable depuis l'application (lien en bas de page), en format **standard** (Arial 12) ou **adapté** (Arial 16).
- Versions modifiables : `fiches/fiche-eleve-5e.odt`, `4e`, `3e` (Arial 16).
- Pour les régénérer après avoir modifié les questions : `node tools/generer-fiches.js`, puis convertissez les fichiers `.html` produits avec LibreOffice.

## Identité de l'établissement

Le logo et la photo de l'EREA Ignace Pleyel se trouvent dans le dossier `img/` :
- `logo-pleyel.png` (traits foncés, fond transparent) et `logo-pleyel-clair.png` (traits clairs, pour les thèmes sombre et contraste élevé) ;
- `erea-pleyel.jpg`, la photo affichée en fondu dans le bandeau et en haut des documents imprimables ;
- `bandeau-fiche.png`, le bandeau des fiches `.odt`.

Pour un autre établissement, remplacez ces fichiers en gardant les mêmes noms. Changez ensuite le texte « Technologie – M. Loquet » dans `index.html` et dans la fonction `enteteDoc()` de `js/app.js`.

## Structure

```
index.html          page unique
css/style.css       styles (thèmes, impression)
js/config.js        réglages enseignant (sel, code)
js/missions.js      tout le contenu pédagogique
js/app.js           moteur du jeu
fiches/             fiches élèves modifiables (.odt)
img/                logo et photo de l'établissement
tools/              génération des fiches
```

Aucune donnée personnelle n'est collectée ni envoyée. La progression est enregistrée uniquement dans le navigateur de l'appareil.

## Sources des contenus

- Recommandation CNIL sur les mots de passe (2022) : 12 caractères minimum, plus de renouvellement périodique imposé aux utilisateurs.
- 3018 (association e-Enfance) : numéro national gratuit, anonyme et confidentiel, 7 jours sur 7 de 9 h à 23 h.

## Licence

© Laurent Loquet — EREA Ignace Pleyel. Ce jeu est publié sous licence **Creative Commons BY-NC-SA 4.0** : vous pouvez le partager et l'adapter, en citant l'auteur, sans usage commercial et sous la même licence. Voir [LICENSE.md](LICENSE.md).

Le logo et la photo de l'EREA Ignace Pleyel n'entrent pas dans cette licence : ils appartiennent à l'établissement.
