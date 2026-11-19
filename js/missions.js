/* ==========================================================================
   AGENTS CYBER — Contenu pédagogique
   --------------------------------------------------------------------------
   Ce fichier contient TOUT le texte du jeu. Vous pouvez le modifier sans
   toucher au moteur (app.js).

   Niveaux : "5", "4", "3"  (5e, 4e, 3e)
   Chaque étape possède un champ "niv" : la liste des niveaux qui la voient.
   Types d'étapes :
     - "info"   : texte à lire (+ outil éventuel : "testeur")
     - "choix"  : question à choix unique. options : [{ t, ok, pourquoi }]
     - "cesar"  : déchiffrement César (le mot trouvé = code de la mission)
   Champs facultatifs : "aide" (indice), "retenir" (affiché après réussite),
   "carte" (message simulé : mail ou SMS).

   Fiche élève (champ "fiche" de chaque mission) :
     - { t: "Texte avec [réponse] entre crochets", rep: ["réponse"] }
         → les crochets deviennent une case à remplir ; "rep" sert au corrigé.
     - { coche: "Consigne", options: [...], bonnes: [index des bonnes] }
     - "niv" (facultatif) : niveaux concernés.
   ========================================================================== */

window.CYBER = {

  titre: "Agents Cyber",

  niveaux: {
    "5": { nom: "5e" },
    "4": { nom: "4e" },
    "3": { nom: "3e" }
  },

  briefing:
    "L'entreprise NovaTech est la cible de pirates informatiques. " +
    "Elle recrute des hackers éthiques stagiaires : c'est toi ! " +
    "Réussis les 6 missions. À chaque mission réussie, tu obtiens un code. " +
    "Écris chaque code sur ta fiche. Avec tous les codes, tu pourras ouvrir le coffre-fort.",

  /* Mots possibles pour la mission César, selon le niveau.
     Lettres A à Z uniquement, sans accent. */
  cesar: {
    "5": { mots: ["CODE", "CLEF", "VIRUS", "ROBOT", "ECRAN", "PIXEL", "CABLE"], cleMin: 1, cleMax: 3, cleDonnee: true },
    "4": { mots: ["PIRATE", "SECRET", "RESEAU", "SERVEUR", "DONNEES", "MESSAGE"], cleMin: 4, cleMax: 9, cleDonnee: true },
    "3": { mots: ["BOUCLIER", "ANTIVIRUS", "PAREFEU", "CADENAS", "SENTINELLE", "FORTERESSE"], cleMin: 3, cleMax: 23, cleDonnee: false }
  },

  missions: [
    /* ------------------------------------------------------------------ */
    {
      id: "m1",
      titre: "Le mot de passe",
      icone: "🔑",
      resume: "Comprendre la force brute et choisir un mot de passe solide.",
      fiche: [
        { t: "La force brute, c'est essayer toutes les [combinaisons] possibles, une par une.", rep: ["combinaisons"] },
        { t: "Un mot de passe solide contient au moins [12] caractères.", rep: ["12"] },
        { coche: "Coche ce qui rend un mot de passe plus solide :", options: ["la longueur", "mon prénom", "des chiffres et des signes", "ma date de naissance"], bonnes: [0, 2] },
        { t: "J'utilise un mot de passe [différent] pour chaque compte.", niv: ["3"], rep: ["différent"] }
      ],
      etapes: [
        { type: "info", niv: ["5", "4", "3"],
          titre: "Briefing de mission",
          texte: "Un pirate essaie de deviner les mots de passe de NovaTech. " +
                 "Ta mission : comprendre comment il fait, puis reconnaître un bon mot de passe." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Qu'est-ce que l'attaque par force brute ?",
          options: [
            { t: "Essayer toutes les combinaisons possibles, une par une, jusqu'à trouver la bonne.", ok: true },
            { t: "Casser l'ordinateur pour lire ce qu'il contient.", pourquoi: "Non : la force brute ne casse rien. C'est un programme qui essaie des mots de passe." },
            { t: "Demander gentiment le mot de passe par message.", pourquoi: "Ça, c'est une autre technique : l'ingénierie sociale (la manipulation)." }
          ],
          aide: "Pense à la vidéo : le programme teste « aaaa », puis « aaab », puis « aaac »…",
          retenir: "Un ordinateur peut tester des millions de mots de passe par seconde. Plus un mot de passe est court, plus il est trouvé vite." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Selon la CNIL, combien de caractères au minimum faut-il pour un mot de passe solide ?",
          options: [
            { t: "4 caractères", pourquoi: "C'est beaucoup trop court : il serait trouvé en un instant." },
            { t: "8 caractères", pourquoi: "C'est mieux, mais ce n'est pas assez pour un mot de passe utilisé seul." },
            { t: "12 caractères", ok: true }
          ],
          aide: "C'est le nombre de mois dans une année.",
          retenir: "Au moins 12 caractères, avec des majuscules, des minuscules, des chiffres et des caractères spéciaux. Une longue phrase de passe marche aussi très bien." },

        { type: "info", niv: ["4", "3"], outil: "testeur",
          titre: "Le laboratoire des mots de passe",
          texte: "Teste des mots de passe inventés. Observe ce qui les rend plus solides. " +
                 "Attention : ne tape JAMAIS ton vrai mot de passe dans un site ou une application." },

        { type: "choix", niv: ["5"],
          question: "Quel mot de passe est le plus solide ?",
          options: [
            { t: "soleil", pourquoi: "Un seul mot du dictionnaire : les pirates le testent en premier." },
            { t: "Soleil2012", pourquoi: "Un mot connu + une année : c'est encore trop facile à deviner." },
            { t: "Mon-Chat-Mange-3-Croquettes!", ok: true }
          ],
          retenir: "La longueur est la meilleure protection. Une phrase facile à retenir pour toi, mais impossible à deviner pour les autres." },

        { type: "choix", niv: ["4"],
          question: "Quel mot de passe est le plus solide ?",
          options: [
            { t: "azerty123", pourquoi: "Ce sont les premières touches du clavier : c'est un des mots de passe les plus utilisés au monde." },
            { t: "Kevin123!", pourquoi: "Un prénom + une suite de chiffres : c'est l'exemple de la vidéo, trouvé très vite." },
            { t: "J'aime-la-Techno-du-Jeudi-4!", ok: true }
          ],
          retenir: "Une phrase de passe longue, avec des majuscules, des chiffres et des signes, résiste beaucoup mieux à la force brute." },

        { type: "choix", niv: ["3"],
          question: "Quel mot de passe est le plus solide ?",
          options: [
            { t: "P@ssw0rd2024", pourquoi: "Remplacer « a » par « @ » et « o » par « 0 » : les pirates connaissent ces astuces. C'est toujours le mot « password »." },
            { t: "Xk9!", pourquoi: "Il mélange tout, mais il ne fait que 4 caractères : trouvé en un instant." },
            { t: "Tortue-Velo-Nuage-Piano-Orange-7?", ok: true },
            { t: "Kevin123!", pourquoi: "Un prénom + une suite logique : c'est le premier type de mot de passe testé." }
          ],
          retenir: "La longueur compte plus que les astuces. Plusieurs mots sans lien entre eux forment une phrase de passe très solide." },

        { type: "choix", niv: ["4", "3"],
          question: "Pourquoi « Kevin123! » est-il un mauvais mot de passe ?",
          options: [
            { t: "C'est un prénom suivi d'une suite logique : les pirates testent ça en premier.", ok: true },
            { t: "Il est trop long.", pourquoi: "Non, il ne fait que 9 caractères : il est même trop court." },
            { t: "Le point d'exclamation est interdit.", pourquoi: "Non : les caractères spéciaux sont autorisés et même conseillés." }
          ] },

        { type: "choix", niv: ["3"],
          question: "Tu as créé un excellent mot de passe. Que dois-tu faire en plus ?",
          options: [
            { t: "Utiliser un mot de passe différent pour chaque compte et activer la double authentification.", ok: true },
            { t: "L'utiliser partout pour ne pas l'oublier.", pourquoi: "Si un seul site se fait pirater, tous tes comptes sont en danger." },
            { t: "Le donner à ton meilleur ami au cas où tu l'oublies.", pourquoi: "Un mot de passe est personnel : on ne le partage avec personne." }
          ],
          retenir: "Un gestionnaire de mots de passe peut retenir tous tes mots de passe à ta place, de façon sécurisée." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "m2",
      titre: "Les 4 attaques",
      icone: "🕵️",
      resume: "Reconnaître les 4 techniques d'attaque les plus utilisées.",
      fiche: [
        { coche: "Coche les 4 vraies techniques d'attaque :", options: ["la force brute", "l'ingénierie sociale", "l'antivirus", "l'exploration du réseau", "le vol de données sur un site"], bonnes: [0, 1, 3, 4] },
        { t: "Un faux technicien me demande mon mot de passe : c'est de l'[ingénierie sociale].", rep: ["ingénierie sociale"] },
        { t: "Un pirate espionne le wifi gratuit d'un café : c'est l'[exploration du réseau].", niv: ["4", "3"], rep: ["exploration du réseau"] }
      ],
      etapes: [
        { type: "info", niv: ["5", "4", "3"],
          titre: "Briefing de mission",
          texte: "Les pirates utilisent surtout 4 techniques :<ul>" +
                 "<li><strong>La force brute</strong> : un programme essaie tous les mots de passe possibles.</li>" +
                 "<li><strong>L'ingénierie sociale</strong> : le pirate manipule une personne pour qu'elle donne ses informations.</li>" +
                 "<li><strong>L'exploration du réseau</strong> : le pirate espionne le réseau (par exemple un wifi public) sur lequel tu es connecté.</li>" +
                 "<li><strong>Le vol de données sur un site</strong> : le pirate attaque un site où tu as créé un compte.</li></ul>" +
                 "Pour chaque situation, trouve la technique utilisée." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Un programme essaie « aaaa », « aaab », « aaac »… des millions de mots de passe à la suite. Quelle technique ?",
          options: "ATTAQUES", bonne: 0 },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Quelqu'un t'appelle. Il dit être le technicien informatique du collège et te demande ton mot de passe. Quelle technique ?",
          options: "ATTAQUES", bonne: 1,
          retenir: "Un vrai technicien ne te demandera jamais ton mot de passe." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Au café, un pirate se connecte au même wifi gratuit que toi et espionne ce qui passe sur ce réseau. Quelle technique ?",
          options: "ATTAQUES", bonne: 2 },

        { type: "choix", niv: ["4", "3"],
          question: "Le site d'un jeu en ligne se fait pirater : les mots de passe de tous les joueurs sont volés. Quelle technique ?",
          options: "ATTAQUES", bonne: 3,
          retenir: "C'est pour ça qu'il faut un mot de passe différent pour chaque site." },

        { type: "choix", niv: ["3"],
          question: "Un message te dit : « Tu as gagné un téléphone ! Connecte-toi vite avec ton compte pour le recevoir. » Quelle technique ?",
          options: "ATTAQUES", bonne: 1,
          aide: "Le pirate joue sur une émotion (la joie, la surprise) pour te pousser à agir sans réfléchir.",
          retenir: "Le faux cadeau est une manipulation : c'est de l'ingénierie sociale. On l'appelle aussi hameçonnage (mission 3)." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "m3",
      titre: "La boîte mail piégée",
      icone: "🎣",
      resume: "Repérer les messages d'hameçonnage (phishing).",
      fiche: [
        { t: "L'hameçonnage est un [faux] message qui imite une vraie entreprise pour voler mes informations.", rep: ["faux"] },
        { coche: "Coche les indices qui montrent qu'un message est un piège :", options: ["une adresse bizarre", "un message urgent ou qui fait peur", "le message ne demande rien", "on me demande un code ou un mot de passe", "un cadeau trop beau pour être vrai"], bonnes: [0, 1, 3, 4] },
        { t: "« instagrarn » est un piège : les lettres [r] et [n] remplacent la lettre [m].", niv: ["3"], rep: ["r", "n", "m"] }
      ],
      etapes: [
        { type: "info", niv: ["5", "4", "3"],
          titre: "Briefing de mission",
          texte: "L'<strong>hameçonnage</strong> (en anglais <em>phishing</em>) est un faux message qui imite une vraie entreprise pour te voler tes informations. " +
                 "Les indices d'un piège :<ul>" +
                 "<li>l'adresse de l'expéditeur est bizarre ;</li>" +
                 "<li>le message te presse ou te fait peur (« urgent », « dans 24 h ») ;</li>" +
                 "<li>on te demande un mot de passe ou un code de carte bancaire ;</li>" +
                 "<li>le lien mène vers une adresse qui n'est pas celle de la vraie entreprise ;</li>" +
                 "<li>on te promet un cadeau trop beau pour être vrai.</li></ul>" +
                 "Lis chaque message et décide : fiable ou piège ?" },

        { type: "choix", niv: ["5", "4", "3"],
          carte: { genre: "E-mail", de: "Netflix <support@netfliix-compte.com>", objet: "URGENT : votre compte sera supprimé dans 24 h",
                   corps: "Votre paiement a échoué. Cliquez vite sur le lien pour entrer à nouveau votre carte bancaire.",
                   lien: "netfliix-compte.com/paiement" },
          question: "Ce message est-il fiable ou est-ce un piège ?",
          options: "FIABLE_PIEGE", bonne: 1,
          retenir: "Indices : l'adresse « netfliix » avec deux i, l'urgence (24 h) et la demande de carte bancaire." },

        { type: "choix", niv: ["5", "4", "3"],
          carte: { genre: "E-mail", de: "Vie scolaire <vie-scolaire@college-jules-verne.fr>", objet: "Rappel : sortie au musée jeudi",
                   corps: "Bonjour, nous rappelons que la sortie au musée a lieu jeudi. Rendez-vous à 8 h 30 devant le collège. Bonne journée.",
                   lien: "" },
          question: "Ce message est-il fiable ou est-ce un piège ?",
          options: "FIABLE_PIEGE", bonne: 0,
          retenir: "Ce message ne demande rien : pas de lien, pas de mot de passe, pas d'urgence. Il est fiable." },

        { type: "choix", niv: ["5", "4"],
          carte: { genre: "SMS", de: "06 12 34 56 78", objet: "",
                   corps: "Votre colis est bloqué. Payez 1,99 € de frais de livraison pour le recevoir :",
                   lien: "colis-livraison-fr.info/payer" },
          question: "Ce message est-il fiable ou est-ce un piège ?",
          options: "FIABLE_PIEGE", bonne: 1,
          retenir: "Les faux SMS de colis sont très fréquents. Le petit montant (1,99 €) sert à te faire donner ta carte bancaire." },

        { type: "choix", niv: ["4", "3"],
          carte: { genre: "E-mail", de: "Instagram <security@instagrarn.com>", objet: "Quelqu'un a essayé de se connecter à ton compte",
                   corps: "Une connexion suspecte a été détectée. Confirme ton mot de passe en cliquant sur le lien, sinon ton compte sera bloqué.",
                   lien: "instagrarn.com/confirmer" },
          question: "Ce message est-il fiable ou est-ce un piège ?",
          options: "FIABLE_PIEGE", bonne: 1 },

        { type: "choix", niv: ["3"],
          question: "Dans le message « Instagram » précédent, quel est l'indice le plus important ?",
          options: [
            { t: "L'adresse : « instagrarn » s'écrit avec « r » + « n » au lieu de « m ».", ok: true },
            { t: "Le message est écrit en français.", pourquoi: "Les vraies entreprises écrivent aussi en français : ce n'est pas un indice." },
            { t: "Le message parle de connexion.", pourquoi: "Les vrais messages de sécurité parlent aussi de connexion. Regarde plutôt l'adresse." }
          ],
          aide: "Lis l'adresse de l'expéditeur lettre par lettre.",
          retenir: "Écrits en petit, « rn » ressemblent à « m ». Il faut toujours lire l'adresse en entier." },

        { type: "choix", niv: ["3"],
          carte: { genre: "E-mail", de: "Banque Horizon <info@banque-horizon.fr>", objet: "Votre relevé de compte est disponible",
                   corps: "Votre relevé du mois est disponible dans votre espace client, sur notre application. Rappel : nous ne vous demanderons jamais vos codes par e-mail.",
                   lien: "" },
          question: "Ce message est-il fiable ou est-ce un piège ?",
          options: "FIABLE_PIEGE", bonne: 0,
          retenir: "Il n'y a ni lien, ni urgence, ni demande de code. En cas de doute, on ouvre soi-même l'application officielle, sans cliquer dans le message." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Alors, qu'est-ce que l'hameçonnage ?",
          options: [
            { t: "Un faux message qui imite une source de confiance pour voler des informations.", ok: true },
            { t: "Une technique de pêche en mer.", pourquoi: "Le mot vient bien de la pêche (l'hameçon), mais ici c'est le pirate qui « pêche » tes informations !" },
            { t: "Un logiciel qui protège l'ordinateur.", pourquoi: "Non, ça c'est un antivirus." }
          ] }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "m4",
      titre: "Le chiffrement",
      icone: "🔐",
      resume: "Comprendre le chiffrement et décoder un message secret.",
      fiche: [
        { t: "Chiffrement symétrique : la [même] clé sert à chiffrer et à déchiffrer.", rep: ["même"] },
        { t: "Chiffrement asymétrique : on chiffre avec la clé [publique] et on déchiffre avec la clé [privée].", niv: ["4", "3"], rep: ["publique", "privée"] },
        { t: "La clé de mon message secret : [ ]", niv: ["5", "4"], rep: ["(selon le groupe)"] },
        { t: "La clé que j'ai trouvée par force brute : [ ]", niv: ["3"], rep: ["(selon le groupe)"] },
        { t: "Le code de César n'est pas sûr : il n'y a que [25] clés possibles.", niv: ["3"], rep: ["25"] }
      ],
      etapes: [
        { type: "info", niv: ["5", "4", "3"],
          titre: "Briefing de mission",
          texte: "<strong>Chiffrer</strong> un message, c'est le transformer pour qu'il soit illisible sans la <strong>clé</strong>. " +
                 "Seule la personne qui a la clé peut le <strong>déchiffrer</strong> (le remettre en clair).<br>" +
                 "Un agent de NovaTech t'a envoyé un message secret. Pour le lire, tu vas devoir le déchiffrer." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Dans le chiffrement symétrique…",
          options: [
            { t: "La même clé sert à chiffrer et à déchiffrer.", ok: true },
            { t: "Il n'y a pas besoin de clé.", pourquoi: "Sans clé, le message ne serait pas protégé." },
            { t: "Le message est envoyé deux fois.", pourquoi: "Non. « Symétrique » veut dire « pareil des deux côtés » : la même clé." }
          ],
          aide: "« Symétrique » veut dire « pareil des deux côtés »." },

        { type: "choix", niv: ["4", "3"],
          question: "Dans le chiffrement asymétrique…",
          options: [
            { t: "Une clé publique sert à chiffrer, une clé privée (secrète) sert à déchiffrer.", ok: true },
            { t: "Les deux clés sont identiques.", pourquoi: "Ça, c'est le chiffrement symétrique." },
            { t: "On chiffre seulement la moitié du message.", pourquoi: "Non : tout le message est chiffré." }
          ],
          retenir: "Tout le monde peut avoir ta clé publique pour t'écrire. Mais toi seul as la clé privée pour lire les messages." },

        { type: "choix", niv: ["5"],
          question: "Avec le code de César et la clé 3, chaque lettre avance de 3 places : A devient D, B devient E… Que devient le mot BONJOUR ?",
          options: [
            { t: "ERQMRXU", ok: true },
            { t: "CPOKPVS", pourquoi: "Ici, chaque lettre n'a avancé que d'une place. Avec la clé 3, il faut avancer de 3." },
            { t: "YLKGLRO", pourquoi: "Ici, les lettres ont reculé. Pour chiffrer, on avance." }
          ],
          aide: "B → C → D → E : B devient E. Fais pareil pour les autres lettres." },

        { type: "choix", niv: ["4"],
          question: "Tu es professeur. Tu veux envoyer un code secret à un collègue avec le code de César, clé 6 (chaque lettre avance de 6 places). Que devient le mot CODE ?",
          options: [
            { t: "IUJK", ok: true },
            { t: "DPEF", pourquoi: "Ici, chaque lettre n'a avancé que d'une place. Avec la clé 6, il faut avancer de 6." },
            { t: "WIXY", pourquoi: "Ici, les lettres ont reculé de 6. Pour chiffrer, on avance." }
          ],
          aide: "C + 6 places : D, E, F, G, H, I. Donc C devient I." },

        { type: "cesar", niv: ["5", "4", "3"],
          titre: "Le message secret",
          retenir: "Bravo, agent ! Tu as déchiffré le message." },

        { type: "choix", niv: ["3"],
          question: "Tu as trouvé la clé en les essayant une par une. Pourquoi le code de César n'est-il pas sûr aujourd'hui ?",
          options: [
            { t: "Il n'y a que 25 clés possibles : un ordinateur les teste toutes en un instant (force brute).", ok: true },
            { t: "Parce qu'il a été inventé par un Romain.", pourquoi: "L'âge d'une méthode n'est pas le problème. Le problème, c'est le petit nombre de clés." },
            { t: "Parce qu'il ne marche qu'en latin.", pourquoi: "Il marche avec n'importe quel alphabet. Le vrai problème : trop peu de clés." }
          ],
          retenir: "Les chiffrements modernes ont tellement de clés possibles que même un superordinateur ne peut pas toutes les essayer." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "m5",
      titre: "Le métier de hacker éthique",
      icone: "🛡️",
      resume: "Découvrir un vrai métier de la cybersécurité.",
      fiche: [
        { t: "Le hacker éthique cherche les [failles] d'un système pour les faire réparer.", rep: ["failles"] },
        { t: "Il travaille avec l'[autorisation] de l'entreprise.", rep: ["autorisation"] },
        { t: "Pour ce métier, on fait des études après le bac pendant [3] à [5] ans.", niv: ["5"], rep: ["3", "5"] },
        { t: "Niveau d'études : Bac + [3] à Bac + [5].", niv: ["4", "3"], rep: ["3", "5"] }
      ],
      etapes: [
        { type: "info", niv: ["5", "4", "3"],
          titre: "Briefing de mission",
          texte: "Les entreprises et les banques ont beaucoup de données à protéger. " +
                 "Elles font appel à des <strong>hackers éthiques</strong> : des « pirates bienveillants » qu'elles payent pour attaquer leurs propres systèmes, " +
                 "<strong>avec leur autorisation</strong>, afin de trouver les failles avant les vrais pirates." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Qu'est-ce qu'un hacker éthique ?",
          options: [
            { t: "Un « pirate bienveillant » qui teste les systèmes d'une entreprise, avec son autorisation.", ok: true },
            { t: "Un pirate qui vole des données pour les revendre.", pourquoi: "Ça, c'est un pirate malveillant. Le hacker éthique, lui, protège." },
            { t: "Un vendeur d'ordinateurs.", pourquoi: "Non, c'est un spécialiste de la sécurité informatique." }
          ] },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Quel est son rôle ?",
          options: [
            { t: "Trouver les failles (les faiblesses) d'un système pour qu'on les répare avant une attaque.", ok: true },
            { t: "Créer des virus pour s'amuser.", pourquoi: "Non : c'est illégal et c'est le contraire de son métier." },
            { t: "Réparer les imprimantes.", pourquoi: "Non, son métier, c'est la sécurité des systèmes informatiques." }
          ],
          retenir: "Une faille est une faiblesse qui permettrait à un pirate d'entrer dans le système, de l'abîmer ou de voler des données." },

        { type: "choix", niv: ["4"],
          question: "Quelle compétence est utile pour un hacker éthique ?",
          options: [
            { t: "De solides bases en informatique et en réseaux.", ok: true },
            { t: "Savoir conduire un camion.", pourquoi: "Ce n'est pas utile pour ce métier." },
            { t: "Connaître toutes les capitales du monde.", pourquoi: "C'est intéressant, mais pas utile pour ce métier." }
          ] },

        { type: "choix", niv: ["3"],
          question: "En plus de l'informatique, que doit aussi connaître un hacker éthique ?",
          options: [
            { t: "Le droit de la cybersécurité (les lois).", ok: true },
            { t: "Le code de la route.", pourquoi: "Ce n'est pas lié à son métier." },
            { t: "Les règles du football.", pourquoi: "Ce n'est pas lié à son métier." }
          ],
          retenir: "Il doit savoir ce qu'il a le droit de faire ou non : sans autorisation, attaquer un système est un délit." },

        { type: "choix", niv: ["3"],
          question: "Qu'est-ce qui fait la différence entre un hacker éthique et un pirate ?",
          options: [
            { t: "Il agit avec l'autorisation de l'entreprise, pour la protéger.", ok: true },
            { t: "Il utilise des ordinateurs différents.", pourquoi: "Non : ils utilisent souvent les mêmes outils et les mêmes techniques." },
            { t: "Il travaille seulement la nuit.", pourquoi: "Non, c'est un métier avec des horaires comme les autres." }
          ] },

        { type: "choix", niv: ["5"],
          question: "Pour devenir hacker éthique, il faut faire des études…",
          options: [
            { t: "Après le bac, pendant 3 à 5 ans.", ok: true },
            { t: "Aucune : il suffit de jouer aux jeux vidéo.", pourquoi: "Non : c'est un métier qui demande une vraie formation." },
            { t: "Jusqu'au brevet seulement.", pourquoi: "Non : il faut continuer après le bac." }
          ] },

        { type: "choix", niv: ["4", "3"],
          question: "Quel niveau d'études faut-il en général pour devenir hacker éthique ?",
          options: [
            { t: "Bac +3 à Bac +5 (licence, bachelor ou master).", ok: true },
            { t: "Aucun diplôme : il suffit de jouer aux jeux vidéo.", pourquoi: "Non : c'est un métier qui demande une vraie formation." },
            { t: "Le brevet des collèges.", pourquoi: "Non : il faut continuer après le bac." }
          ] }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "m6",
      titre: "Stop à la cyberviolence",
      icone: "🤝",
      resume: "Reconnaître la cyberviolence et savoir à qui en parler.",
      fiche: [
        { coche: "Coche les situations de cyberviolence :", options: ["des moqueries tous les soirs dans un groupe de classe", "un faux compte avec le nom et la photo d'un élève", "une vidéo drôle de mon chat envoyée à une amie"], bonnes: [0, 1] },
        { t: "Si je suis victime ou témoin, j'en parle à un [adulte] de confiance.", rep: ["adulte"] },
        { t: "Numéro national gratuit et anonyme : le [3018].", rep: ["3018"] }
      ],
      etapes: [
        { type: "info", niv: ["5", "4", "3"],
          titre: "Briefing de mission",
          texte: "La <strong>cyberviolence</strong> est un acte agressif et volontaire, fait avec des outils numériques : messages, SMS, réseaux sociaux, jeux en ligne… " +
                 "Elle a deux grandes formes :<ul>" +
                 "<li><strong>les paroles malveillantes</strong> : insultes, moqueries, photos ou vidéos publiées sans accord ;</li>" +
                 "<li><strong>l'intrusion dans les données personnelles</strong> : se faire passer pour quelqu'un (usurpation d'identité), voler ses données.</li></ul>" +
                 "Pour chaque situation, choisis la bonne réponse." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Dans un groupe de discussion de la classe, des élèves envoient des moqueries à Léa tous les soirs.",
          options: "CYBERVIOLENCE", bonne: 0 },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Quelqu'un crée un faux compte avec le nom et la photo de Tom pour publier des messages.",
          options: "CYBERVIOLENCE", bonne: 1,
          retenir: "Se faire passer pour quelqu'un, c'est de l'usurpation d'identité. C'est puni par la loi." },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Inès envoie à son amie une vidéo drôle de son chat.",
          options: "CYBERVIOLENCE", bonne: 2 },

        { type: "choix", niv: ["4", "3"],
          question: "Une photo de Sami est publiée sur un réseau social alors qu'il n'était pas d'accord.",
          options: "CYBERVIOLENCE", bonne: 0,
          retenir: "Avant de publier la photo de quelqu'un, il faut toujours lui demander son accord." },

        { type: "choix", niv: ["3"],
          question: "Un élève récupère le mot de passe d'un camarade et lit ses messages privés.",
          options: "CYBERVIOLENCE", bonne: 1 },

        { type: "choix", niv: ["5", "4", "3"],
          question: "Tu es victime ou témoin de cyberviolence. Que fais-tu ?",
          options: [
            { t: "J'en parle à un adulte de confiance. Je peux aussi appeler le 3018.", ok: true },
            { t: "Je réponds par des insultes.", pourquoi: "Répondre risque d'aggraver la situation. Il vaut mieux garder les preuves et en parler." },
            { t: "Je garde ça pour moi.", pourquoi: "Personne ne doit rester seul face à la cyberviolence. En parler, c'est déjà se protéger." }
          ],
          retenir: "Le 3018 est gratuit, anonyme et confidentiel. Il répond 7 jours sur 7, de 9 h à 23 h, par téléphone, par tchat sur 3018.fr ou avec l'application 3018." }
      ]
    }
  ],

  /* Listes d'options réutilisées */
  listes: {
    ATTAQUES: ["La force brute", "L'ingénierie sociale", "L'exploration du réseau", "Le vol de données sur un site"],
    FIABLE_PIEGE: ["Fiable", "Piège"],
    CYBERVIOLENCE: ["Cyberviolence : paroles malveillantes", "Cyberviolence : intrusion dans les données personnelles", "Ce n'est pas de la cyberviolence"]
  },

  /* ------------------------------------------------------------------ */
  /* SYNTHÈSE (contenu du coffre-fort)                                   */
  /* ------------------------------------------------------------------ */
  synthese: [
    { titre: "La cybersécurité, c'est quoi ?",
      texte: "La cybersécurité consiste à protéger les données, les réseaux et les programmes contre les attaques numériques, appelées <strong>cyberattaques</strong>. " +
             "Quand on navigue sur Internet, on laisse des <strong>traces numériques</strong> (nos recherches, notre adresse IP…). " +
             "Des pirates peuvent s'en servir pour voler nos données personnelles : mots de passe, codes de carte bancaire… puis les utiliser, les modifier, les détruire ou les revendre." },
    { titre: "Les 4 techniques d'attaque les plus utilisées",
      liste: ["<strong>La force brute</strong> : essayer tous les mots de passe possibles.",
              "<strong>L'ingénierie sociale</strong> : manipuler une personne pour qu'elle donne ses informations (exemple : l'hameçonnage).",
              "<strong>L'exploration du réseau</strong> sur lequel la personne est connectée.",
              "<strong>Le vol de données</strong> sur un site où la personne a créé un compte."] },
    { titre: "Comment me protéger ?",
      liste: ["Un mot de passe <strong>long</strong> : au moins 12 caractères (majuscules, minuscules, chiffres, caractères spéciaux), ou une longue phrase de passe.",
              "Un mot de passe <strong>différent pour chaque compte</strong>, et la <strong>double authentification</strong> quand c'est possible.",
              "<strong>Chiffrer</strong> ses données importantes.",
              "<strong>Limiter</strong> ses traces numériques.",
              "Vérifier chaque e-mail ou SMS : expéditeur, urgence, demande de code, adresse du lien."] },
    { titre: "Le chiffrement",
      texte: "Chiffrer, c'est rendre un message illisible sans la clé. " +
             "<strong>Symétrique</strong> : la même clé sert à chiffrer et à déchiffrer. " +
             "<strong>Asymétrique</strong> : une clé publique pour chiffrer, une clé privée pour déchiffrer. " +
             "Le code de César est un chiffrement symétrique très ancien : avec seulement 25 clés possibles, il est trop facile à casser aujourd'hui." },
    { titre: "Hacker éthique : un vrai métier",
      texte: "Les entreprises font appel à des <strong>hackers éthiques</strong>, des « pirates bienveillants » qui testent leurs systèmes <strong>avec leur autorisation</strong>. " +
             "Ils cherchent les <strong>failles</strong> (les faiblesses) pour qu'on les répare avant une attaque. " +
             "Pour exercer ce métier, il faut en général faire des études de Bac +3 à Bac +5." },
    { titre: "La cyberviolence",
      texte: "La cyberviolence est un acte agressif et volontaire, fait avec des outils numériques. " +
             "Elle prend la forme de <strong>paroles malveillantes</strong> (insultes, photos ou vidéos publiées sans accord) ou d'<strong>intrusion dans les données personnelles</strong> (usurpation d'identité, vol de données). " +
             "Si j'en suis victime ou témoin, j'en parle à un adulte de confiance. Je peux appeler le <strong>3018</strong> : gratuit, anonyme et confidentiel, 7 jours sur 7 de 9 h à 23 h." }
  ]
};
