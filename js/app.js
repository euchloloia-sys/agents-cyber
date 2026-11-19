/* ==========================================================================
   AGENTS CYBER — Moteur du jeu
   Vanilla JS, sans dépendance, sans serveur. Fonctionne en ouvrant
   index.html directement ou via GitHub Pages.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.CYBER;
  var CFG = window.CYBER_CONFIG;
  var vue = document.getElementById("vue");
  var annonceur = document.getElementById("annonce");

  /* ------------------------------------------------------------------ */
  /* Outils                                                              */
  /* ------------------------------------------------------------------ */
  function $(sel, racine) { return (racine || document).querySelector(sel); }
  function $$(sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function texteBrut(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html).replace(/<li>/g, "<li>. ").replace(/<br\s*\/?>/g, ". ");
    return d.textContent.replace(/\s+/g, " ").trim();
  }
  function annoncer(t) {
    annonceur.textContent = "";
    setTimeout(function () { annonceur.textContent = t; }, 60);
  }

  var stockage = {
    lire: function (k, defaut) {
      try { var v = localStorage.getItem("agentscyber." + k); return v ? JSON.parse(v) : defaut; }
      catch (e) { return defaut; }
    },
    ecrire: function (k, v) { try { localStorage.setItem("agentscyber." + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible : le jeu continue */ } },
    effacer: function (k) { try { localStorage.removeItem("agentscyber." + k); } catch (e) {} }
  };

  /* Empreinte (hash) rapide et déterministe : cyrb53 */
  function cyrb53(str, seed) {
    seed = seed || 0;
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  /* Générateur pseudo-aléatoire à graine (pour mélanger les réponses de façon stable) */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function melanger(liste, graine) {
    var r = mulberry32(cyrb53(graine) % 4294967296), t = liste.slice();
    for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var x = t[i]; t[i] = t[j]; t[j] = x; }
    return t;
  }

  /* Alphabet des codes : sans 0/O, 1/I/L, 2/Z, 5/S, 6/G, 8/B, ni b/d/p/q (confusions fréquentes chez les élèves dys) */
  var ALPHA = "ACEFHJKMNRTUVXY3479";
  var PHONETIQUE = {
    A: "A comme Avion", C: "C comme Chat", E: "E comme Éléphant", F: "F comme Fusée", H: "H comme Hibou",
    J: "J comme Jardin", K: "K comme Koala", M: "M comme Maison", N: "N comme Navire", R: "R comme Robot",
    T: "T comme Tortue", U: "U comme Usine", V: "V comme Vélo", X: "X comme Xylophone", Y: "Y comme Yaourt",
    "3": "chiffre 3", "4": "chiffre 4", "7": "chiffre 7", "9": "chiffre 9"
  };
  function epeler(code) {
    return code.split("").map(function (c) { return PHONETIQUE[c] || c; }).join(", ");
  }
  function normaliser(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  function nouvelAgent() {
    var a = new Uint32Array(4);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (x) { return ALPHA[x % ALPHA.length]; }).join("");
  }
  function agentValide(a) { return new RegExp("^[" + ALPHA + "]{4}$").test(a); }

  var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function decaler(lettre, k) {
    var i = ABC.indexOf(lettre);
    return i < 0 ? lettre : ABC[((i + k) % 26 + 26) % 26];
  }
  function chiffrer(mot, k) { return mot.split("").map(function (l) { return decaler(l, k); }).join(""); }

  function cesarPour(agent, niv) {
    var c = D.cesar[niv];
    var n = cyrb53([CFG.SEL, agent, niv, "cesar"].join("|"));
    var mot = c.mots[n % c.mots.length];
    var etendue = c.cleMax - c.cleMin + 1;
    var cle = c.cleMin + (Math.floor(n / c.mots.length) % etendue);
    return { mot: mot, cle: cle, chiffre: chiffrer(mot, cle), donnee: c.cleDonnee };
  }
  function codeMission(agent, niv, mid) {
    if (mid === "m4") return cesarPour(agent, niv).mot;
    var n = cyrb53([CFG.SEL, agent, niv, mid].join("|")), s = "";
    for (var i = 0; i < 4; i++) { s += ALPHA[n % ALPHA.length]; n = Math.floor(n / ALPHA.length); }
    return s;
  }

  function missionParId(id) { return D.missions.filter(function (m) { return m.id === id; })[0]; }
  function numMission(id) { return D.missions.map(function (m) { return m.id; }).indexOf(id) + 1; }
  function etapesDe(m, niv) { return m.etapes.filter(function (e) { return e.niv.indexOf(niv) >= 0; }); }
  /* Une mission est verrouillée tant que la précédente n'est pas réussie */
  function estVerrouillee(mid) {
    var i = numMission(mid) - 1;
    return i > 0 && !(partie && partie.faites[D.missions[i - 1].id]);
  }
  function nomNiveau(n) { return D.niveaux[n] ? D.niveaux[n].nom : "?"; }

  /* ------------------------------------------------------------------ */
  /* État de la partie                                                   */
  /* ------------------------------------------------------------------ */
  var partie = stockage.lire("partie", null);
  function sauver() { stockage.ecrire("partie", partie); majBadge(); }
  function majBadge() {
    var b = $("#badge-agent");
    if (partie && partie.agent) {
      b.hidden = false;
      b.textContent = "Agent " + partie.agent + " · " + nomNiveau(partie.niv);
    } else { b.hidden = true; }
  }

  /* ------------------------------------------------------------------ */
  /* Réglages                                                            */
  /* ------------------------------------------------------------------ */
  function reglagesDefaut() {
    var sombre = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    var calme = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    return { taille: "100", police: "arial", interligne: false, lettres: false,
             theme: sombre ? "sombre" : "clair", calme: calme, voix: "", debit: 1, auto: false,
             paragraphes: false, alterne: false, guide: false, clic: false, lignes: false };
  }
  var reglages = Object.assign(reglagesDefaut(), stockage.lire("reglages", {}));

  function appliquerReglages() {
    var h = document.documentElement;
    h.style.fontSize = reglages.taille + "%";
    h.setAttribute("data-theme", reglages.theme);
    h.setAttribute("data-police", reglages.police);
    h.setAttribute("data-interligne", reglages.interligne ? "large" : "normal");
    h.setAttribute("data-lettres", reglages.lettres ? "large" : "normal");
    h.setAttribute("data-calme", reglages.calme ? "oui" : "non");
    h.setAttribute("data-paragraphes", reglages.paragraphes ? "large" : "normal");
    h.setAttribute("data-lignes", reglages.lignes ? "courtes" : "normales");
    h.setAttribute("data-alterne", reglages.alterne ? "oui" : "non");
    h.setAttribute("data-clic", reglages.clic ? "oui" : "non");
    $("#guide").hidden = !reglages.guide;
    if (reglages.alterne) colorerMots(vue); else decolorerMots(vue);
  }

  /* ---------- Mots en deux couleurs : chaque mot est entouré d'un <span> */
  var EXCLUS = "script,style,svg,input,textarea,select,option,.code-geant,.cesar__message,.table-cesar,.note-lettre,.visuellement-cache,.mot";
  function colorerMots(racine) {
    var marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        return n.parentElement && n.parentElement.closest(EXCLUS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var noeuds = [], n, compte = 0;
    while ((n = marcheur.nextNode())) noeuds.push(n);
    noeuds.forEach(function (t) {
      var frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (morceau) {
        if (!morceau) return;
        if (/^\s+$/.test(morceau)) { frag.appendChild(document.createTextNode(morceau)); return; }
        var sp = document.createElement("span");
        sp.className = "mot " + (compte++ % 2 ? "mot-b" : "mot-a");
        sp.textContent = morceau;
        frag.appendChild(sp);
      });
      t.parentNode.replaceChild(frag, t);
    });
  }
  function decolorerMots(racine) {
    $$("span.mot", racine).forEach(function (sp) { sp.replaceWith(document.createTextNode(sp.textContent)); });
    racine.normalize();
  }
  var observateur = new MutationObserver(function () {
    if (!reglages.alterne) return;
    observateur.disconnect();
    colorerMots(vue);
    observateur.observe(vue, { childList: true, subtree: true });
  });
  observateur.observe(vue, { childList: true, subtree: true });
  function remplirFormReglages() {
    var f = $("#dlg-reglages form");
    $$('input[name="taille"]', f).forEach(function (i) { i.checked = i.value === reglages.taille; });
    $$('input[name="police"]', f).forEach(function (i) { i.checked = i.value === reglages.police; });
    $$('input[name="theme"]', f).forEach(function (i) { i.checked = i.value === reglages.theme; });
    f.interligne.checked = reglages.interligne;
    f.lettres.checked = reglages.lettres;
    f.calme.checked = reglages.calme;
    f.auto.checked = reglages.auto;
    ["paragraphes", "alterne", "guide", "clic", "lignes"].forEach(function (k) { f[k].checked = !!reglages[k]; });
    f.debit.value = reglages.debit;
    $("#voix-debit-val").textContent = reglages.debit;
    remplirVoix();
  }
  function lireFormReglages() {
    var f = $("#dlg-reglages form");
    var val = function (n) { var x = $('input[name="' + n + '"]:checked', f); return x ? x.value : reglages[n]; };
    reglages.taille = val("taille");
    reglages.police = val("police");
    reglages.theme = val("theme");
    reglages.interligne = f.interligne.checked;
    reglages.lettres = f.lettres.checked;
    reglages.calme = f.calme.checked;
    reglages.auto = f.auto.checked;
    ["paragraphes", "alterne", "guide", "clic", "lignes"].forEach(function (k) { reglages[k] = f[k].checked; });
    reglages.debit = parseFloat(f.debit.value) || 1;
    reglages.voix = f.voix.value;
    $("#voix-debit-val").textContent = reglages.debit;
    stockage.ecrire("reglages", reglages);
    appliquerReglages();
  }

  /* ------------------------------------------------------------------ */
  /* Lecture audio (synthèse vocale du navigateur, hors ligne)           */
  /* ------------------------------------------------------------------ */
  var voixDispo = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var boutonActif = null;

  function voixFr() {
    if (!voixDispo) return [];
    return speechSynthesis.getVoices().filter(function (v) { return /^fr/i.test(v.lang); });
  }
  function remplirVoix() {
    var sel = $("#voix-choix");
    if (!voixDispo) {
      $(".voix-indispo").hidden = false;
      $$("#reglages-voix select, #reglages-voix input, #voix-test").forEach(function (e) { e.disabled = true; });
      return;
    }
    var liste = voixFr();
    sel.innerHTML = '<option value="">Voix française par défaut</option>' +
      liste.map(function (v) { return '<option value="' + esc(v.name) + '">' + esc(v.name) + " (" + esc(v.lang) + ")</option>"; }).join("");
    sel.value = reglages.voix || "";
  }
  if (voixDispo && "onvoiceschanged" in speechSynthesis) {
    speechSynthesis.onvoiceschanged = function () { if ($("#dlg-reglages").open) remplirVoix(); };
  }

  function arreterLecture() {
    if (voixDispo) speechSynthesis.cancel();
    if (boutonActif) { boutonActif.setAttribute("aria-pressed", "false"); boutonActif = null; }
  }
  /* Découpe en phrases : évite que Chrome coupe les textes longs */
  function decouper(texte) {
    var morceaux = texte.match(/[^.!?…:;]+[.!?…:;]*/g) || [texte];
    return morceaux.map(function (m) { return m.trim(); }).filter(Boolean);
  }
  function parler(texte, bouton) {
    if (!voixDispo) return;
    arreterLecture();
    var morceaux = decouper(texte);
    var choisie = voixFr().filter(function (v) { return v.name === reglages.voix; })[0] || voixFr()[0];
    if (bouton) { boutonActif = bouton; bouton.setAttribute("aria-pressed", "true"); }
    morceaux.forEach(function (m, i) {
      var u = new SpeechSynthesisUtterance(m);
      u.lang = "fr-FR";
      u.rate = reglages.debit;
      if (choisie) u.voice = choisie;
      if (i === morceaux.length - 1) {
        u.onend = u.onerror = function () { if (boutonActif === bouton) arreterLecture(); };
      }
      speechSynthesis.speak(u);
    });
  }
  /* Crée un bouton « Écouter » ; texte = fonction qui renvoie le texte à lire */
  function boutonEcouter(libelle) {
    if (!voixDispo) return "";
    return '<button type="button" class="btn btn-ecouter ne-pas-imprimer" data-ecouter aria-pressed="false">' +
      '<span aria-hidden="true">🔊</span> ' + esc(libelle || "Écouter") + "</button>";
  }
  function brancherEcoute(racine, fournisseurs) {
    $$("[data-ecouter]", racine).forEach(function (b, i) {
      b.addEventListener("click", function () {
        if (b.getAttribute("aria-pressed") === "true") { arreterLecture(); return; }
        var f = fournisseurs[i];
        parler(typeof f === "function" ? f() : f, b);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Dialogue de confirmation                                            */
  /* ------------------------------------------------------------------ */
  function confirmer(texte, libelleOui) {
    return new Promise(function (resoudre) {
      var d = $("#dlg-confirmer");
      $("#confirmer-texte").textContent = texte;
      $('#dlg-confirmer button[value="oui"]').textContent = libelleOui || "Oui";
      d.returnValue = "";
      d.addEventListener("close", function f() { d.removeEventListener("close", f); resoudre(d.returnValue === "oui"); });
      d.showModal();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Routeur (#/vue/parametre)                                           */
  /* ------------------------------------------------------------------ */
  var VUES = {};
  function aller(chemin) {
    if (location.hash === "#/" + chemin) router(); else location.hash = "#/" + chemin;
  }
  function router() {
    var h = location.hash;
    if (h && h.indexOf("#/") !== 0) return;            // ancres internes : on ignore
    var morceaux = (h || "#/").slice(2).split("/");
    var nom = morceaux[0] || "accueil";
    var fn = VUES[nom] || VUES.accueil;
    arreterLecture();
    fn(morceaux[1]);
    window.scrollTo(0, 0);
    var titre = $("h1", vue);
    if (titre) {
      titre.setAttribute("tabindex", "-1");
      titre.focus({ preventScroll: true });
      document.title = titre.textContent.trim() + " — Agents Cyber";
    }
  }
  function exigePartie() {
    if (!partie || !partie.agent || !partie.prenoms) { partie = partie && partie.prenoms ? partie : null; aller("accueil"); return false; }
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* VUE : Accueil                                                       */
  /* ------------------------------------------------------------------ */
  VUES.accueil = function () {
    var intro = "Bienvenue, futur agent ! Tu vas réaliser 6 missions sur la cybersécurité. " +
      "À chaque mission réussie, tu obtiens un code. Écris chaque code sur ta fiche. " +
      "À la fin, tes codes ouvriront le coffre-fort. Prends ton temps : il n'y a pas de chronomètre.";

    var enCours = partie && partie.agent ?
      '<section class="bloc bloc--info" aria-labelledby="t-encours">' +
        '<h2 id="t-encours">Tu as une partie en cours</h2>' +
        "<p>Agent <strong>" + esc(partie.agent) + "</strong>, niveau " + nomNiveau(partie.niv) + ". " +
        Object.keys(partie.faites || {}).length + " mission(s) réussie(s) sur " + D.missions.length + ".</p>" +
        '<div class="actions"><a class="btn btn--principal" href="#/qg">Continuer ma partie</a>' +
        '<button type="button" class="btn btn--danger" id="btn-nouvelle">Commencer une nouvelle partie</button></div>' +
      "</section>" : "";

    var niveaux = Object.keys(D.niveaux).sort().reverse().map(function (k) {
      return '<label class="option option--classe"><input type="radio" name="niv" value="' + k + '">' +
        "<strong>" + esc(D.niveaux[k].nom) + "</strong></label>";
    }).join("");

    vue.innerHTML =
      '<div class="bloc__tete"><h1>Bienvenue, futur agent !</h1>' + boutonEcouter("Écouter") + "</div>" +
      '<p class="intro">Tu vas réaliser <strong>6 missions</strong> sur la cybersécurité. ' +
      "À chaque mission réussie, tu obtiens un <strong>code</strong>. Écris chaque code sur ta fiche. " +
      "À la fin, tes codes ouvriront le <strong>coffre-fort</strong>.</p>" +
      "<p>Prends ton temps : il n'y a pas de chronomètre. Tu peux faire une pause et revenir plus tard.</p>" +
      enCours +
      '<form class="bloc" id="form-depart" novalidate aria-labelledby="t-depart">' +
        '<h2 id="t-depart">' + (enCours ? "Ou bien : nouvelle partie" : "Préparer ma mission") + "</h2>" +
        '<fieldset aria-describedby="err-niv"><legend>1. Dans quelle classe es-tu ?</legend>' +
          '<div class="choix-cartes">' + niveaux + "</div>" +
          '<p id="err-niv" class="coffre__statut coffre__statut--non" hidden>Choisis ta classe pour commencer.</p>' +
        "</fieldset>" +
        "<fieldset><legend>2. Tu travailles…</legend>" +
          '<div class="choix-ligne">' +
            '<label><input type="radio" name="mode" value="seul" checked> Seul(e)</label>' +
            '<label><input type="radio" name="mode" value="binome"> En binôme</label>' +
          "</div></fieldset>" +
        '<fieldset><legend>3. Ton prénom</legend>' +
          '<div class="champ"><label for="prenom1">Prénom <span aria-hidden="true">*</span><span class="visuellement-cache"> (obligatoire)</span></label>' +
          '<input type="text" id="prenom1" autocomplete="off" maxlength="30" required aria-required="true" aria-describedby="err-p1 aide-prenoms">' +
          '<p class="coffre__statut coffre__statut--non" id="err-p1"></p></div>' +
          '<div class="champ" id="champ-p2" hidden><label for="prenom2">Prénom de ton binôme <span aria-hidden="true">*</span><span class="visuellement-cache"> (obligatoire)</span></label>' +
          '<input type="text" id="prenom2" autocomplete="off" maxlength="30" aria-describedby="err-p2">' +
          '<p class="coffre__statut coffre__statut--non" id="err-p2"></p></div>' +
          '<p class="champ__aide" id="aide-prenoms">Ton prénom apparaîtra sur la synthèse. Rien n\'est envoyé sur Internet.</p>' +
        "</fieldset>" +
        '<div class="actions"><button class="btn btn--principal btn--grand" type="submit">Commencer la mission <span aria-hidden="true">➜</span></button></div>' +
      "</form>" +
      '<details class="bloc"><summary><strong>J\'ai déjà un numéro d\'agent</strong> (changement d\'ordinateur)</summary>' +
        '<form id="form-reprendre" novalidate>' +
          '<div class="champ"><label for="rep-agent">Mon numéro d\'agent (4 caractères)</label>' +
          '<input type="text" id="rep-agent" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="err-rep"></div>' +
          '<div class="champ"><label for="rep-prenoms">Prénom(s) (obligatoire)</label>' +
          '<input type="text" id="rep-prenoms" maxlength="60" autocomplete="off" aria-required="true"></div>' +
          '<div class="champ"><label for="rep-niv">Ma classe</label><select id="rep-niv">' +
            Object.keys(D.niveaux).sort().reverse().map(function (k) { return '<option value="' + k + '">' + D.niveaux[k].nom + "</option>"; }).join("") +
          "</select></div>" +
          '<p id="err-rep" class="coffre__statut coffre__statut--non" role="status"></p>' +
          '<button class="btn" type="submit">Reprendre avec ce numéro</button>' +
        "</form></details>";

    brancherEcoute(vue, [intro]);

    var bn = $("#btn-nouvelle");
    if (bn) bn.addEventListener("click", function () {
      confirmer("Ta partie actuelle sera effacée de cet appareil. Pense à garder ta fiche avec tes codes. Continuer ?", "Oui, nouvelle partie")
        .then(function (ok) { if (ok) { partie = null; stockage.effacer("partie"); majBadge(); VUES.accueil(); $("h1", vue).focus(); } });
    });

    var majBinome = function () {
      var bin = $('input[name="mode"]:checked').value === "binome";
      $("#champ-p2").hidden = !bin;
      $("#prenom2").required = bin;
      $("#prenom2").setAttribute("aria-required", bin ? "true" : "false");
      $("label[for=prenom1]").firstChild.textContent = bin ? "Ton prénom " : "Prénom ";
    };
    $$('input[name="mode"]').forEach(function (r) { r.addEventListener("change", majBinome); });

    $("#form-depart").addEventListener("submit", function (e) {
      e.preventDefault();
      var niv = $('input[name="niv"]:checked', this);
      var err = $("#err-niv");
      err.hidden = !!niv;
      var bin = $('input[name="mode"]:checked', this).value === "binome";
      var p1 = $("#prenom1").value.trim(), p2 = $("#prenom2").value.trim();
      var verif = function (id, val, msg) {
        var ch = $("#" + id), st = $("#err-" + (id === "prenom1" ? "p1" : "p2"));
        if (val) { ch.removeAttribute("aria-invalid"); st.textContent = ""; return true; }
        ch.setAttribute("aria-invalid", "true"); st.textContent = msg; return false;
      };
      var ok1 = verif("prenom1", p1, "Écris ton prénom pour commencer.");
      var ok2 = !bin || verif("prenom2", p2, "Écris le prénom de ton binôme.");
      if (!bin) { $("#prenom2").removeAttribute("aria-invalid"); $("#err-p2").textContent = ""; }
      if (!niv || !ok1 || !ok2) {
        var premier = !niv ? $('input[name="niv"]', this) : !ok1 ? $("#prenom1") : $("#prenom2");
        premier.focus();
        annoncer(!niv ? err.textContent : !ok1 ? "Écris ton prénom pour commencer." : "Écris le prénom de ton binôme.");
        return;
      }
      partie = {
        agent: nouvelAgent(), niv: niv.value,
        mode: $('input[name="mode"]:checked', this).value,
        prenoms: bin ? p1 + " et " + p2 : p1,
        faites: {}, pos: {}, debut: new Date().toISOString()
      };
      sauver();
      aller("briefing");
    });

    $("#form-reprendre").addEventListener("submit", function (e) {
      e.preventDefault();
      var champ = $("#rep-agent"), a = normaliser(champ.value), err = $("#err-rep");
      if (!agentValide(a)) {
        champ.setAttribute("aria-invalid", "true");
        err.textContent = "Ce numéro n'est pas valide. Il fait 4 caractères, par exemple : K7FA.";
        champ.focus();
        return;
      }
      var rp = $("#rep-prenoms").value.trim();
      if (!rp) {
        $("#rep-prenoms").setAttribute("aria-invalid", "true");
        err.textContent = "Écris ton prénom (ou vos deux prénoms) pour reprendre.";
        $("#rep-prenoms").focus();
        return;
      }
      partie = { agent: a, niv: $("#rep-niv").value, mode: / et /.test(rp) ? "binome" : "seul", prenoms: rp.slice(0, 60), faites: {}, pos: {}, debut: new Date().toISOString(), repris: true };
      sauver();
      aller("qg");
    });
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Briefing + numéro d'agent                                     */
  /* ------------------------------------------------------------------ */
  VUES.briefing = function () {
    if (!exigePartie()) return;
    var a = partie.agent;
    vue.innerHTML =
      '<div class="bloc__tete"><h1>Ta mission, agent</h1>' + boutonEcouter("Écouter le briefing") + "</div>" +
      '<div class="bloc"><p>' + esc(D.briefing) + "</p></div>" +
      '<section class="bloc bloc--info centre" aria-labelledby="t-num">' +
        '<h2 id="t-num">Ton numéro d\'agent</h2>' +
        '<ul class="code-geant" aria-label="Numéro d\'agent : ' + esc(a.split("").join(" ")) + '">' +
          a.split("").map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
        '<p class="code-epele">' + esc(epeler(a)) + "</p>" +
        "<p><strong>Écris-le maintenant</strong> en haut de ta fiche, dans la case « Numéro d'agent ».</p>" +
        '<div class="actions" style="justify-content:center">' + boutonEcouter("Écouter mon numéro") + "</div>" +
      "</section>" +
      '<div class="actions"><a class="btn btn--principal btn--grand" href="#/qg">C\'est noté ! Aller au QG <span aria-hidden="true">➜</span></a></div>';
    brancherEcoute(vue, [D.briefing, "Ton numéro d'agent est : " + epeler(a) + ". Écris-le en haut de ta fiche."]);
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Quartier général                                              */
  /* ------------------------------------------------------------------ */
  VUES.qg = function () {
    if (!exigePartie()) return;
    var nbFaites = Object.keys(partie.faites).length, total = D.missions.length;
    var conseil = D.missions.filter(function (m) { return !partie.faites[m.id]; })[0];   // prochaine mission à faire
    var lectures = [];

    var cartes = D.missions.map(function (m, i) {
      var faite = !!partie.faites[m.id];
      if (!faite && estVerrouillee(m.id)) {
        lectures.push("Mission " + (i + 1) + " : " + m.titre + ". " + m.resume + " Cette mission est verrouillée : réussis d'abord la mission " + i + ".");
        return '<li><article class="mission-carte mission-carte--verrou" aria-labelledby="t-' + m.id + '">' +
          '<span class="mission-carte__num">Mission ' + (i + 1) + "</span>" +
          '<h3 id="t-' + m.id + '"><span aria-hidden="true">🔒</span> ' + esc(m.titre) + "</h3>" +
          "<p>" + esc(m.resume) + "</p>" +
          '<p class="mission-carte__etat">Verrouillée : réussis d\'abord la mission ' + i + ".</p>" +
          '<div class="mission-carte__actions">' + boutonEcouter("Écouter") + "</div></article></li>";
      }
      var pos = partie.pos[m.id] || 0;
      var nb = etapesDe(m, partie.niv).length;
      var etat = faite ? '<p class="mission-carte__etat">✓ Réussie — code : <span class="mission-carte__code">' + esc(codeMission(partie.agent, partie.niv, m.id)) + "</span></p>"
        : pos > 0 ? '<p class="mission-carte__etat">En cours : étape ' + (pos + 1) + " sur " + nb + "</p>"
        : '<p class="mission-carte__etat">À faire</p>';
      var libelle = faite ? "Refaire" : pos > 0 ? "Continuer" : "Commencer";
      lectures.push("Mission " + (i + 1) + " : " + m.titre + ". " + m.resume + " " +
        (faite ? "Mission réussie. Ton code est : " + (m.id === "m4" ? codeMission(partie.agent, partie.niv, m.id) : epeler(codeMission(partie.agent, partie.niv, m.id))) + "."
               : pos > 0 ? "Mission en cours, étape " + (pos + 1) + " sur " + nb + "." : "Mission à faire."));
      return '<li><article class="mission-carte' + (faite ? " mission-carte--faite" : "") + '" aria-labelledby="t-' + m.id + '">' +
        '<span class="mission-carte__num">Mission ' + (i + 1) + "</span>" +
        '<h3 id="t-' + m.id + '"><span aria-hidden="true">' + m.icone + "</span> " + esc(m.titre) + "</h3>" +
        "<p>" + esc(m.resume) + "</p>" + etat +
        '<div class="mission-carte__actions">' +
        '<a class="btn' + (conseil && conseil.id === m.id ? " btn--principal" : "") + '" href="#/mission/' + m.id + '" aria-label="' + libelle + " la mission " + (i + 1) + " : " + esc(m.titre) + '">' + libelle + "</a>" +
        boutonEcouter("Écouter") + "</div>" +
        "</article></li>";
    }).join("");

    vue.innerHTML =
      "<h1>Quartier général</h1>" +
      '<p class="consigne-ordre"><span aria-hidden="true">➜</span> Les missions se font <strong>dans l\'ordre, l\'une après l\'autre</strong>. ' +
      "Quand tu réussis une mission, la suivante s'ouvre.</p>" +
      '<div class="progression"><p class="progression__texte">' + nbFaites + " mission(s) réussie(s) sur " + total + "</p>" +
      '<div class="progression__barre" aria-hidden="true"><span style="width:' + Math.round(100 * nbFaites / total) + '%"></span></div></div>' +
      '<ol class="missions">' + cartes + "</ol>" +
      '<section class="bloc ' + (nbFaites === total ? "bloc--info" : "") + '" aria-labelledby="t-coffre">' +
        '<h2 id="t-coffre"><span aria-hidden="true">🗄️</span> Le coffre-fort</h2>' +
        "<p>" + (nbFaites === total ? "Bravo ! Tu as tous tes codes. Va ouvrir le coffre-fort !" : "Quand tu auras les 6 codes sur ta fiche, tu pourras ouvrir le coffre-fort.") + "</p>" +
        '<a class="btn' + (nbFaites === total ? " btn--principal btn--grand" : "") + '" href="#/coffre">Aller au coffre-fort</a>' +
      "</section>" +
      (partie.repris && conseil ?
        '<section class="bloc" aria-labelledby="t-debloquer"><h2 id="t-debloquer">Tu as changé d\'ordinateur ?</h2>' +
        "<p>Si tu as déjà réussi la mission " + numMission(conseil.id) + " sur un autre ordinateur, recopie son code depuis ta fiche pour la débloquer.</p>" +
        '<form id="form-debloquer" novalidate><div class="champ"><label for="code-deb">Code de la mission ' + numMission(conseil.id) + " — " + esc(conseil.titre) + "</label>" +
        '<input type="text" id="code-deb" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" aria-describedby="deb-st"></div>' +
        '<p class="coffre__statut" id="deb-st" role="status"></p><button class="btn" type="submit">Valider ce code</button></form></section>' : "") +
      '<p><a href="#/briefing">Revoir mon numéro d\'agent</a></p>';

    var fd = $("#form-debloquer");
    if (fd) fd.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var champ = $("#code-deb"), st = $("#deb-st");
      if (normaliser(champ.value) === codeMission(partie.agent, partie.niv, conseil.id)) {
        partie.faites[conseil.id] = true; sauver(); VUES.qg();
        annoncer("Code correct : mission " + numMission(conseil.id) + " débloquée.");
        $("h1", vue).focus();
      } else {
        champ.setAttribute("aria-invalid", "true");
        st.className = "coffre__statut coffre__statut--non";
        st.textContent = "✗ Ce code ne correspond pas. Vérifie ta fiche, ou fais la mission.";
      }
    });

    brancherEcoute($(".missions", vue), lectures);
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Mission                                                       */
  /* ------------------------------------------------------------------ */
  VUES.mission = function (mid) {
    if (!exigePartie()) return;
    var m = missionParId(mid);
    if (!m) { aller("qg"); return; }
    if (!partie.faites[mid] && estVerrouillee(mid)) {
      var avant = D.missions[numMission(mid) - 2];
      vue.innerHTML = '<p class="porte" aria-hidden="true">🔒</p><h1>Mission verrouillée</h1>' +
        "<p>Pour ouvrir cette mission, réussis d'abord la mission " + (numMission(mid) - 1) + " : " + esc(avant.titre) + ".</p>" +
        '<div class="actions"><a class="btn btn--principal btn--grand" href="#/mission/' + avant.id + '">Aller à la mission ' + (numMission(mid) - 1) + "</a>" +
        '<a class="btn" href="#/qg">Retour au QG</a></div>';
      return;
    }
    var etapes = etapesDe(m, partie.niv);
    var pos = partie.pos[mid] || 0;
    if (pos >= etapes.length) { pos = 0; partie.pos[mid] = 0; sauver(); }   // refaire une mission terminée
    var e = etapes[pos];
    var n = numMission(mid);

    vue.innerHTML =
      '<p class="fil"><a href="#/qg"><span aria-hidden="true">←</span> Retour au QG</a></p>' +
      "<h1>Mission " + n + " : " + esc(m.titre) + "</h1>" +
      '<div class="progression"><p class="progression__texte">Étape ' + (pos + 1) + " sur " + etapes.length + "</p>" +
      '<div class="progression__barre" aria-hidden="true"><span style="width:' + Math.round(100 * pos / etapes.length) + '%"></span></div></div>' +
      '<div id="etape"></div>';

    var zone = $("#etape");
    var suivant = function () {
      partie.pos[mid] = pos + 1;
      if (pos + 1 >= etapes.length) {
        partie.faites[mid] = true;
        partie.pos[mid] = 0;
        sauver();
        aller("code/" + mid);
      } else {
        sauver();
        VUES.mission(mid);
        var t = $("h2", zone) || $("h1", vue);
        t.setAttribute("tabindex", "-1");
        t.focus();
        if (reglages.auto) { var b = $("[data-ecouter]", zone); if (b) b.click(); }
      }
    };
    var graine = partie.agent + "|" + mid + "|" + pos;

    if (e.type === "info") rendreInfo(zone, e, suivant);
    else if (e.type === "choix") rendreChoix(zone, e, suivant, graine);
    else if (e.type === "cesar") rendreCesar(zone, e, suivant);
  };

  function rendreInfo(zone, e, suivant) {
    zone.innerHTML =
      '<section class="bloc" aria-labelledby="t-etape">' +
        '<div class="bloc__tete"><h2 id="t-etape">' + esc(e.titre || "À lire") + "</h2>" + boutonEcouter("Écouter") + "</div>" +
        '<div class="texte">' + e.texte + "</div>" +
        (e.outil === "testeur" ? testeurHTML() : "") +
      "</section>" +
      '<div class="actions"><button type="button" class="btn btn--principal btn--grand" id="btn-suite">J\'ai compris, continuer <span aria-hidden="true">➜</span></button></div>';
    brancherEcoute(zone, [(e.titre ? e.titre + ". " : "") + texteBrut(e.texte)]);
    if (e.outil === "testeur") brancherTesteur(zone);
    $("#btn-suite").addEventListener("click", suivant);
  }

  function optionsDe(e) {
    if (typeof e.options === "string") {
      return D.listes[e.options].map(function (t, i) {
        return { t: t, ok: i === e.bonne, pourquoi: i === e.bonne ? "" : "Ce n'est pas la bonne réponse. Relis bien la situation et le briefing de la mission." };
      });
    }
    return e.options;
  }
  function carteHTML(c) {
    return '<article class="message" aria-label="' + esc(c.genre) + ' reçu">' +
      '<span class="message__genre">' + (c.genre === "SMS" ? "📱 " : "✉️ ") + esc(c.genre) + "</span><dl>" +
      "<dt>De :</dt><dd>" + esc(c.de) + "</dd>" +
      (c.objet ? "<dt>Objet :</dt><dd>" + esc(c.objet) + "</dd>" : "") +
      "<dt>Message :</dt><dd>" + esc(c.corps) + "</dd>" +
      (c.lien ? '<dt>Lien :</dt><dd><span class="message__lien">' + esc(c.lien) + "</span></dd>" : "") +
      "</dl></article>";
  }
  function carteTexte(c) {
    return c.genre + " reçu. De : " + c.de.replace(/[<>]/g, ", ") + ". " + (c.objet ? "Objet : " + c.objet + ". " : "") +
      "Message : " + c.corps + " " + (c.lien ? "Lien vers l'adresse : " + c.lien + "." : "Il n'y a pas de lien.");
  }

  function rendreChoix(zone, e, suivant, graine) {
    var options = melanger(optionsDe(e), graine);
    zone.innerHTML =
      (e.carte ? carteHTML(e.carte) : "") +
      '<form class="bloc" id="form-q" novalidate>' +
        '<fieldset><legend><h2 id="t-etape">' + esc(e.question) + "</h2></legend>" +
          '<div class="options">' +
          options.map(function (o, i) {
            return '<label class="option" id="lab-' + i + '"><input type="radio" name="rep" value="' + i + '"><span>' + esc(o.t) + "</span></label>";
          }).join("") +
          "</div></fieldset>" +
        '<div class="actions"><button type="submit" class="btn btn--principal btn--grand" id="btn-valider">Valider ma réponse</button>' +
          boutonEcouter("Écouter la question") + "</div>" +
        (e.aide ? '<details class="indice"><summary><span aria-hidden="true">💡</span> Besoin d\'un indice ?</summary><p>' + esc(e.aide) + "</p></details>" : "") +
        '<div class="retour" id="retour" role="status"></div>' +
      "</form>";

    brancherEcoute(zone, [function () {
      return (e.carte ? carteTexte(e.carte) + " " : "") + e.question + " " +
        options.map(function (o, i) { return "Réponse " + (i + 1) + " : " + o.t; }).join(". ") + ".";
    }]);

    var form = $("#form-q"), retour = $("#retour");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var choisi = $('input[name="rep"]:checked', form);
      if (!choisi) {
        retour.className = "retour retour--non";
        retour.innerHTML = "<p>Choisis une réponse avant de valider.</p>";
        return;
      }
      var o = options[+choisi.value];
      var lab = $("#lab-" + choisi.value);
      if (o.ok) {
        lab.classList.add("option--bonne");
        $$('input[name="rep"]', form).forEach(function (i) { i.disabled = true; });
        $("#btn-valider").hidden = true;
        retour.className = "retour retour--ok";
        retour.innerHTML = "<p>✓ Bonne réponse !</p>" +
          (e.retenir ? '<p class="retour__normal"><strong>À retenir :</strong> ' + esc(e.retenir) + "</p>" : "");
        var b = document.createElement("div");
        b.className = "actions";
        b.innerHTML = '<button type="button" class="btn btn--principal btn--grand" id="btn-suite">Continuer <span aria-hidden="true">➜</span></button>' +
          (e.retenir ? boutonEcouter("Écouter « À retenir »") : "");
        retour.after(b);
        brancherEcoute(b, ["Bonne réponse ! À retenir : " + (e.retenir || "")]);
        $("#btn-suite").addEventListener("click", suivant);
        $("#btn-suite").focus();
      } else {
        lab.classList.add("option--fausse");
        choisi.checked = false;
        choisi.disabled = true;
        lab.insertAdjacentHTML("beforeend", '<span class="visuellement-cache"> (réponse déjà essayée, incorrecte)</span>');
        retour.className = "retour retour--non";
        retour.innerHTML = "<p>✗ Pas tout à fait.</p><p class=\"retour__normal\">" + esc(o.pourquoi || "Relis la question et essaie une autre réponse.") +
          " Essaie une autre réponse.</p>";
        var ind = $("details.indice", form);
        if (ind) ind.open = true;
      }
    });
  }

  /* ---------- Outil : testeur de mot de passe (local, rien n'est envoyé) */
  function testeurHTML() {
    return '<div class="bloc" style="margin-top:1rem">' +
      '<div class="champ"><label for="mdp-test">Mot de passe inventé à tester</label>' +
      '<input type="text" id="mdp-test" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="mdp-alerte">' +
      '<p class="champ__aide" id="mdp-alerte"><strong>⚠️ Invente un mot de passe. Ne tape jamais ton vrai mot de passe.</strong></p></div>' +
      '<p>Idées à tester : <em>soleil</em>, puis <em>Soleil2012</em>, puis <em>Mon-Chat-Mange-3-Croquettes!</em></p>' +
      '<div class="testeur__resultat" id="mdp-resultat" aria-live="polite"></div></div>';
  }
  var MOTS_CONNUS = ["password", "motdepasse", "azerty", "qwerty", "123456", "1234", "soleil", "bonjour", "kevin", "admin", "football", "loulou", "doudou", "chocolat"];
  function evaluerMdp(m) {
    var c = { longueur: m.length >= 12, min: /[a-z]/.test(m), maj: /[A-Z]/.test(m), chiffre: /[0-9]/.test(m), special: /[^A-Za-z0-9]/.test(m) };
    var reserve = (c.min ? 26 : 0) + (c.maj ? 26 : 0) + (c.chiffre ? 10 : 0) + (c.special ? 33 : 0);
    var bits = reserve ? m.length * Math.log2(reserve) : 0;
    var bas = m.toLowerCase().replace(/[@4]/g, "a").replace(/0/g, "o").replace(/[1!]/g, "i").replace(/3/g, "e").replace(/\$/g, "s");
    c.connu = !MOTS_CONNUS.some(function (w) { return bas.indexOf(w) >= 0; });
    if (!c.connu) bits = Math.min(bits, 30);
    if (/^(.)\1+$/.test(m)) bits = Math.min(bits, 10);
    var note = bits >= 80 ? "A" : bits >= 60 ? "B" : bits >= 40 ? "C" : bits >= 28 ? "D" : "E";
    var noms = { A: "Très solide", B: "Solide", C: "Moyen", D: "Faible", E: "Très faible" };
    return { c: c, note: note, nom: noms[note] };
  }
  function brancherTesteur(zone) {
    var champ = $("#mdp-test", zone), res = $("#mdp-resultat", zone), minuterie;
    champ.addEventListener("input", function () {
      clearTimeout(minuterie);
      minuterie = setTimeout(function () {
        var m = champ.value;
        if (!m) { res.innerHTML = ""; return; }
        var r = evaluerMdp(m);
        var li = function (ok, t) { return '<li class="' + (ok ? "ok" : "") + '">' + t + '<span class="visuellement-cache">' + (ok ? " : oui" : " : non") + "</span></li>"; };
        res.innerHTML = "<p><span class=\"note-lettre\" aria-hidden=\"true\">" + r.note + "</span><strong>Robustesse : " + r.note + " — " + r.nom + "</strong></p>" +
          '<ul class="criteres">' +
          li(r.c.longueur, "12 caractères ou plus (ici : " + m.length + ")") +
          li(r.c.min, "Des minuscules") + li(r.c.maj, "Des majuscules") +
          li(r.c.chiffre, "Des chiffres") + li(r.c.special, "Des caractères spéciaux (! ? - # …)") +
          li(r.c.connu, "Pas de mot trop connu (prénom, « azerty », « soleil »…)") + "</ul>";
      }, 450);
    });
  }

  /* ---------- Étape César */
  function rendreCesar(zone, e, suivant) {
    var c = cesarPour(partie.agent, partie.niv);
    var essais = 0;
    var cleOutil = 1;
    var consigne = c.donnee
      ? "Le message a été chiffré avec la clé " + c.cle + " : chaque lettre a avancé de " + c.cle + " places. Pour le déchiffrer, règle l'outil sur la clé " + c.cle + ", puis remplace chaque lettre."
      : "La clé est inconnue ! Teste les clés une par une avec l'outil : c'est la méthode de la force brute. Cherche la clé qui donne un vrai mot en lien avec la cybersécurité.";
    var lettresUtiles = c.chiffre.split("");

    zone.innerHTML =
      '<section class="bloc" aria-labelledby="t-etape">' +
        '<div class="bloc__tete"><h2 id="t-etape">' + esc(e.titre) + "</h2>" + boutonEcouter("Écouter la consigne") + "</div>" +
        "<p>" + esc(consigne) + "</p>" +
        '<h3 id="t-msg">Message chiffré</h3>' +
        '<ul class="cesar__message" aria-labelledby="t-msg">' + lettresUtiles.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" +
      "</section>" +
      '<section class="bloc" aria-labelledby="t-outil">' +
        '<h3 id="t-outil">Le décodeur</h3>' +
        '<div class="cle"><span id="lib-cle">Clé du décodeur :</span>' +
          '<button type="button" class="btn" id="cle-moins" aria-label="Diminuer la clé">−</button>' +
          '<output id="cle-val" aria-labelledby="lib-cle" aria-live="polite">1</output>' +
          '<button type="button" class="btn" id="cle-plus" aria-label="Augmenter la clé">+</button></div>' +
        "<p>Chaque case indique : lettre du message chiffré <span aria-hidden=\"true\">→</span> lettre en clair. Les cases encadrées sont les lettres de ton message.</p>" +
        '<ul class="table-cesar" id="table-cesar" aria-label="Correspondances des lettres"></ul>' +
      "</section>" +
      '<form class="bloc" id="form-cesar" novalidate>' +
        '<div class="champ"><label for="rep-cesar">Le mot déchiffré</label>' +
        '<input type="text" id="rep-cesar" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20"></div>' +
        '<div class="actions"><button type="submit" class="btn btn--principal btn--grand" id="btn-valider">Valider le mot</button></div>' +
        '<div class="retour" id="retour" role="status"></div>' +
      "</form>";

    var majTable = function () {
      $("#cle-val").textContent = cleOutil;
      $("#table-cesar").innerHTML = ABC.split("").map(function (l) {
        var utile = lettresUtiles.indexOf(l) >= 0;
        return '<li class="' + (utile ? "utile" : "") + '">' + l + ' <span class="fleche" aria-hidden="true">→</span><span class="visuellement-cache"> donne </span> <span class="clair">' + decaler(l, -cleOutil) + "</span></li>";
      }).join("");
    };
    majTable();
    $("#cle-moins").addEventListener("click", function () { cleOutil = cleOutil <= 1 ? 25 : cleOutil - 1; majTable(); });
    $("#cle-plus").addEventListener("click", function () { cleOutil = cleOutil >= 25 ? 1 : cleOutil + 1; majTable(); });

    brancherEcoute(zone, [function () {
      return consigne + " Message chiffré, lettre par lettre : " + lettresUtiles.join(", ") + ".";
    }]);

    var retour = $("#retour");
    $("#form-cesar").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var champ = $("#rep-cesar"), r = normaliser(champ.value);
      if (!r) { retour.className = "retour retour--non"; retour.innerHTML = "<p>Écris le mot déchiffré avant de valider.</p>"; champ.focus(); return; }
      if (r === c.mot) {
        champ.removeAttribute("aria-invalid");
        champ.disabled = true;
        $("#btn-valider").hidden = true;
        retour.className = "retour retour--ok";
        retour.innerHTML = "<p>✓ Message déchiffré : " + esc(c.mot) + " !</p>" +
          '<p class="retour__normal">' + (c.donnee ? "" : "La clé était " + c.cle + ". ") + esc(e.retenir || "") + "</p>";
        var b = document.createElement("div");
        b.className = "actions";
        b.innerHTML = '<button type="button" class="btn btn--principal btn--grand" id="btn-suite">Continuer <span aria-hidden="true">➜</span></button>';
        retour.after(b);
        $("#btn-suite").addEventListener("click", suivant);
        $("#btn-suite").focus();
      } else {
        essais++;
        champ.setAttribute("aria-invalid", "true");
        var aide = !c.donnee && essais === 1
          ? "As-tu essayé plusieurs clés ? Cherche la clé qui donne un vrai mot."
          : "Vérifie chaque lettre avec le décodeur" + (c.donnee ? " réglé sur la clé " + c.cle : "") + ".";
        if (essais >= 2) aide += " Indice : le mot commence par « " + c.mot[0] + " »" + (essais >= 3 ? " et il a " + c.mot.length + " lettres" : "") + ".";
        retour.className = "retour retour--non";
        retour.innerHTML = "<p>✗ Ce n'est pas encore ça.</p><p class=\"retour__normal\">" + esc(aide) + "</p>";
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* VUE : Code obtenu                                                   */
  /* ------------------------------------------------------------------ */
  VUES.code = function (mid) {
    if (!exigePartie()) return;
    var m = missionParId(mid);
    if (!m || !partie.faites[mid]) { aller("qg"); return; }
    var code = codeMission(partie.agent, partie.niv, mid), n = numMission(mid);
    var toutes = Object.keys(partie.faites).length === D.missions.length;
    var estMot = mid === "m4";
    vue.innerHTML =
      '<div class="centre">' +
        '<p class="porte porte--ouverte" aria-hidden="true">🏅</p>' +
        "<h1>Mission " + n + " réussie !</h1>" +
        '<section class="bloc bloc--info" aria-labelledby="t-code">' +
          '<h2 id="t-code">Ton code pour la mission ' + n + "</h2>" +
          '<ul class="code-geant' + (estMot ? " code-geant--mot" : "") + '" aria-label="Code : ' + esc(code.split("").join(" ")) + '">' +
            code.split("").map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
          (estMot ? '<p class="code-epele">Le code, c\'est le mot que tu as déchiffré : ' + esc(code) + "</p>" : '<p class="code-epele">' + esc(epeler(code)) + "</p>") +
          "<p><strong>Écris ce code sur ta fiche</strong>, dans la case « Mission " + n + " ».</p>" +
          '<div class="actions" style="justify-content:center">' + boutonEcouter("Écouter le code") + "</div>" +
        "</section>" +
        (toutes ? '<p class="conseil">Tu as réussi toutes les missions ! Tu peux ouvrir le coffre-fort.</p>' : "") +
        '<div class="actions" style="justify-content:center">' +
          (toutes ? '<a class="btn btn--principal btn--grand" href="#/coffre">Aller au coffre-fort</a><a class="btn" href="#/qg">Retour au QG</a>'
                  : '<a class="btn btn--principal btn--grand" href="#/qg">J\'ai noté mon code, retour au QG</a>') +
        "</div>" +
      "</div>";
    brancherEcoute(vue, ["Ton code pour la mission " + n + " est : " + (estMot ? code + ". J'épelle : " + code.split("").join(", ") : epeler(code)) + ". Écris-le sur ta fiche."]);
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Coffre-fort                                                   */
  /* ------------------------------------------------------------------ */
  VUES.coffre = function () {
    var agent = partie ? partie.agent : "", niv = partie ? partie.niv : "4";
    var champs = D.missions.map(function (m, i) {
      return '<div class="champ"><label for="code-' + m.id + '">Code de la mission ' + (i + 1) + " — " + esc(m.titre) + "</label>" +
        '<input type="text" id="code-' + m.id + '" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" aria-describedby="st-' + m.id + '">' +
        '<p class="coffre__statut" id="st-' + m.id + '"></p></div>';
    }).join("");

    vue.innerHTML =
      '<p class="porte" aria-hidden="true">🗄️</p>' +
      '<div class="bloc__tete"><h1>Le coffre-fort</h1>' + boutonEcouter("Écouter") + "</div>" +
      "<p>Recopie les codes de ta fiche. Les majuscules et les espaces n'ont pas d'importance.</p>" +
      '<form class="bloc coffre" id="form-coffre" novalidate>' +
        (partie && partie.agent ?
          '<p class="coffre__identite">Agent <strong>' + esc(agent) + "</strong> · Niveau <strong>" + nomNiveau(niv) + "</strong></p>" +
          '<input type="hidden" id="cf-agent" value="' + esc(agent) + '"><input type="hidden" id="cf-niv" value="' + niv + '"><p id="st-agent" hidden></p>'
        :
          '<div class="champ"><label for="cf-agent">Numéro d\'agent</label>' +
          '<input type="text" id="cf-agent" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="st-agent">' +
          '<p class="coffre__statut" id="st-agent"></p></div>' +
          '<div class="champ"><label for="cf-niv">Niveau</label><select id="cf-niv">' +
            Object.keys(D.niveaux).sort().reverse().map(function (k) { return '<option value="' + k + '"' + (k === niv ? " selected" : "") + ">" + D.niveaux[k].nom + "</option>"; }).join("") +
          "</select></div>") +
        champs +
        '<div class="actions"><button type="submit" class="btn btn--principal btn--grand">Ouvrir le coffre <span aria-hidden="true">🔓</span></button></div>' +
        '<div class="retour" id="retour" role="status"></div>' +
      "</form>";

    brancherEcoute(vue, ["Le coffre-fort. Recopie les codes de ta fiche, mission par mission. Ensuite, appuie sur le bouton : Ouvrir le coffre."]);

    $("#form-coffre").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var a = normaliser($("#cf-agent").value), nv = $("#cf-niv").value, retour = $("#retour");
      var stA = $("#st-agent");
      if (!agentValide(a)) {
        $("#cf-agent").setAttribute("aria-invalid", "true");
        stA.className = "coffre__statut coffre__statut--non";
        stA.textContent = "✗ Numéro d'agent non valide (4 caractères).";
        retour.className = "retour retour--non";
        retour.innerHTML = "<p>Vérifie d'abord ton numéro d'agent.</p>";
        $("#cf-agent").focus();
        return;
      }
      $("#cf-agent").removeAttribute("aria-invalid");
      stA.textContent = "";
      var bons = 0, premierFaux = null, codes = {};
      D.missions.forEach(function (m, i) {
        var champ = $("#code-" + m.id), st = $("#st-" + m.id);
        var v = normaliser(champ.value), attendu = codeMission(a, nv, m.id);
        codes[m.id] = v;
        if (v === attendu) {
          bons++; champ.removeAttribute("aria-invalid");
          st.className = "coffre__statut coffre__statut--ok"; st.textContent = "✓ Code correct";
        } else {
          champ.setAttribute("aria-invalid", "true");
          st.className = "coffre__statut coffre__statut--non";
          st.textContent = v ? "✗ Ce code n'est pas le bon. Vérifie ta fiche." : "✗ Code manquant.";
          if (!premierFaux) premierFaux = champ;
        }
      });
      if (bons === D.missions.length) {
        stockage.ecrire("coffre", { agent: a, niv: nv, date: new Date().toISOString(), codes: codes,
          prenoms: partie && partie.agent === a ? partie.prenoms : "", mode: partie && partie.agent === a ? partie.mode : "",
          faitesIci: partie && partie.agent === a ? Object.keys(partie.faites).length : null });
        aller("synthese");
      } else {
        retour.className = "retour retour--non";
        retour.innerHTML = "<p>Le coffre reste fermé : " + bons + " code(s) correct(s) sur " + D.missions.length + ".</p>" +
          '<p class="retour__normal">Corrige les codes marqués ✗. Si un code te manque, refais la mission depuis le QG.</p>';
        premierFaux.focus();
      }
    });
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Synthèse (contenu du coffre)                                  */
  /* ------------------------------------------------------------------ */
  VUES.synthese = function () {
    var cf = stockage.lire("coffre", null);
    if (!cf) {
      vue.innerHTML = "<h1>Synthèse verrouillée</h1><p>La synthèse se trouve dans le coffre-fort. Ouvre-le d'abord avec tes codes.</p>" +
        '<a class="btn btn--principal" href="#/coffre">Aller au coffre-fort</a>';
      return;
    }
    var date = new Date(cf.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    var sections = D.synthese.map(function (s) {
      return "<section><h2>" + esc(s.titre) + "</h2>" +
        (s.texte ? "<p>" + s.texte + "</p>" : "") +
        (s.liste ? "<ul>" + s.liste.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" : "") + "</section>";
    }).join("");

    var taille = stockage.lire("tailleSynthese", "14");
    vue.innerHTML =
      '<div class="bloc ne-pas-imprimer"><div class="champ"><label for="taille-impr">Taille du texte de la synthèse (écran et impression)</label>' +
        '<select id="taille-impr">' + ["12", "14", "16", "18", "20"].map(function (t) {
          return '<option value="' + t + '"' + (t === taille ? " selected" : "") + ">" + t + " points" +
            ({ "12": " — normale", "14": " — confortable", "16": " — grande (Arial 16)", "18": " — très grande", "20": " — malvoyance" }[t]) + "</option>";
        }).join("") + "</select></div>" +
      '<div class="actions" style="margin-top:0">' +
        '<button type="button" class="btn btn--principal" id="btn-imprimer"><span aria-hidden="true">🖨️</span> Imprimer ou enregistrer en PDF</button>' +
        boutonEcouter("Écouter la synthèse") +
        '<a class="btn" href="#/' + (partie ? "qg" : "") + '">Retour</a></div></div>' +
      '<article class="doc doc--synthese" id="doc-synthese" style="font-size:' + taille + 'pt" aria-labelledby="t-synth">' +
        enteteDoc() + '<p class="tampon">COFFRE OUVERT</p>' +
        '<h1 id="t-synth">Rapport de mission — Agent ' + esc(cf.agent) + "</h1>" +
        "<table><tbody>" +
          "<tr><th scope=\"row\">Prénom(s)</th><td>" + (cf.prenoms ? esc(cf.prenoms) : "&nbsp;") + "</td></tr>" +
          "<tr><th scope=\"row\">Niveau</th><td>" + nomNiveau(cf.niv) + (cf.mode ? " — " + (cf.mode === "binome" ? "en binôme" : "seul(e)") : "") + "</td></tr>" +
          "<tr><th scope=\"row\">Date</th><td>" + esc(date) + "</td></tr>" +
          "<tr><th scope=\"row\">Codes</th><td>" + D.missions.map(function (m, i) { return "M" + (i + 1) + " : " + esc(cf.codes[m.id]); }).join(" · ") + "</td></tr>" +
          "<tr><th scope=\"row\">Missions faites sur cet appareil</th><td>" + (cf.faitesIci == null ? "non disponible" : cf.faitesIci + " sur " + D.missions.length) + "</td></tr>" +
        "</tbody></table>" +
        sections +
        "<section><h2>Ce que je retiens</h2><p>La chose la plus importante que j'ai apprise :</p>" +
        '<p style="border-bottom:1.5px dotted currentColor;min-height:2em"></p><p style="border-bottom:1.5px dotted currentColor;min-height:2em"></p></section>' +
      "</article>";

    $("#btn-imprimer").addEventListener("click", function () { window.print(); });
    $("#taille-impr").addEventListener("change", function () {
      stockage.ecrire("tailleSynthese", this.value);
      $("#doc-synthese").style.fontSize = this.value + "pt";
    });
    brancherEcoute(vue, [function () {
      return "Rapport de mission. " + D.synthese.map(function (s) {
        return s.titre + ". " + (s.texte ? texteBrut(s.texte) : "") + (s.liste ? s.liste.map(texteBrut).join(". ") : "");
      }).join(" ");
    }]);
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Fiche élève imprimable                                        */
  /* ------------------------------------------------------------------ */
  VUES.fiche = function (param) {
    var corrige = param === "corrige" && enseignantOuvert;
    var niv = (partie && partie.niv) || stockage.lire("ficheNiv", "4");
    var format = stockage.lire("ficheFormat", "adapte");
    vue.innerHTML =
      '<h1 class="ne-pas-imprimer">' + (corrige ? "Corrigé de la fiche élève" : "Fiche élève à imprimer") + '</h1>' +
      '<form class="bloc ne-pas-imprimer" id="form-fiche">' +
        '<div class="champ"><label for="fi-niv">Niveau</label><select id="fi-niv">' +
          Object.keys(D.niveaux).sort().reverse().map(function (k) { return '<option value="' + k + '"' + (k === niv ? " selected" : "") + ">" + D.niveaux[k].nom + "</option>"; }).join("") +
        "</select></div>" +
        "<fieldset><legend>Format</legend><div class=\"choix-ligne\">" +
          '<label><input type="radio" name="fmt" value="standard"' + (format === "standard" ? " checked" : "") + "> Standard (Arial 12)</label>" +
          '<label><input type="radio" name="fmt" value="adapte"' + (format === "adapte" ? " checked" : "") + "> Adapté (Arial 16, grands espaces)</label>" +
        "</div></fieldset>" +
        '<div class="actions"><button type="button" class="btn btn--principal" id="btn-imprimer"><span aria-hidden="true">🖨️</span> Imprimer la fiche</button></div>' +
        '<p class="champ__aide">La version modifiable (.odt, Arial 16) se trouve dans le dossier « fiches » du projet.</p>' +
      "</form>" +
      '<div id="fiche-zone"></div>';

    var maj = function () {
      var n = $("#fi-niv").value, f = $('input[name="fmt"]:checked').value;
      stockage.ecrire("ficheNiv", n); stockage.ecrire("ficheFormat", f);
      $("#fiche-zone").innerHTML = ficheHTML(n, f, corrige);
    };
    $("#form-fiche").addEventListener("change", maj);
    $("#btn-imprimer").addEventListener("click", function () { window.print(); });
    maj();
  };

  /* En-tête commun des documents imprimables : logo, établissement, enseignant, photo en fondu */
  function enteteDoc() {
    return '<div class="doc-entete">' +
      '<div class="doc-entete__photo" aria-hidden="true"></div>' +
      '<img class="logo-etab--fonce" src="img/logo-pleyel.png" alt="EREA Ignace Pleyel">' +
      '<img class="logo-etab--clair" src="img/logo-pleyel-clair.png" alt="EREA Ignace Pleyel">' +
      '<p class="doc-entete__texte"><strong>EREA Ignace Pleyel</strong>Technologie – M. Loquet</p>' +
      "</div>";
  }

  /* Fiche élève (et corrigé enseignant). Les [crochets] du texte deviennent des cases à remplir. */
  function itemsFiche(m, niv) { return m.fiche.filter(function (it) { return !it.niv || it.niv.indexOf(niv) >= 0; }); }
  function ficheHTML(niv, format, corrige) {
    var cases = function (k, texte) {
      var s = "";
      for (var i = 0; i < k; i++) s += "<span>" + (texte ? esc(texte[i] || "") : "") + "</span>";
      return '<span class="cases" aria-hidden="true">' + s + "</span>";
    };
    var item = function (it) {
      if (it.coche) {
        return '<div class="fiche-item"><p>' + esc(it.coche) + '</p><ul class="fiche-coches">' +
          it.options.map(function (o, i) {
            var ok = corrige && it.bonnes.indexOf(i) >= 0;
            return "<li>" + (ok ? "☒" : "☐") + " " + (ok ? "<strong>" + esc(o) + "</strong>" : esc(o)) + "</li>";
          }).join("") + "</ul></div>";
      }
      var n = 0;
      var html = esc(it.t).replace(/\[([^\]]*)\]/g, function () {
        var r = (it.rep || [])[n++] || "";
        return '<span class="trou">' + (corrige ? "<strong>" + esc(r) + "</strong>" : "") + "</span>";
      });
      return '<div class="fiche-item"><p>' + html + "</p></div>";
    };
    return '<article class="doc fiche fiche--' + format + (corrige ? " fiche--corrige" : "") + '" aria-label="' + (corrige ? "Corrigé de la fiche" : "Aperçu de la fiche") + '">' +
      enteteDoc() + '<h2 class="fiche-titre">🔐 Agents Cyber — ' + (corrige ? "CORRIGÉ enseignant" : "Ma fiche d'agent") + " (" + nomNiveau(niv) + ")</h2>" +
      (corrige ? "<p><em>Les codes dépendent du numéro d'agent : vérifiez-les dans l'Espace enseignant.</em></p>" :
      '<div class="entete-fiche">' +
        '<div>Prénom(s) :<div class="ligne-a-remplir"></div></div>' +
        '<div>Classe et date :<div class="ligne-a-remplir"></div></div>' +
      "</div>" +
      '<p class="code-ligne">Mon numéro d\'agent : ' + cases(4) + "</p>" +
      '<p class="fiche-consigne">Pendant chaque mission, complète les phrases. À la fin de la mission, recopie ton code dans les cases.</p>') +
      D.missions.map(function (m, i) {
        return '<section class="mission-fiche"><div class="mission-fiche__tete"><h2>Mission ' + (i + 1) + " — " + esc(m.titre) + "</h2>" +
          '<span class="fiche-reussie">' + (corrige ? "" : "☐ réussie") + "</span></div>" +
          itemsFiche(m, niv).map(item).join("") +
          '<p class="code-ligne">' + (m.id === "m4"
            ? 'Code (le mot déchiffré) : <span class="longue-case">' + (corrige ? "<em>selon le groupe</em>" : "") + "</span>"
            : "Code obtenu : " + cases(4)) + "</p></section>";
      }).join("") +
      '<section class="mission-fiche"><h2>Le coffre-fort</h2>' +
        "<p>Coffre ouvert : ☐ oui &nbsp;&nbsp; ☐ pas encore</p>" +
        "<p>Pour moi, ce jeu était : ☐ facile &nbsp;&nbsp; ☐ moyen &nbsp;&nbsp; ☐ difficile</p>" +
        '<p>Ce que j\'ai appris de plus important :</p><div class="ligne-a-remplir"></div><div class="ligne-a-remplir"></div>' +
      "</section>" +
      "</article>";
  }

  /* ------------------------------------------------------------------ */
  /* VUE : Kit papier (roue de César)                                    */
  /* ------------------------------------------------------------------ */
  function disqueSVG(rayon, titre, avecTrou) {
    var t = 340, cx = t / 2, s = '<svg viewBox="0 0 ' + t + " " + t + '" role="img" aria-label="' + esc(titre) + '" xmlns="http://www.w3.org/2000/svg">';
    s += '<circle cx="' + cx + '" cy="' + cx + '" r="' + rayon + '" fill="#fff" stroke="#000" stroke-width="2"/>';
    s += '<circle cx="' + cx + '" cy="' + cx + '" r="' + (rayon - 34) + '" fill="none" stroke="#000" stroke-width="1"/>';
    for (var i = 0; i < 26; i++) {
      var ang = (i * 360 / 26 - 90) * Math.PI / 180, ang2 = ((i + .5) * 360 / 26 - 90) * Math.PI / 180;
      var rx = cx + (rayon - 17) * Math.cos(ang), ry = cx + (rayon - 17) * Math.sin(ang);
      s += '<line x1="' + (cx + (rayon - 34) * Math.cos(ang2)) + '" y1="' + (cx + (rayon - 34) * Math.sin(ang2)) + '" x2="' + (cx + rayon * Math.cos(ang2)) + '" y2="' + (cx + rayon * Math.sin(ang2)) + '" stroke="#000" stroke-width="1"/>';
      s += '<text x="' + rx + '" y="' + ry + '" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="central" transform="rotate(' + (i * 360 / 26) + " " + rx + " " + ry + ')">' + ABC[i] + "</text>";
    }
    if (avecTrou) s += '<circle cx="' + cx + '" cy="' + cx + '" r="4" fill="#000"/>';
    return s + "</svg>";
  }
  VUES.kit = function () {
    vue.innerHTML =
      '<h1 class="ne-pas-imprimer">Kit papier : la roue de César</h1>' +
      '<p class="ne-pas-imprimer">Version sans écran de la mission 4. Imprime cette page, de préférence sur du papier épais.</p>' +
      '<div class="actions ne-pas-imprimer" style="margin-top:0;margin-bottom:1rem"><button type="button" class="btn btn--principal" id="btn-imprimer"><span aria-hidden="true">🖨️</span> Imprimer</button></div>' +
      '<article class="doc" aria-labelledby="t-roue">' +
        enteteDoc() +
        '<h2 id="t-roue" style="margin-top:0">Roue de César à fabriquer</h2>' +
        "<ol><li>Découpe les deux disques.</li><li>Pose le petit disque sur le grand et fixe-les au centre avec une attache parisienne.</li>" +
        "<li>Pour <strong>chiffrer</strong> avec la clé 3 : place le A du petit disque sous le D du grand disque. Lis chaque lettre du message sur le petit disque, et écris la lettre du grand disque.</li>" +
        "<li>Pour <strong>déchiffrer</strong> : fais l'inverse, du grand disque vers le petit.</li></ol>" +
        '<div class="roue-pieces">' +
          "<figure>" + disqueSVG(165, "Grand disque : alphabet complet de A à Z", true) + "<figcaption>Grand disque (lettres chiffrées)</figcaption></figure>" +
          "<figure>" + disqueSVG(129, "Petit disque : alphabet complet de A à Z", true) + "<figcaption>Petit disque (lettres en clair)</figcaption></figure>" +
        "</div>" +
      "</article>";
    $("#btn-imprimer").addEventListener("click", function () { window.print(); });
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Déclaration d'accessibilité                                   */
  /* ------------------------------------------------------------------ */
  VUES.accessibilite = function () {
    vue.innerHTML =
      "<h1>Accessibilité</h1>" +
      '<div class="bloc"><h2>État de conformité</h2>' +
      "<p>Ce jeu vise le niveau AA des <strong>WCAG 2.2</strong>, avec le <strong>RGAA 4.1.2</strong> comme grille de vérification. " +
      "Il n'a pas encore fait l'objet d'un audit officiel : il est donc <strong>non conforme</strong> au sens réglementaire, faute d'audit, même s'il a été conçu pour respecter ces critères.</p></div>" +
      '<div class="bloc"><h2>Ce qui a été prévu</h2><ul>' +
        "<li>Utilisation complète au clavier, avec un repère de focus très visible.</li>" +
        "<li>Compatible avec les lecteurs d'écran : titres, formulaires étiquetés, annonces des réussites et des erreurs.</li>" +
        "<li>Lecture audio de chaque consigne et de chaque question (bouton « Écouter »).</li>" +
        "<li>Réglages : taille du texte, police (Arial, Verdana, Luciole, OpenDyslexic), thèmes clair, crème, sombre et contraste élevé, suppression des animations.</li>" +
        "<li>Aide à la lecture : espacements conformes au critère 1.4.12 des WCAG (interligne, lettres 0,12 em, mots 0,16 em, paragraphes), lignes courtes, mots en deux couleurs, guide de lecture, lecture au clic, et un bouton qui active tout d'un coup.</li>" +
        "<li>Synthèse imprimable en 12, 14, 16, 18 ou 20 points.</li>" +
        "<li>Aucune limite de temps. Progression sauvegardée sur l'appareil.</li>" +
        "<li>Aucun glisser-déposer. Zones cliquables d'au moins 44 pixels.</li>" +
        "<li>Codes sans caractères ambigus (pas de 0/O, 1/I/L, b/d/p/q), épelés et lus à voix haute.</li>" +
        "<li>Une seule question par écran, avec indice et explication en cas d'erreur.</li>" +
        "<li>Version papier : fiche imprimable (format standard ou adapté) et roue de César à découper.</li>" +
      "</ul></div>" +
      '<div class="bloc"><h2>Limites connues</h2><ul>' +
        "<li>La qualité de la voix dépend de l'ordinateur et du navigateur.</li>" +
        "<li>Si un lecteur d'écran est actif, il est conseillé de ne pas utiliser en même temps les boutons « Écouter ».</li>" +
        "<li>Les polices Luciole et OpenDyslexic ne s'affichent que si elles sont installées sur l'ordinateur.</li>" +
      "</ul></div>";
  };

  /* ------------------------------------------------------------------ */
  /* VUE : Espace enseignant                                             */
  /* ------------------------------------------------------------------ */
  var enseignantOuvert = false;
  try { enseignantOuvert = sessionStorage.getItem("agentscyber.prof") === "1"; } catch (e) {}

  VUES.enseignant = function () {
    if (!enseignantOuvert) {
      vue.innerHTML =
        "<h1>Espace enseignant</h1>" +
        '<form class="bloc" id="form-prof" novalidate><div class="champ"><label for="prof-code">Code enseignant</label>' +
        '<input type="text" id="prof-code" autocomplete="off" spellcheck="false" aria-describedby="prof-err" style="-webkit-text-security:disc"></div>' +
        '<p class="coffre__statut coffre__statut--non" id="prof-err" role="status"></p>' +
        '<button class="btn btn--principal" type="submit">Entrer</button></form>';
      $("#form-prof").addEventListener("submit", function (e) {
        e.preventDefault();
        if (cyrb53($("#prof-code").value.trim(), 7).toString(36) === CFG.EMPREINTE_CODE_ENSEIGNANT) {
          enseignantOuvert = true;
          try { sessionStorage.setItem("agentscyber.prof", "1"); } catch (er) {}
          VUES.enseignant(); $("h1", vue).focus();
        } else {
          $("#prof-err").textContent = "Code incorrect.";
          $("#prof-code").setAttribute("aria-invalid", "true");
        }
      });
      return;
    }

    vue.innerHTML =
      "<h1>Espace enseignant</h1>" +
      '<section class="bloc" aria-labelledby="t-verif"><h2 id="t-verif">Vérifier une fiche</h2>' +
        "<p>Saisissez le numéro d'agent écrit sur la fiche : les codes attendus s'affichent.</p>" +
        '<form id="form-verif" novalidate>' +
          '<div class="champ"><label for="v-agent">Numéro d\'agent</label><input type="text" id="v-agent" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>' +
          '<div class="champ"><label for="v-niv">Niveau</label><select id="v-niv">' +
            Object.keys(D.niveaux).sort().reverse().map(function (k) { return '<option value="' + k + '">' + D.niveaux[k].nom + "</option>"; }).join("") +
          "</select></div>" +
          '<button class="btn btn--principal" type="submit">Afficher les codes</button></form>' +
        '<div id="v-res" role="status" style="margin-top:1rem"></div></section>' +
      '<section class="bloc" aria-labelledby="t-corrige"><h2 id="t-corrige">Corrigé de la fiche élève</h2>' +
        "<p>Les réponses attendues de la fiche, pour chaque classe (choix de la classe sur la page).</p>" +
        '<a class="btn" href="#/fiche/corrige">Afficher et imprimer le corrigé</a></section>' +
      '<section class="bloc" aria-labelledby="t-app"><h2 id="t-app">Cet appareil</h2>' +
        "<p>Entre deux groupes, effacez la partie enregistrée sur cet ordinateur.</p>" +
        '<button type="button" class="btn btn--danger" id="btn-raz">Effacer la partie et le coffre de cet appareil</button>' +
        '<p id="raz-ok" role="status"></p></section>' +
      '<section class="bloc" aria-labelledby="t-code-prof"><h2 id="t-code-prof">Changer mon code enseignant</h2>' +
        '<form id="form-empreinte" novalidate><div class="champ"><label for="nouveau-code">Nouveau code</label>' +
        '<input type="text" id="nouveau-code" autocomplete="off" spellcheck="false"></div>' +
        '<button class="btn" type="submit">Calculer l\'empreinte</button></form>' +
        '<p id="empreinte-res" role="status"></p></section>' +
      '<section class="bloc bloc--info"><h2>Comment fonctionnent les codes ?</h2>' +
        "<p>Les codes sont calculés à partir du numéro d'agent (tiré au hasard), du niveau et du « sel » défini dans <code>js/config.js</code>. " +
        "Deux groupes n'ont donc pas les mêmes codes. Le code de la mission 4 est le mot déchiffré : il faut vraiment faire le travail. " +
        "La ligne « Missions faites sur cet appareil » de la synthèse permet de repérer un groupe qui aurait recopié les codes d'un autre.</p></section>";

    $("#form-verif").addEventListener("submit", function (e) {
      e.preventDefault();
      var a = normaliser($("#v-agent").value), nv = $("#v-niv").value, res = $("#v-res");
      if (!agentValide(a)) { res.innerHTML = '<p class="coffre__statut coffre__statut--non">Numéro d\'agent non valide.</p>'; return; }
      var c = cesarPour(a, nv);
      res.innerHTML = '<table class="tableau"><caption class="visuellement-cache">Codes attendus pour l\'agent ' + a + "</caption>" +
        '<thead><tr><th scope="col">Mission</th><th scope="col">Code attendu</th></tr></thead><tbody>' +
        D.missions.map(function (m, i) { return "<tr><td>" + (i + 1) + " — " + esc(m.titre) + '</td><td class="code">' + esc(codeMission(a, nv, m.id)) + "</td></tr>"; }).join("") +
        "</tbody></table><p>Mission 4 : message chiffré <strong>" + c.chiffre + "</strong>, clé <strong>" + c.cle + "</strong>" + (c.donnee ? " (donnée à l'élève)" : " (à trouver par l'élève)") + ".</p>";
    });
    $("#btn-raz").addEventListener("click", function () {
      confirmer("Effacer la partie et le coffre enregistrés sur cet appareil ?", "Oui, effacer").then(function (ok) {
        if (!ok) return;
        partie = null; stockage.effacer("partie"); stockage.effacer("coffre"); majBadge();
        $("#raz-ok").textContent = "C'est fait : cet appareil est prêt pour un nouveau groupe.";
      });
    });
    $("#form-empreinte").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("#nouveau-code").value.trim();
      if (v.length < 6) { $("#empreinte-res").textContent = "Choisissez un code d'au moins 6 caractères."; return; }
      $("#empreinte-res").innerHTML = "Empreinte à recopier dans <code>js/config.js</code> (EMPREINTE_CODE_ENSEIGNANT) : <strong>" + cyrb53(v, 7).toString(36) + "</strong>";
    });
  };

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */
  appliquerReglages();
  majBadge();

  var dlg = $("#dlg-reglages");
  $("#btn-reglages").addEventListener("click", function () { remplirFormReglages(); dlg.showModal(); });
  $("#dlg-reglages form").addEventListener("change", lireFormReglages);
  $("#voix-debit").addEventListener("input", lireFormReglages);
  dlg.addEventListener("close", function () { arreterLecture(); $("#btn-reglages").focus(); });
  $("#voix-test").addEventListener("click", function () { parler("Bonjour agent ! Voici la voix qui lira les consignes.", null); });
  $("#reglages-defaut").addEventListener("click", function () {
    reglages = reglagesDefaut(); stockage.ecrire("reglages", reglages); appliquerReglages(); remplirFormReglages();
    annoncer("Réglages de départ rétablis.");
  });

  $("#profil-lecture").addEventListener("click", function () {
    Object.assign(reglages, { taille: reglages.taille === "100" ? "125" : reglages.taille, theme: reglages.theme === "clair" ? "creme" : reglages.theme,
      interligne: true, lettres: true, paragraphes: true, lignes: true, alterne: true, clic: true });
    stockage.ecrire("reglages", reglages); appliquerReglages(); remplirFormReglages();
    annoncer("Mode lecture facilitée activé.");
  });

  /* Guide de lecture : une bande claire suit la souris, le doigt ou l'élément actif */
  function placerGuide(y) {
    var h = parseFloat(getComputedStyle(document.body).fontSize) * 2.6;
    $(".guide__haut").style.height = Math.max(0, y - h / 2) + "px";
    $(".guide__bas").style.top = (y + h / 2) + "px";
  }
  document.addEventListener("pointermove", function (e) { if (reglages.guide) placerGuide(e.clientY); }, { passive: true });
  document.addEventListener("focusin", function (e) {
    if (!reglages.guide || !e.target.getBoundingClientRect) return;
    var r = e.target.getBoundingClientRect(); placerGuide(r.top + r.height / 2);
  });

  /* Lecture au clic : touche un texte pour l'entendre */
  vue.addEventListener("click", function (e) {
    if (!reglages.clic || !voixDispo) return;
    if (e.target.closest("button, a, input, select, textarea, summary")) return;
    var el = e.target.closest("p, li, h1, h2, h3, dd, dt, legend, .option, th, td");
    if (!el || !vue.contains(el)) return;
    var texte = el.textContent.replace(/\s+/g, " ").trim();
    if (!texte) return;
    $$(".lecture-en-cours").forEach(function (x) { x.classList.remove("lecture-en-cours"); });
    el.classList.add("lecture-en-cours");
    parler(texte, null);
    setTimeout(function () { el.classList.remove("lecture-en-cours"); }, 2500);
  });

  $(".lien-evitement").addEventListener("click", function (e) { e.preventDefault(); $("#principal").focus(); });

  window.addEventListener("hashchange", router);
  router();
})();
