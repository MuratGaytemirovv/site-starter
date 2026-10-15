// Privacy and cookie policy, assembled from the client facts. Standard GDPR
// text for a small Belgian business — NOT legal advice: show it to the client
// (and a lawyer) before launch (websites/launch-checklist.md).
// Which processors are mentioned comes from site-facts.json → privacy.processors;
// the Google Maps paragraphs appear only when the map is shown (showAddress).
import type { Facts, Lang } from '../lib/schema';

export type LegalBlock = { h: string; p?: string[]; list?: string[] };
export type LegalDoc = { title: string; intro: string; blocks: LegalBlock[] };

export type LegalContext = {
  facts: Facts;
  address: string;
  maps: boolean; // Google Maps embed after consent
  form: boolean; // contact form on the site
  privacyHref: string;
  cookiesHref: string;
};

type Proc = Facts['privacy']['processors'][number];
const has = (c: LegalContext, p: Proc) => c.facts.privacy.processors.includes(p);
const be = (c: LegalContext) => c.facts.address.country === 'BE';
const controller = (c: LegalContext, vatLabel: string) =>
  [c.facts.legalName, c.facts.showAddress ? c.address : null, c.facts.vat ? `${vatLabel} ${c.facts.vat}` : null, `${c.facts.email} · ${c.facts.phone}`]
    .filter(Boolean)
    .join(' — ');
const only = <T,>(cond: boolean, items: T[]) => (cond ? items : []);

const nl = {
  privacy(c: LegalContext): LegalDoc {
    return {
      title: 'Privacybeleid',
      intro: 'We vinden het belangrijk dat u weet wat we met uw gegevens doen. Hieronder leest u dat in gewone taal.',
      blocks: [
        { h: '1. Wie is verantwoordelijk?', p: [controller(c, 'BTW'), 'Wij zijn de verwerkingsverantwoordelijke voor de gegevens die u via deze website of rechtstreeks aan ons bezorgt.'] },
        {
          h: '2. Welke gegevens gebruiken we, waarom en op welke basis?',
          p: [
            ...only(c.form, [
              'Contactformulier: naam, telefoonnummer, e-mailadres (als u het invult), de gekozen dienst en uw bericht. Waarom: om uw vraag te beantwoorden en, als u dat wenst, een offerte op te stellen. Basis: maatregelen op uw verzoek voorafgaand aan een overeenkomst (art. 6.1.b AVG).',
            ]),
            'Contact per telefoon, e-mail' + (has(c, 'whatsapp') ? ' of WhatsApp' : '') + ': de gegevens die u zelf meedeelt. Basis: uw verzoek en ons gerechtvaardigd belang om vragen te beantwoorden (art. 6.1.b en 6.1.f AVG).',
            'Uitvoering van opdrachten en administratie: contactgegevens, offertes en facturen. Basis: uitvoering van de overeenkomst en onze wettelijke boekhoudkundige verplichtingen (art. 6.1.b en 6.1.c AVG).',
            'Beveiliging: de hostingdienst verwerkt bij elk bezoek technische gegevens (IP-adres, tijdstip, gevraagde pagina) in serverlogs. ' + (c.form ? 'Het formulier bevat een onzichtbaar veld tegen spam-robots en beperkt het aantal aanvragen per IP-adres. ' : '') + 'Basis: ons gerechtvaardigd belang om de website veilig te houden (art. 6.1.f AVG).',
            ...only(c.maps, ['Kaart van Google Maps: enkel als u daarvoor toestemming geeft. Basis: uw toestemming (art. 6.1.a AVG), die u op elk moment kan intrekken.']),
            'We gebruiken geen bezoekersstatistieken en geen advertentiecookies.',
          ],
        },
        {
          h: '3. Hoe lang bewaren we uw gegevens?',
          list: [
            'Aanvragen die niet tot een opdracht leiden: maximaal 2 jaar na ons laatste contact.',
            'Klanten: zolang nodig voor de opdracht en eventuele garantie, en zolang de wet ons verplicht boekhoudkundige stukken te bewaren (10 jaar).',
            'Serverlogs: kort, enkel zolang nodig voor de beveiliging.',
          ],
        },
        {
          h: '4. Met wie delen we uw gegevens?',
          p: ['We verkopen uw gegevens niet. We schakelen enkel diensten in die nodig zijn om de website en onze dienstverlening te laten werken (verwerkers):'],
          list: [
            ...only(has(c, 'vercel'), ['Vercel: hosting van de website.']),
            ...only(has(c, 'resend'), ['Resend: e-maildienst die berichten van het contactformulier naar ons doorstuurt.']),
            ...only(has(c, 'telegram'), ['Telegram: berichtendienst waarmee we een melding van een nieuwe aanvraag ontvangen.']),
            ...only(has(c, 'odoo'), ['Odoo: ons klantenbeheer, waarin aanvragen terechtkomen.']),
            ...only(has(c, 'whatsapp'), ['WhatsApp (Meta): als u ons via WhatsApp contacteert.']),
            ...only(c.maps, ['Google: de kaart van Google Maps, enkel na uw toestemming.']),
            ...only(has(c, 'accountant'), ['Onze boekhouder en, waar de wet dat vereist, overheidsdiensten.']),
          ],
        },
        { h: '5. Doorgifte buiten de EER', p: ['Sommige van deze diensten zijn gevestigd buiten de Europese Economische Ruimte, bv. in de Verenigde Staten. Doorgifte gebeurt met passende waarborgen, zoals de standaardcontractbepalingen van de Europese Commissie of het EU-VS Data Privacy Framework.'] },
        { h: '6. Cookies', p: [`Welke cookies en vergelijkbare technieken we gebruiken, leest u in ons cookiebeleid (${c.cookiesHref}).`] },
        {
          h: '7. Uw rechten',
          list: [
            'uw gegevens inzien en een kopie krijgen;',
            'onjuiste gegevens laten verbeteren;',
            'uw gegevens laten wissen of de verwerking laten beperken;',
            'uw gegevens in een gangbaar formaat ontvangen (overdraagbaarheid);',
            'bezwaar maken tegen verwerking op basis van ons gerechtvaardigd belang;',
            'uw toestemming op elk moment intrekken.',
          ],
          p: [`Stuur uw verzoek naar ${c.facts.email}. We antwoorden binnen een maand.`],
        },
        {
          h: '8. Klacht indienen',
          p: [
            'Bent u niet tevreden? Neem eerst contact met ons op. U kan ook een klacht indienen bij ' +
              (be(c) ? 'de Gegevensbeschermingsautoriteit, Drukpersstraat 35, 1000 Brussel, www.gegevensbeschermingsautoriteit.be.' : 'de toezichthoudende autoriteit voor gegevensbescherming in uw land.'),
          ],
        },
        { h: '9. Wijzigingen', p: ['We kunnen dit beleid aanpassen als de wet of onze werkwijze verandert. De datum bovenaan geeft aan wanneer het laatst werd bijgewerkt.'] },
      ],
    };
  },
  cookies(c: LegalContext): LegalDoc {
    return {
      title: 'Cookiebeleid',
      intro: 'Cookies en vergelijkbare technieken zijn kleine stukjes informatie die een website in uw browser bewaart. Deze site gebruikt er zo weinig mogelijk.',
      blocks: [
        { h: 'Noodzakelijk (altijd aan)', list: ['site-consent (lokale opslag van uw browser): onthoudt uw keuze in de cookiemelding. Bevat geen persoonsgegevens en wordt niet naar ons doorgestuurd. Blijft bewaard tot u ze wist of uw keuze wijzigt.'] },
        ...only(c.maps, [
          { h: 'Externe media (enkel na uw toestemming)', p: ['De kaart van Google Maps wordt pas geladen als u daarvoor kiest. Google plaatst dan eigen cookies en ontvangt onder meer uw IP-adres. Zie het privacybeleid van Google: policies.google.com/privacy.'] },
        ]),
        { h: 'Geen statistieken of advertenties', p: ['We gebruiken geen analytische cookies en geen advertentiecookies.'] },
        { h: 'Uw keuze wijzigen', p: ['Via de link Cookie-instellingen onderaan elke pagina kan u uw keuze altijd aanpassen of intrekken. U kan cookies en lokale opslag ook wissen in de instellingen van uw browser.'] },
        { h: 'Meer weten', p: [`Hoe we met persoonsgegevens omgaan, leest u in ons privacybeleid (${c.privacyHref}). Vragen? Mail naar ${c.facts.email}.`] },
      ],
    };
  },
};

const fr: typeof nl = {
  privacy(c) {
    return {
      title: 'Politique de confidentialité',
      intro: 'Nous tenons à ce que vous sachiez ce que nous faisons de vos données. Vous trouverez ci-dessous l’essentiel, en langage simple.',
      blocks: [
        { h: '1. Qui est responsable ?', p: [controller(c, 'TVA'), 'Nous sommes le responsable du traitement des données que vous nous transmettez via ce site ou directement.'] },
        {
          h: '2. Quelles données, pourquoi et sur quelle base ?',
          p: [
            ...only(c.form, [
              'Formulaire de contact : nom, numéro de téléphone, adresse e-mail (si vous la donnez), service choisi et votre message. Pourquoi : pour répondre à votre demande et, si vous le souhaitez, établir un devis. Base : mesures précontractuelles prises à votre demande (art. 6.1.b RGPD).',
            ]),
            'Contact par téléphone, e-mail' + (has(c, 'whatsapp') ? ' ou WhatsApp' : '') + ' : les données que vous nous communiquez vous-même. Base : votre demande et notre intérêt légitime à répondre aux questions (art. 6.1.b et 6.1.f RGPD).',
            'Exécution des missions et administration : coordonnées, devis et factures. Base : exécution du contrat et nos obligations légales comptables (art. 6.1.b et 6.1.c RGPD).',
            'Sécurité : l’hébergeur traite à chaque visite des données techniques (adresse IP, heure, page demandée) dans des journaux serveur. ' + (c.form ? 'Le formulaire contient un champ invisible contre les robots et limite le nombre de demandes par adresse IP. ' : '') + 'Base : notre intérêt légitime à garder le site sûr (art. 6.1.f RGPD).',
            ...only(c.maps, ['Carte Google Maps : uniquement si vous y consentez. Base : votre consentement (art. 6.1.a RGPD), que vous pouvez retirer à tout moment.']),
            'Nous n’utilisons ni statistiques de visite ni cookies publicitaires.',
          ],
        },
        {
          h: '3. Combien de temps conservons-nous vos données ?',
          list: [
            'Demandes qui n’aboutissent pas à une mission : au maximum 2 ans après notre dernier contact.',
            'Clients : le temps nécessaire à la mission et à une éventuelle garantie, et aussi longtemps que la loi nous oblige à conserver les pièces comptables (10 ans).',
            'Journaux serveur : brièvement, uniquement pour la sécurité.',
          ],
        },
        {
          h: '4. Avec qui partageons-nous vos données ?',
          p: ['Nous ne vendons pas vos données. Nous faisons uniquement appel aux services nécessaires au fonctionnement du site et de nos services (sous-traitants) :'],
          list: [
            ...only(has(c, 'vercel'), ['Vercel : hébergement du site.']),
            ...only(has(c, 'resend'), ['Resend : service d’e-mail qui nous transmet les messages du formulaire.']),
            ...only(has(c, 'telegram'), ['Telegram : messagerie par laquelle nous recevons une notification de nouvelle demande.']),
            ...only(has(c, 'odoo'), ['Odoo : notre gestion de la clientèle, où arrivent les demandes.']),
            ...only(has(c, 'whatsapp'), ['WhatsApp (Meta) : si vous nous contactez via WhatsApp.']),
            ...only(c.maps, ['Google : la carte Google Maps, uniquement avec votre accord.']),
            ...only(has(c, 'accountant'), ['Notre comptable et, lorsque la loi l’exige, les services publics.']),
          ],
        },
        { h: '5. Transferts hors de l’EEE', p: ['Certains de ces services sont établis hors de l’Espace économique européen, p. ex. aux États-Unis. Les transferts se font avec des garanties appropriées, comme les clauses contractuelles types de la Commission européenne ou le EU-US Data Privacy Framework.'] },
        { h: '6. Cookies', p: [`Les cookies et techniques similaires que nous utilisons sont décrits dans notre politique en matière de cookies (${c.cookiesHref}).`] },
        {
          h: '7. Vos droits',
          list: [
            'consulter vos données et en obtenir une copie ;',
            'faire corriger des données inexactes ;',
            'faire effacer vos données ou limiter leur traitement ;',
            'recevoir vos données dans un format courant (portabilité) ;',
            'vous opposer au traitement fondé sur notre intérêt légitime ;',
            'retirer votre consentement à tout moment.',
          ],
          p: [`Envoyez votre demande à ${c.facts.email}. Nous répondons dans un délai d’un mois.`],
        },
        {
          h: '8. Introduire une plainte',
          p: [
            'Vous n’êtes pas satisfait ? Contactez-nous d’abord. Vous pouvez aussi introduire une plainte auprès de ' +
              (be(c) ? 'l’Autorité de protection des données, rue de la Presse 35, 1000 Bruxelles, www.autoriteprotectiondonnees.be.' : 'l’autorité de contrôle de la protection des données de votre pays.'),
          ],
        },
        { h: '9. Modifications', p: ['Nous pouvons adapter cette politique si la loi ou notre façon de travailler change. La date en haut indique la dernière mise à jour.'] },
      ],
    };
  },
  cookies(c) {
    return {
      title: 'Politique en matière de cookies',
      intro: 'Les cookies et techniques similaires sont de petites informations qu’un site enregistre dans votre navigateur. Ce site en utilise le moins possible.',
      blocks: [
        { h: 'Nécessaires (toujours actifs)', list: ['site-consent (stockage local de votre navigateur) : retient votre choix dans l’avis sur les cookies. Ne contient pas de données personnelles et ne nous est pas transmis. Conservé jusqu’à ce que vous l’effaciez ou changiez votre choix.'] },
        ...only(c.maps, [
          { h: 'Médias externes (uniquement avec votre accord)', p: ['La carte Google Maps n’est chargée que si vous le choisissez. Google place alors ses propres cookies et reçoit notamment votre adresse IP. Voir la politique de confidentialité de Google : policies.google.com/privacy.'] },
        ]),
        { h: 'Ni statistiques ni publicité', p: ['Nous n’utilisons ni cookies analytiques ni cookies publicitaires.'] },
        { h: 'Modifier votre choix', p: ['Le lien Paramètres des cookies en bas de chaque page vous permet de modifier ou retirer votre choix à tout moment. Vous pouvez aussi effacer les cookies et le stockage local dans les réglages de votre navigateur.'] },
        { h: 'En savoir plus', p: [`Notre traitement des données personnelles est décrit dans notre politique de confidentialité (${c.privacyHref}). Des questions ? Écrivez à ${c.facts.email}.`] },
      ],
    };
  },
};

const en: typeof nl = {
  privacy(c) {
    return {
      title: 'Privacy policy',
      intro: 'We want you to know what we do with your personal data. Here it is in plain language.',
      blocks: [
        { h: '1. Who is responsible?', p: [controller(c, 'VAT'), 'We are the controller of the data you give us through this website or directly.'] },
        {
          h: '2. What data do we use, why, and on what basis?',
          p: [
            ...only(c.form, [
              'Contact form: name, phone number, e-mail address (if you give it), the service you choose and your message. Why: to answer your request and, if you wish, prepare a quote. Basis: steps taken at your request before entering into a contract (Art. 6(1)(b) GDPR).',
            ]),
            'Contact by phone, e-mail' + (has(c, 'whatsapp') ? ' or WhatsApp' : '') + ': the data you share yourself. Basis: your request and our legitimate interest in answering questions (Art. 6(1)(b) and (f) GDPR).',
            'Carrying out jobs and administration: contact details, quotes and invoices. Basis: performance of the contract and our legal accounting obligations (Art. 6(1)(b) and (c) GDPR).',
            'Security: on every visit the hosting service processes technical data (IP address, time, requested page) in server logs. ' + (c.form ? 'The form has an invisible field against spam bots and limits the number of requests per IP address. ' : '') + 'Basis: our legitimate interest in keeping the website secure (Art. 6(1)(f) GDPR).',
            ...only(c.maps, ['Google Maps map: only if you consent. Basis: your consent (Art. 6(1)(a) GDPR), which you can withdraw at any time.']),
            'We use no visitor statistics and no advertising cookies.',
          ],
        },
        {
          h: '3. How long do we keep your data?',
          list: [
            'Requests that do not lead to a job: at most 2 years after our last contact.',
            'Customers: as long as needed for the job and any warranty, and as long as the law requires us to keep accounting records (10 years).',
            'Server logs: briefly, only as long as needed for security.',
          ],
        },
        {
          h: '4. Who do we share your data with?',
          p: ['We do not sell your data. We only use services needed to run the website and our business (processors):'],
          list: [
            ...only(has(c, 'vercel'), ['Vercel: website hosting.']),
            ...only(has(c, 'resend'), ['Resend: e-mail service that forwards contact form messages to us.']),
            ...only(has(c, 'telegram'), ['Telegram: messaging service through which we are notified of a new request.']),
            ...only(has(c, 'odoo'), ['Odoo: our customer management system, where requests are stored.']),
            ...only(has(c, 'whatsapp'), ['WhatsApp (Meta): if you contact us via WhatsApp.']),
            ...only(c.maps, ['Google: the Google Maps map, only with your consent.']),
            ...only(has(c, 'accountant'), ['Our accountant and, where the law requires it, public authorities.']),
          ],
        },
        { h: '5. Transfers outside the EEA', p: ['Some of these services are based outside the European Economic Area, for example in the United States. Transfers are covered by appropriate safeguards, such as the European Commission’s standard contractual clauses or the EU-US Data Privacy Framework.'] },
        { h: '6. Cookies', p: [`The cookies and similar techniques we use are described in our cookie policy (${c.cookiesHref}).`] },
        {
          h: '7. Your rights',
          list: [
            'access your data and get a copy;',
            'have inaccurate data corrected;',
            'have your data erased or its processing restricted;',
            'receive your data in a common format (portability);',
            'object to processing based on our legitimate interest;',
            'withdraw your consent at any time.',
          ],
          p: [`Send your request to ${c.facts.email}. We reply within one month.`],
        },
        {
          h: '8. Complaints',
          p: [
            'Not satisfied? Please contact us first. You can also lodge a complaint with ' +
              (be(c) ? 'the Belgian Data Protection Authority, Rue de la Presse 35, 1000 Brussels, www.dataprotectionauthority.be.' : 'the data protection supervisory authority in your country.'),
          ],
        },
        { h: '9. Changes', p: ['We may update this policy if the law or the way we work changes. The date at the top shows the last update.'] },
      ],
    };
  },
  cookies(c) {
    return {
      title: 'Cookie policy',
      intro: 'Cookies and similar techniques are small pieces of information a website stores in your browser. This site uses as few as possible.',
      blocks: [
        { h: 'Necessary (always on)', list: ['site-consent (your browser’s local storage): remembers your choice in the cookie notice. Contains no personal data and is not sent to us. Kept until you clear it or change your choice.'] },
        ...only(c.maps, [
          { h: 'External media (only with your consent)', p: ['The Google Maps map only loads if you choose so. Google then sets its own cookies and receives, among other things, your IP address. See Google’s privacy policy: policies.google.com/privacy.'] },
        ]),
        { h: 'No statistics or advertising', p: ['We use no analytics cookies and no advertising cookies.'] },
        { h: 'Changing your choice', p: ['Use the Cookie settings link at the bottom of every page to change or withdraw your choice at any time. You can also clear cookies and local storage in your browser settings.'] },
        { h: 'More information', p: [`How we handle personal data is described in our privacy policy (${c.privacyHref}). Questions? E-mail ${c.facts.email}.`] },
      ],
    };
  },
};

const ru: typeof nl = {
  privacy(c) {
    return {
      title: 'Политика конфиденциальности',
      intro: 'Нам важно, чтобы вы знали, что мы делаем с вашими данными. Ниже — простым языком.',
      blocks: [
        { h: '1. Кто отвечает за данные?', p: [controller(c, 'НДС'), 'Мы — контролёр данных, которые вы передаёте нам через этот сайт или напрямую.'] },
        {
          h: '2. Какие данные, зачем и на каком основании?',
          p: [
            ...only(c.form, [
              'Форма связи: имя, телефон, e-mail (если вы его указали), выбранная услуга и ваше сообщение. Зачем: чтобы ответить на заявку и, если вы хотите, подготовить расчёт. Основание: действия по вашему запросу до заключения договора (ст. 6.1.b GDPR).',
            ]),
            'Связь по телефону, e-mail' + (has(c, 'whatsapp') ? ' или WhatsApp' : '') + ': данные, которые вы сообщаете сами. Основание: ваш запрос и наш законный интерес отвечать на вопросы (ст. 6.1.b и 6.1.f GDPR).',
            'Выполнение заказов и учёт: контакты, расчёты и счета. Основание: исполнение договора и наши обязанности по бухгалтерскому учёту (ст. 6.1.b и 6.1.c GDPR).',
            'Безопасность: хостинг при каждом визите обрабатывает технические данные (IP-адрес, время, запрошенная страница) в журналах сервера. ' + (c.form ? 'В форме есть невидимое поле против спам-ботов и ограничение числа заявок с одного IP-адреса. ' : '') + 'Основание: наш законный интерес в безопасности сайта (ст. 6.1.f GDPR).',
            ...only(c.maps, ['Карта Google Maps: только с вашего согласия. Основание: ваше согласие (ст. 6.1.a GDPR), которое можно отозвать в любой момент.']),
            'Мы не собираем статистику посещений и не используем рекламные cookie.',
          ],
        },
        {
          h: '3. Сколько мы храним данные?',
          list: [
            'Заявки, после которых не было заказа: не дольше 2 лет после последнего контакта.',
            'Клиенты: столько, сколько нужно для заказа и гарантии, и столько, сколько закон требует хранить бухгалтерские документы (10 лет).',
            'Журналы сервера: недолго, только для безопасности.',
          ],
        },
        {
          h: '4. Кому мы передаём данные?',
          p: ['Мы не продаём ваши данные. Мы пользуемся только сервисами, без которых не работают сайт и наши услуги (обработчики):'],
          list: [
            ...only(has(c, 'vercel'), ['Vercel: хостинг сайта.']),
            ...only(has(c, 'resend'), ['Resend: почтовый сервис, который пересылает нам сообщения из формы.']),
            ...only(has(c, 'telegram'), ['Telegram: мессенджер, в который нам приходит уведомление о новой заявке.']),
            ...only(has(c, 'odoo'), ['Odoo: наша система учёта клиентов, куда попадают заявки.']),
            ...only(has(c, 'whatsapp'), ['WhatsApp (Meta): если вы пишете нам в WhatsApp.']),
            ...only(c.maps, ['Google: карта Google Maps, только с вашего согласия.']),
            ...only(has(c, 'accountant'), ['Наш бухгалтер и, если этого требует закон, государственные органы.']),
          ],
        },
        { h: '5. Передача за пределы ЕЭЗ', p: ['Некоторые из этих сервисов находятся за пределами Европейской экономической зоны, например в США. Передача идёт с надлежащими гарантиями — стандартными договорными условиями Европейской комиссии или EU-US Data Privacy Framework.'] },
        { h: '6. Cookie', p: [`Какие cookie и похожие технологии мы используем, описано в нашей политике cookie (${c.cookiesHref}).`] },
        {
          h: '7. Ваши права',
          list: [
            'получить доступ к своим данным и их копию;',
            'исправить неточные данные;',
            'удалить данные или ограничить их обработку;',
            'получить данные в распространённом формате (переносимость);',
            'возразить против обработки на основании нашего законного интереса;',
            'отозвать согласие в любой момент.',
          ],
          p: [`Напишите нам на ${c.facts.email}. Мы ответим в течение месяца.`],
        },
        {
          h: '8. Жалоба',
          p: [
            'Если вы недовольны, сначала свяжитесь с нами. Вы также можете подать жалобу в ' +
              (be(c) ? 'бельгийский орган по защите данных (Gegevensbeschermingsautoriteit / Autorité de protection des données), Drukpersstraat 35, 1000 Brussel.' : 'надзорный орган по защите данных в вашей стране.'),
          ],
        },
        { h: '9. Изменения', p: ['Мы можем менять эту политику, если меняется закон или наш порядок работы. Дата вверху показывает последнее обновление.'] },
      ],
    };
  },
  cookies(c) {
    return {
      title: 'Политика cookie',
      intro: 'Cookie и похожие технологии — небольшие фрагменты информации, которые сайт сохраняет в вашем браузере. Этот сайт использует их как можно меньше.',
      blocks: [
        { h: 'Необходимые (всегда включены)', list: ['site-consent (локальное хранилище браузера): запоминает ваш выбор в уведомлении о cookie. Не содержит персональных данных и не передаётся нам. Хранится, пока вы его не удалите или не измените выбор.'] },
        ...only(c.maps, [
          { h: 'Внешние медиа (только с вашего согласия)', p: ['Карта Google Maps загружается, только если вы это выбрали. Тогда Google ставит свои cookie и получает в том числе ваш IP-адрес. Политика конфиденциальности Google: policies.google.com/privacy.'] },
        ]),
        { h: 'Без статистики и рекламы', p: ['Мы не используем аналитические и рекламные cookie.'] },
        { h: 'Как изменить выбор', p: ['Ссылка «Настройки cookie» внизу каждой страницы позволяет в любой момент изменить или отозвать выбор. Cookie и локальное хранилище также можно удалить в настройках браузера.'] },
        { h: 'Подробнее', p: [`Как мы обращаемся с персональными данными, описано в политике конфиденциальности (${c.privacyHref}). Вопросы — на ${c.facts.email}.`] },
      ],
    };
  },
};

const docs: Record<Lang, typeof nl> = { nl, fr, en, ru };

export function legalDoc(lang: Lang, kind: 'privacy' | 'cookies', ctx: LegalContext): LegalDoc {
  return docs[lang][kind](ctx);
}
