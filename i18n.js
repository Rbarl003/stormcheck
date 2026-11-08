// ============================================================
// StormCheck — i18n.js  (English · Español · Kreyòl ayisyen)
// All the words on screen, in three languages.
// Reasons from the engine have a key (like "payment"). English comes from
// engine.js; Spanish and Haitian Creole versions are here.
// NOTE: Kreyòl translations should be reviewed by a native speaker.
// ============================================================

const I18N = (() => {
  const LANG_KEY = "stormcheck-lang";

  // ---------- Screen text ----------
  const UI = {
    en: {
      tagline: "Is this hurricane alert real?",
      offline: "You're offline. StormCheck still works using saved data.",
      inputLabel: "Paste an alert, text message, or link",
      placeholder: "Example: URGENT! Hurricane Category 6 hitting Miami tonight. Click bit.ly/fema-pay to claim your relief money now!",
      placeholderEmpty: "Paste an alert or message here first.",
      check: "Check this alert",
      sample: "Try a sample alert",
      footer: "🔒 Checks run on your phone. Nothing you paste is sent anywhere.",
      titles: { verified: "✅ Verified", suspicious: "⚠️ Suspicious", unverified: "❔ Unverified" },
      summaries: {
        verified: "This matches an official source.",
        suspicious: "This has signs of a scam or fake news. Don't click links, pay, or share personal info.",
        unverified: "We can't confirm this. Treat it as a rumor until an official source says so.",
      },
      trust: "Trust score",
      why: "Why?",
      spotted: "What we spotted in the message",
      legend: ["danger", "warning", "official"],
      xray: "🔍 Link X-ray",
      officialTitle: "📡 Official alerts · Miami-Dade",
      checking: "Checking official alerts…",
      statusLive: (t) => `Live from the National Weather Service · updated ${t}`,
      statusSaved: (t) => `Offline: using saved official data from ${t}`,
      statusDemo: "Demo storm: fictional Hurricane Kendra (practice data, not real)",
      statusNone: "Not downloaded yet. Connect to the internet once to save official alerts on this phone.",
      noAlerts: "✓ No active weather alerts for Miami-Dade right now.",
      demoToggle: "Demo storm mode (practice data for presentations)",
      shareBtn: "📲 Share with a neighbor",
      shareTitle: "Share with a neighbor",
      shareHelp: "Ask them to point their phone camera at this code. StormCheck will open and check the message on their phone.",
      shareSafe: "🔒 The code carries the message, not our verdict, so nobody can fake a “Verified” code.",
      shareOffline: "No internet needed if they've opened StormCheck before.",
      shareShort: "This message was long, so only the first 1,000 characters are in the code.",
      shareSystem: "Send by text instead",
      close: "Close",
      sharedBanner: "📲 Someone shared this message with you. StormCheck checked it on your phone.",
      readAloud: "🔊 Read aloud",
      stopReading: "⏹ Stop",
      score: "Trust score",
    },
    es: {
      tagline: "¿Es real esta alerta de huracán?",
      offline: "Estás sin conexión. StormCheck sigue funcionando con datos guardados.",
      inputLabel: "Pega una alerta, mensaje de texto o enlace",
      placeholder: "Ejemplo: ¡URGENTE! Huracán categoría 6 llega a Miami esta noche. ¡Haz clic en bit.ly/fema-pay para cobrar tu ayuda ahora!",
      placeholderEmpty: "Primero pega aquí una alerta o mensaje.",
      check: "Verificar esta alerta",
      sample: "Probar una alerta de ejemplo",
      footer: "🔒 La verificación se hace en tu teléfono. Nada de lo que pegas se envía a ningún lugar.",
      titles: { verified: "✅ Verificada", suspicious: "⚠️ Sospechosa", unverified: "❔ Sin verificar" },
      summaries: {
        verified: "Coincide con una fuente oficial.",
        suspicious: "Tiene señales de estafa o noticia falsa. No hagas clic en enlaces, no pagues y no compartas datos personales.",
        unverified: "No podemos confirmarla. Trátala como un rumor hasta que una fuente oficial lo confirme.",
      },
      trust: "Nivel de confianza",
      why: "¿Por qué?",
      spotted: "Lo que encontramos en el mensaje",
      legend: ["peligro", "cuidado", "oficial"],
      xray: "🔍 Rayos X del enlace",
      officialTitle: "📡 Alertas oficiales · Miami-Dade",
      checking: "Buscando alertas oficiales…",
      statusLive: (t) => `En vivo del Servicio Nacional de Meteorología · actualizado ${t}`,
      statusSaved: (t) => `Sin conexión: usando datos oficiales guardados de las ${t}`,
      statusDemo: "Tormenta de prueba: huracán Kendra ficticio (datos de práctica, no reales)",
      statusNone: "Aún no descargado. Conéctate a internet una vez para guardar las alertas oficiales en este teléfono.",
      noAlerts: "✓ No hay alertas meteorológicas activas para Miami-Dade en este momento.",
      demoToggle: "Modo tormenta de prueba (datos de práctica para presentaciones)",
      shareBtn: "📲 Compartir con un vecino",
      shareTitle: "Compartir con un vecino",
      shareHelp: "Pídele que apunte la cámara de su teléfono a este código. StormCheck se abrirá y revisará el mensaje en su teléfono.",
      shareSafe: "🔒 El código lleva el mensaje, no nuestro resultado, así que nadie puede falsificar un código “Verificado”.",
      shareOffline: "No necesita internet si ya abrió StormCheck antes.",
      shareShort: "El mensaje era largo, así que solo los primeros 1,000 caracteres están en el código.",
      shareSystem: "Enviar por mensaje de texto",
      close: "Cerrar",
      sharedBanner: "📲 Alguien compartió este mensaje contigo. StormCheck lo revisó en tu teléfono.",
      readAloud: "🔊 Leer en voz alta",
      stopReading: "⏹ Detener",
    },
    ht: {
      tagline: "Èske alèt siklòn sa a vre?",
      offline: "Ou pa gen entènèt. StormCheck toujou mache ak done ki sere.",
      inputLabel: "Kole yon alèt, yon mesaj tèks, oswa yon lyen",
      placeholder: "Egzanp: IJAN! Siklòn kategori 6 ap frape Miami aswè a. Klike bit.ly/fema-pay pou touche lajan èd ou kounye a!",
      placeholderEmpty: "Kole yon alèt oswa yon mesaj la a anvan.",
      check: "Verifye alèt sa a",
      sample: "Eseye yon alèt egzanp",
      footer: "🔒 Verifikasyon an fèt sou telefòn ou. Anyen ou kole pa voye okenn kote.",
      titles: { verified: "✅ Verifye", suspicious: "⚠️ Sispèk", unverified: "❔ Pa verifye" },
      summaries: {
        verified: "Li koresponn ak yon sous ofisyèl.",
        suspicious: "Li gen siy yon eskwoqri oswa yon fo nouvèl. Pa klike sou lyen, pa peye, pa bay enfòmasyon pèsonèl ou.",
        unverified: "Nou pa ka konfime li. Konsidere l tankou yon tripotay jiskaske yon sous ofisyèl konfime l.",
      },
      trust: "Nivo konfyans",
      why: "Poukisa?",
      spotted: "Sa nou jwenn nan mesaj la",
      legend: ["danje", "atansyon", "ofisyèl"],
      xray: "🔍 Radyografi lyen an",
      officialTitle: "📡 Alèt ofisyèl · Miami-Dade",
      checking: "N ap chèche alèt ofisyèl yo…",
      statusLive: (t) => `An dirèk nan Sèvis Meteyo Nasyonal la · mete ajou a ${t}`,
      statusSaved: (t) => `San entènèt: n ap itilize done ofisyèl ki sere a ${t}`,
      statusDemo: "Tanpèt pratik: siklòn Kendra ki pa egziste (done pratik, pa vre)",
      statusNone: "Poko telechaje. Konekte sou entènèt yon fwa pou sere alèt ofisyèl yo sou telefòn sa a.",
      noAlerts: "✓ Pa gen okenn alèt meteyo aktif pou Miami-Dade kounye a.",
      demoToggle: "Mòd tanpèt pratik (done pratik pou prezantasyon)",
      shareBtn: "📲 Pataje ak yon vwazen",
      shareTitle: "Pataje ak yon vwazen",
      shareHelp: "Mande l pwente kamera telefòn li sou kòd sa a. StormCheck ap louvri epi verifye mesaj la sou telefòn li.",
      shareSafe: "🔒 Kòd la pote mesaj la, pa rezilta nou an, kidonk pèsonn pa ka fè yon fo kòd “Verifye”.",
      shareOffline: "Li pa bezwen entènèt si l te deja louvri StormCheck.",
      shareShort: "Mesaj la te long, kidonk se sèlman 1,000 premye karaktè yo ki nan kòd la.",
      shareSystem: "Voye pa mesaj tèks",
      close: "Fèmen",
      sharedBanner: "📲 Yon moun pataje mesaj sa a avè w. StormCheck verifye l sou telefòn ou.",
      readAloud: "🔊 Li l fò",
      stopReading: "⏹ Kanpe",
    },
  };

  // ---------- Agency names ----------
  const ORGS = {
    es: {
      "nhc.noaa.gov": "el Centro Nacional de Huracanes", "weather.gov": "el Servicio Nacional de Meteorología",
      "noaa.gov": "NOAA, la agencia nacional del clima", "disasterassistance.gov": "FEMA (DisasterAssistance.gov)",
      "fema.gov": "FEMA", "ready.gov": "Ready.gov (gobierno federal)", "miamidade.gov": "el Condado de Miami-Dade",
      "floridadisaster.org": "la División de Manejo de Emergencias de Florida", "myflorida.com": "el Estado de Florida",
      "redcross.org": "la Cruz Roja Americana", "gov": "una agencia del gobierno de EE. UU.",
      "fema-phone": "la línea oficial de ayuda de FEMA", "md311": "la línea 311 de Miami-Dade",
      "miamidade-em": "Manejo de Emergencias de Miami-Dade",
    },
    ht: {
      "nhc.noaa.gov": "Sant Nasyonal Siklòn yo", "weather.gov": "Sèvis Meteyo Nasyonal la",
      "noaa.gov": "NOAA, ajans nasyonal meteyo a", "disasterassistance.gov": "FEMA (DisasterAssistance.gov)",
      "fema.gov": "FEMA", "ready.gov": "Ready.gov (gouvènman federal)", "miamidade.gov": "Konte Miami-Dade",
      "floridadisaster.org": "Divizyon Jesyon Ijans Florid la", "myflorida.com": "Eta Florid",
      "redcross.org": "Lakwa Wouj Ameriken", "gov": "yon ajans gouvènman Etazini",
      "fema-phone": "liy èd ofisyèl FEMA a", "md311": "liy 311 Miami-Dade",
      "miamidade-em": "Jesyon Ijans Miami-Dade",
    },
  };

  // ---------- Official alert names ----------
  const EVENTS = {
    es: {
      "hurricane warning": "Aviso de huracán", "hurricane watch": "Vigilancia de huracán",
      "tropical storm warning": "Aviso de tormenta tropical", "tropical storm watch": "Vigilancia de tormenta tropical",
      "storm surge warning": "Aviso de marejada ciclónica", "storm surge watch": "Vigilancia de marejada ciclónica",
      "flood warning": "Aviso de inundación", "flood watch": "Vigilancia de inundación", "flood advisory": "Advertencia de inundación",
      "flash flood warning": "Aviso de inundación repentina", "tornado warning": "Aviso de tornado", "tornado watch": "Vigilancia de tornado",
    },
    ht: {
      "hurricane warning": "Avètisman siklòn", "hurricane watch": "Veye siklòn",
      "tropical storm warning": "Avètisman tanpèt twopikal", "tropical storm watch": "Veye tanpèt twopikal",
      "storm surge warning": "Avètisman lanmè k ap monte", "storm surge watch": "Veye lanmè k ap monte",
      "flood warning": "Avètisman inondasyon", "flood watch": "Veye inondasyon", "flood advisory": "Konsèy inondasyon",
      "flash flood warning": "Avètisman inondasyon brid sou kou", "tornado warning": "Avètisman tònad", "tornado watch": "Veye tònad",
    },
  };

  // ---------- Reasons (Spanish and Kreyòl) ----------
  const REASONS = {
    es: {
      "personal-info": (p) => `Pide información privada ("${p.m}"). Las alertas de emergencia reales nunca piden tu número de Seguro Social, datos bancarios ni contraseñas.`,
      "payment": (p) => `Te pide pagar ("${p.m}"). Las agencias del gobierno nunca cobran por alertas, refugios ni ayuda, y nunca piden tarjetas de regalo, Zelle ni criptomonedas.`,
      "conspiracy": (p) => `Dice que las autoridades esconden la verdad ("${p.m}"). Es una táctica clásica de noticias falsas. Los avisos de huracán reales se publican a propósito.`,
      "free-money": (p) => `Promete dinero o trato especial ("${p.m}"). La ayuda real por desastre se solicita en DisasterAssistance.gov. Nadie la "gana" por un mensaje de texto.`,
      "pressure": (p) => `Te presiona para actuar rápido ("${p.m}"). Los estafadores apuran a la gente para que no se detenga a verificar.`,
      "share-pressure": (p) => `Te empuja a difundirlo ("${p.m}"). Las noticias falsas dependen de que la gente las reenvíe sin verificar.`,
      "impossible-category": (p) => `Menciona "${p.m}". Eso no existe: los huracanes solo llegan hasta la categoría 5.`,
      "impossible-wind": (p) => `Dice que habrá vientos de "${p.m}". Es más rápido que cualquier huracán registrado, así que casi seguro es inventado.`,
      "shouting": () => "Está escrito con pánico (TODO EN MAYÚSCULAS o muchos !!!). Las alertas oficiales son calmadas y basadas en hechos.",
      "link-official": (p) => `Lleva a ${p.host}, el sitio web real de ${org("es", p)}.`,
      "link-ip": (p) => `Usa una dirección de solo números (${p.host}) en vez del nombre de un sitio web. Las agencias reales nunca hacen esto. Oculta quién maneja el sitio.`,
      "link-shortener": (p) => `${p.host} es un acortador de enlaces. Oculta el sitio real, así que no puedes ver a dónde te lleva. Las alertas oficiales enlazan directo a sitios .gov.`,
      "link-punycode": () => "Esta dirección usa letras parecidas de otros alfabetos para imitar un sitio web real.",
      "link-lookalike": (p) => `Parece oficial pero no lo es. El sitio real es "${p.site}", que no pertenece al gobierno. Los estafadores copian nombres como ${p.brand} para engañar.`,
      "link-unknown": (p) => `Lleva a ${p.host}, que no es un sitio oficial de emergencias, así que no puede confirmar esta alerta.`,
      "download": () => "Te pide descargar un archivo de aplicación desde un enlace. Las aplicaciones oficiales de alertas solo vienen de App Store o Google Play.",
      "unknown-phone": (p) => `Te pide contactar un número desconocido (${p.phone}) sobre ayuda o dinero. Busca el número en un sitio oficial primero. La línea real de FEMA es 1-800-621-3362.`,
      "authority-mismatch": (p) => `Usa el nombre de ${org("es", p)}, pero no te envía a su sitio web real (${p.domain}) ni a su línea oficial. Los estafadores suelen usar nombres de agencias reales.`,
      "official-unknown-storm": (p) => `Habla de "${p.storm}", pero los datos oficiales del Servicio Nacional de Meteorología${upd("es", p)} no muestran ninguna tormenta con ese nombre que afecte a Miami-Dade. Puede ser falso o viejo.`,
      "official-missing-event": (p) => `Menciona un "${ev("es", p.event)}", pero los datos oficiales del Servicio Nacional de Meteorología${upd("es", p)} no muestran ese aviso activo para Miami-Dade. Puede ser falso, viejo o muy reciente. Revisa weather.gov/mfl.`,
      "good-link": (p) => `Enlaza a ${p.host}, el sitio web oficial de ${org("es", p)}.`,
      "good-phone": (p) => `El número ${p.phone} es ${org("es", p)}.`,
      "good-match": (p) => `Coincide con una alerta oficial activa ahora mismo: "${ev("es", p.event)}" de ${p.sender}${upd("es", p)}.`,
      "good-none": () => "No se encontraron señales de estafa ni de noticias falsas.",
      "hearsay": (p) => `Se basa en lo que dijo alguien ("${p.m}"), no en una fuente oficial.`,
      "claim-no-link": (p) => `Dice que viene de ${org("es", p)}, pero no da un enlace oficial que lo pruebe. Revisa ${p.domain} directamente.`,
      "no-source": () => "Este mensaje no tiene fuente ni enlace oficial, así que no se puede confirmar.",
      "official-but-flags": () => "Tiene un enlace oficial, pero también algunas señales de alerta. Confírmalo en el sitio oficial.",
      "no-flags-rumor": () => "No se encontraron señales de estafa. Trátalo como un rumor hasta que una fuente oficial lo confirme.",
    },
    ht: {
      "personal-info": (p) => `Li mande enfòmasyon prive ("${p.m}"). Vrè alèt ijans pa janm mande nimewo Sekirite Sosyal ou, enfòmasyon bank ou, oswa modpas ou.`,
      "payment": (p) => `Li mande w peye ("${p.m}"). Ajans gouvènman yo pa janm fè w peye pou alèt, abri, oswa èd, epi yo pa janm mande kat kado, Zelle, oswa kripto.`,
      "conspiracy": (p) => `Li di otorite yo ap kache verite a ("${p.m}"). Se yon vye taktik fo nouvèl. Vrè avètisman siklòn fèt pou tout moun konnen.`,
      "free-money": (p) => `Li pwomèt lajan oswa yon favè ("${p.m}"). Vrè èd pou dezas mande sou DisasterAssistance.gov. Pèsonn pa "genyen" l nan yon mesaj tèks.`,
      "pressure": (p) => `Li prese w aji vit ("${p.m}"). Eskwo yo prese moun pou yo pa pran tan verifye.`,
      "share-pressure": (p) => `Li pouse w pataje l ("${p.m}"). Fo nouvèl gaye lè moun voye l bay lòt san yo pa verifye.`,
      "impossible-category": (p) => `Li pale de "${p.m}". Sa pa egziste: siklòn yo rive sèlman jiska kategori 5.`,
      "impossible-wind": (p) => `Li di gen van "${p.m}". Sa pi vit pase nenpòt siklòn ki janm anrejistre, kidonk li prèske sèten se manti.`,
      "shouting": () => "Li ekri ak panik (TOUT AN MAJISKIL oswa anpil !!!). Alèt ofisyèl yo kalm epi yo bay fè.",
      "link-official": (p) => `Li mennen sou ${p.host}, vrè sit entènèt ${org("ht", p)}.`,
      "link-ip": (p) => `Li sèvi ak yon adrès ki se sèlman chif (${p.host}) olye non yon sit. Vrè ajans pa janm fè sa. Li kache kiyès ki dèyè sit la.`,
      "link-shortener": (p) => `${p.host} se yon zouti ki fè lyen vin kout. Li kache vrè sit la, kidonk ou pa ka wè ki kote l ap mennen w. Alèt ofisyèl yo mennen dirèkteman sou sit .gov.`,
      "link-punycode": () => "Adrès sa a sèvi ak lèt ki sanble ak lòt alfabè pou l imite yon vrè sit.",
      "link-lookalike": (p) => `Li sanble ofisyèl men li pa ofisyèl. Vrè sit la se "${p.site}", e se pa gouvènman an ki genyen l. Eskwo yo kopye non tankou ${p.brand} pou twonpe moun.`,
      "link-unknown": (p) => `Li mennen sou ${p.host}, ki pa yon sit ijans ofisyèl, kidonk li pa ka konfime alèt sa a.`,
      "download": () => "Li mande w telechaje yon fichye aplikasyon nan yon lyen. Aplikasyon alèt ofisyèl yo sòti sèlman nan App Store oswa Google Play.",
      "unknown-phone": (p) => `Li mande w kontakte yon nimewo ou pa konnen (${p.phone}) pou èd oswa lajan. Chèche nimewo a sou yon sit ofisyèl anvan. Vrè liy èd FEMA a se 1-800-621-3362.`,
      "authority-mismatch": (p) => `Li sèvi ak non ${org("ht", p)}, men li pa voye w sou vrè sit yo (${p.domain}) ni sou liy ofisyèl yo. Eskwo yo konn prete non vrè ajans.`,
      "official-unknown-storm": (p) => `Li pale de "${p.storm}", men done ofisyèl Sèvis Meteyo Nasyonal la${upd("ht", p)} pa gen okenn tanpèt ak non sa a k ap afekte Miami-Dade. Li ka fo oswa ansyen.`,
      "official-missing-event": (p) => `Li pale de yon "${ev("ht", p.event)}", men done ofisyèl Sèvis Meteyo Nasyonal la${upd("ht", p)} pa montre avètisman sa a aktif pou Miami-Dade. Li ka fo, ansyen, oswa tou nèf. Gade weather.gov/mfl.`,
      "good-link": (p) => `Li gen yon lyen sou ${p.host}, sit ofisyèl ${org("ht", p)}.`,
      "good-phone": (p) => `Nimewo ${p.phone} se ${org("ht", p)}.`,
      "good-match": (p) => `Li koresponn ak yon alèt ofisyèl ki aktif kounye a: "${ev("ht", p.event)}" soti nan ${p.sender}${upd("ht", p)}.`,
      "good-none": () => "Nou pa jwenn okenn siy eskwoqri oswa fo nouvèl.",
      "hearsay": (p) => `Li baze sou sa yon moun di ("${p.m}"), se pa sou yon sous ofisyèl.`,
      "claim-no-link": (p) => `Li di l soti nan ${org("ht", p)}, men li pa bay okenn lyen ofisyèl pou pwouve sa. Al gade ${p.domain} dirèkteman.`,
      "no-source": () => "Mesaj sa a pa gen okenn sous oswa lyen ofisyèl, kidonk nou pa ka konfime l.",
      "official-but-flags": () => "Li gen yon lyen ofisyèl, men li gen kèk siy danje tou. Verifye l sou sit ofisyèl la.",
      "no-flags-rumor": () => "Nou pa jwenn siy eskwoqri. Konsidere l tankou yon tripotay jiskaske yon sous ofisyèl konfime l.",
    },
  };

  // ---------- Helpers ----------
  function org(lang, p) { return (ORGS[lang] && ORGS[lang][p.org]) || p.orgName || ""; }
  function ev(lang, name) { return (EVENTS[lang] && EVENTS[lang][(name || "").toLowerCase()]) || name; }
  function upd(lang, p) {
    if (!p.time) return "";
    return lang === "es" ? ` (actualizado ${p.time})` : ` (mete ajou a ${p.time})`;
  }

  function getLang() {
    let saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    if (saved && UI[saved]) return saved;
    const nav = (navigator.language || "en").slice(0, 2);
    return nav === "es" ? "es" : nav === "ht" ? "ht" : "en";
  }
  function setLang(lang) { try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ } }

  // Screen text in the chosen language (falls back to English)
  function ui(lang, key) { return (UI[lang] && UI[lang][key] !== undefined) ? UI[lang][key] : UI.en[key]; }

  // One engine reason ({ key, p, text }) in the chosen language
  function reason(lang, it) {
    const fn = REASONS[lang] && REASONS[lang][it.key];
    return fn ? fn(it.p || {}) : it.text;
  }

  // Speech voices for read aloud
  const SPEECH = { en: ["en-US", "en"], es: ["es-US", "es-MX", "es"], ht: ["ht", "fr-HT", "fr"] };

  return { ui, reason, event: ev, getLang, setLang, SPEECH, REASONS };
})();
