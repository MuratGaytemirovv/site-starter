// Template interface strings (buttons, labels, cookie banner, form). These are
// the same for every client; client texts live in src/data/content/<lang>.json.
// Adding a language = add a dictionary with the same keys.
import type { Lang, SectionId } from '../lib/schema';

const nl = {
  htmlLang: 'nl-BE',
  ogLocale: 'nl_BE',
  skipToContent: 'Ga naar inhoud',
  demoNotice: 'Demoversie — voorbeeldsite, gegevens nog niet bevestigd door het bedrijf.',
  // Section names in menus and the #anchor in the URL.
  sections: {
    hero: { nav: 'Home', anchor: 'top' },
    trust: { nav: '', anchor: 'vertrouwen' },
    services: { nav: 'Diensten', anchor: 'diensten' },
    about: { nav: 'Over ons', anchor: 'over-ons' },
    process: { nav: 'Werkwijze', anchor: 'werkwijze' },
    gallery: { nav: 'Realisaties', anchor: 'realisaties' },
    'why-us': { nav: 'Waarom wij', anchor: 'waarom-wij' },
    reviews: { nav: 'Reviews', anchor: 'reviews' },
    faq: { nav: 'FAQ', anchor: 'faq' },
    contact: { nav: 'Contact', anchor: 'contact' },
  } satisfies Record<SectionId, { nav: string; anchor: string }>,
  // Desktop header shows at most these; the mobile menu shows all enabled sections.
  headerNav: ['services', 'gallery', 'about', 'faq'] as SectionId[],
  routes: { region: 'regio' },
  nav: {
    main: 'Hoofdnavigatie',
    mobile: 'Mobiele navigatie',
    openMenu: 'Menu openen',
    closeMenu: 'Menu sluiten',
    home: 'naar de startpagina',
  },
  cta: {
    quote: 'Offerte aanvragen',
    call: 'Bellen',
    whatsapp: 'WhatsApp',
    more: 'Meer weten',
    back: 'Terug naar de startpagina',
  },
  contact: {
    phone: 'Telefoon',
    email: 'E-mail',
    address: 'Adres',
    hours: 'Openingsuren',
    closed: 'Gesloten',
    opensMaps: '(opent Google Maps in een nieuw tabblad)',
    vat: 'BTW',
  },
  form: {
    name: 'Naam',
    phone: 'Telefoon',
    email: 'E-mail',
    service: 'Waarover gaat het?',
    servicePlaceholder: 'Kies een dienst',
    serviceOther: 'Iets anders',
    message: 'Bericht',
    messagePlaceholder: 'Vertel kort over uw vraag of project',
    honeypot: 'Laat dit veld leeg',
    required: 'verplicht',
    submit: 'Verstuur aanvraag',
    sending: 'Bezig met versturen…',
    privacyNote: 'Uw gegevens gebruiken we enkel om uw aanvraag te beantwoorden.',
    success: 'Bedankt! Uw aanvraag is verstuurd. We nemen zo snel mogelijk contact op.',
    failed: 'Uw bericht kon niet verstuurd worden. Bel of mail ons rechtstreeks:',
  },
  services: { all: 'Alle diensten', other: 'Andere diensten' },
  regions: { activeIn: 'Actief in', title: (name: string) => `In ${name}` },
  reviews: { source: (s: string) => `Review via ${s}`, onGoogle: 'Bekijk alle reviews op Google', stars: (n: number) => `${n} van 5 sterren` },
  footer: { company: 'Bedrijf', services: 'Diensten', contact: 'Contact', cookieSettings: 'Cookie-instellingen' },
  cookies: {
    label: 'Cookiemelding',
    text: 'Deze site gebruikt enkel noodzakelijke opslag om uw keuze te onthouden. Externe inhoud, zoals een kaart van Google Maps, laden we pas na uw toestemming.',
    settings: 'Instellingen',
    reject: 'Weigeren',
    accept: 'Accepteren',
    save: 'Keuze opslaan',
    necessary: 'Noodzakelijk',
    necessaryText: 'altijd aan. Onthoudt enkel uw keuze in deze browser.',
    media: 'Externe media',
    mediaText: 'kaarten en video’s van derden (bv. Google Maps). Die diensten plaatsen eigen cookies.',
    mapPlaceholder: 'Kaart van Google Maps — laadt pas na uw toestemming.',
    loadMap: 'Kaart laden',
    openMaps: 'Open in Google Maps',
  },
  notFound: { title: 'Pagina niet gevonden', text: 'Deze pagina bestaat niet (meer). Misschien vindt u wat u zoekt via de startpagina.' },
  days: { Monday: 'ma', Tuesday: 'di', Wednesday: 'wo', Thursday: 'do', Friday: 'vr', Saturday: 'za', Sunday: 'zo' },
};

export type UI = typeof nl;

const dictionaries: Partial<Record<Lang, UI>> = { nl };

export function ui(lang: Lang): UI {
  const dict = dictionaries[lang];
  if (!dict) throw new Error(`No interface strings for language "${lang}" in src/i18n/ui.ts`);
  return dict;
}
