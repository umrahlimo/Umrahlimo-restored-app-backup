/**
 * Static SEO transfer route pages — content from client pack (15 Sep 2026).
 * Prices marked as "From SAR …" — VAT not included; confirm seasonal surcharges before ads.
 */

const BASE = '/transfer'
const SEARCH = (from, to) =>
  `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`

export const TRANSFER_HUB = {
  title: 'Umrah Transfer Routes — Fixed Fares, Door to Door',
  metaDescription:
    'Private Umrah taxi and airport transfers for Jeddah, Makkah, Madinah, and Taif. Fixed fares, licensed drivers, flight tracking, and WhatsApp booking.',
  h1: 'Transfer routes for Umrah & Hajj',
  lead:
    'Static, indexable route pages with fixed fares — not query-string search results. Choose your journey, read the practical details, then book online or on WhatsApp.',
}

/** Client SEO transfer route definitions */
export const TRANSFER_ROUTES = [
  // ─── PAGE 1 ───────────────────────────────────────────────────────────────
  {
    slug: 'jeddah-airport-to-makkah',
    from: 'Jeddah Airport',
    to: 'Makkah Hotel',
    searchHref: SEARCH('Jeddah Airport', 'Makkah Hotel'),
    primaryKeyword: 'jeddah airport to makkah taxi',
    title: 'Jeddah Airport to Makkah Taxi — Fixed Fares, Meet & Greet',
    metaDescription:
      'Private transfer from Jeddah Airport (JED) to your Makkah hotel. Fixed fares, licensed Saudi drivers, Ihram-ready vehicles, 24/7 flight tracking. Book on WhatsApp.',
    h1: 'Jeddah Airport to Makkah — Private Transfer',
    badge: 'JED → Makkah · ~95 km',
    lead:
      'King Abdulaziz International Airport sits roughly 95 kilometres northwest of the Haram. On an ordinary night the drive takes about an hour and fifteen minutes on the Makkah Expressway (Highway 40).',
    featured: true,
    sections: [
      {
        heading: 'The journey in real terms',
        paragraphs: [
          'That 1 hour 15 minutes figure is honest for most of the year — but it is not the figure you should plan around during the last ten nights of Ramadan, or in the days immediately before Hajj, when the same road can take three hours or more. We build that buffer into our scheduling rather than quoting you an optimistic number and leaving you stranded.',
          'The road itself is wide, well-lit, and modern. What catches most first-time pilgrims off guard is not the drive but what happens before it.',
        ],
      },
      {
        heading: 'Arrivals: what actually happens at JED',
        paragraphs: [
          'Most international pilgrims now arrive at Terminal 1, the large terminal opened in 2019. If you are travelling on a dedicated Hajj or Umrah charter, you may instead land at the Hajj Terminal — the distinctive tented structure used seasonally for pilgrim traffic. These are physically separate buildings several kilometres apart, and turning up at the wrong meeting point is the single most common cause of a delayed pickup.',
          'When you book with us, we track your flight number directly. If you are diverted, delayed, or land at a different terminal than your ticket said, your driver is reassigned before you have cleared passport control. You do not need to call us.',
          'Immigration at JED during peak Umrah season can be slow — two hours is not unusual. Our standard included waiting time covers this, and we do not start the clock when your plane lands. We start it when you are actually through.',
        ],
      },
      {
        heading: 'The Miqat question — read this before you fly',
        paragraphs: [
          'This is the part no taxi comparison site will tell you, and it matters more than the fare.',
          'If you are flying into Jeddah with the intention of performing Umrah, you must enter the state of Ihram before crossing your Miqat — and for most flight paths, that boundary is crossed in the air, before you land. Depending on your direction of approach, this is usually Qarn al-Manazil (from the east), Yalamlam (from the south and southeast, including most flights from South and Southeast Asia), or Dhat Irq (from the northeast).',
          'Practically, this means changing into Ihram on the aircraft or at your departure airport, and making your intention when the captain announces the Miqat — most airlines serving Jeddah do announce it.',
          'There is a long-standing scholarly discussion about whether Jeddah itself may serve as a Miqat for those arriving by air. Opinions differ. We are a transport company, not a source of religious rulings — please confirm your own position with your tour operator or a scholar you trust before you travel. We raise it only because pilgrims who assume they can enter Ihram after landing sometimes discover otherwise at the worst moment.',
          'What we can do is make the vehicle side of it easy: our drivers understand that passengers in Ihram cannot use scented products, and our cars are prepared accordingly — no air fresheners, no scented wipes.',
        ],
      },
      {
        heading: 'The Makkah checkpoint',
        paragraphs: [
          'Approximately 20 kilometres before the city, the expressway divides. One carriageway continues into Makkah; the other is the bypass route for non-Muslims, who are not permitted to enter the sacred precinct. There is a checkpoint here where documents may be inspected.',
          'Keep your passport and visa accessible rather than buried in checked luggage. Our drivers hold the appropriate permits and know the procedure, which is generally quick — but it is smoother when your documents are within reach.',
        ],
      },
      {
        heading: 'Choosing your vehicle',
        paragraphs: [
          'Pilgrims almost always underestimate luggage. Families returning from Umrah typically carry more than they arrived with — Zamzam containers alone take significant space, and many airlines require these to be checked separately.',
          'Our general rule: if you are close to the passenger limit, size up. A family of five in a sedan-plus-luggage arrangement is a genuinely uncomfortable ninety minutes, and the price difference is smaller than most people expect.',
        ],
      },
      {
        heading: 'Haramain train — the honest comparison',
        paragraphs: [
          'There is a high-speed rail station at Jeddah Airport, and the Haramain train reaches Makkah in about half an hour. It is fast and it is comfortable, and for some travellers it is the better choice. We would rather tell you that than pretend otherwise.',
          "Where a private transfer wins is on the ends of the journey. The train takes you to Makkah's Rusaifah station, which is still a taxi ride from most hotels — with your luggage, at whatever hour you have landed, possibly in Ihram. Trains also run to a fixed timetable that may not align with a delayed 3am arrival, and seats sell out during peak season.",
          'If you are travelling light, arriving at a civilised hour, and your hotel is near the station, take the train. If you are with family, arriving late, or carrying a season\'s worth of luggage, door-to-door is worth the difference.',
        ],
      },
    ],
    vehicles: [
      { name: 'Sedan', passengers: '3', luggage: '2–3 large cases', suited: 'Couples, solo travellers, light packers' },
      { name: 'GMC Yukon', passengers: '5', luggage: '5 large cases', suited: 'Small families wanting comfort on the expressway' },
      { name: 'Hyundai Staria', passengers: '7', luggage: '6–7 cases', suited: 'Families travelling together' },
      { name: 'Toyota HiAce', passengers: '10', luggage: '10 cases', suited: 'Extended family groups' },
      { name: 'Coaster', passengers: '22', luggage: 'Group luggage', suited: 'Small tour groups' },
      { name: 'Coach', passengers: '50+', luggage: 'Full hold', suited: 'Full group departures' },
    ],
    fares: {
      note: 'Fixed fares in Saudi Riyals, no meter. VAT not included. Contact for Ramadan and Hajj special prices. Subject to change without notice.',
      columns: ['Jeddah Airport → Makkah Hotel'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 210'] },
        { vehicle: 'GMC Yukon (5 pax)', prices: ['From SAR 350'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 275'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 325'] },
        { vehicle: 'Coaster (22 pax)', prices: ['From SAR 550'] },
        { vehicle: 'Coach (50+ pax)', prices: ['Contact'] },
      ],
    },
    faqs: [
      {
        question: 'How long does the Jeddah Airport to Makkah transfer take?',
        answer:
          'Around 1 hour 15 minutes in normal conditions. Allow longer during Ramadan and the Hajj period, when journey times can double.',
      },
      {
        question: 'How far is Jeddah Airport from Makkah?',
        answer: 'Approximately 95 kilometres via the Makkah Expressway.',
      },
      {
        question: 'Will the driver wait if my flight is delayed?',
        answer:
          'Yes. We track your flight number and adjust the pickup automatically. Free waiting time covers typical immigration delays.',
      },
      {
        question: 'Can I book a car if I am in Ihram?',
        answer: 'Yes. Our vehicles are prepared without scented products for passengers in Ihram.',
      },
      {
        question: 'Do you meet passengers at the Hajj Terminal?',
        answer:
          'Yes. Confirm your terminal when booking, and we will adjust if your arrival terminal changes.',
      },
      {
        question: 'Is the fare per person or per vehicle?',
        answer:
          'Per vehicle. The quoted price covers the whole car regardless of how many seats are occupied.',
      },
      {
        question: 'Do you accept bookings for early morning arrivals?',
        answer: 'Yes, we operate 24 hours a day.',
      },
    ],
    related: [
      { label: 'Makkah to Madinah', href: `${BASE}/makkah-to-madinah` },
      { label: 'Jeddah Airport guide', href: '/airport-guides/jed' },
      { label: 'Makkah to Jeddah Airport (return)', href: `${BASE}/makkah-to-jeddah-airport` },
      { label: 'Jeddah Airport to Madinah', href: `${BASE}/jeddah-airport-to-madinah` },
    ],
  },

  // ─── PAGE 2 ───────────────────────────────────────────────────────────────
  {
    slug: 'makkah-to-madinah',
    from: 'Makkah Hotel',
    to: 'Madinah Hotel',
    searchHref: SEARCH('Makkah Hotel', 'Madinah Hotel'),
    primaryKeyword: 'makkah to madinah taxi',
    title: 'Makkah to Madinah Taxi — Direct or Via Badr',
    metaDescription:
      'Private car from Makkah to Madinah. Choose the direct Hijrah highway or the historic Badr route. Fixed fares, prayer stops, licensed drivers.',
    h1: 'Makkah to Madinah — Private Transfer',
    badge: 'Makkah → Madinah · ~450 km',
    lead:
      'Most transfer companies quote you a single price for Makkah to Madinah. There are actually two quite different journeys, and choosing between them is the most consequential decision you will make about this leg of your trip.',
    featured: true,
    sections: [
      {
        heading: 'Two roads, not one',
        paragraphs: [
          'The direct route follows Highway 15 north — roughly 450 kilometres, four and a half to five hours with a stop. It is the fast option, and if you are tired, travelling with young children, or have a fixed hotel check-in, it is the sensible one.',
          'The Badr route runs west toward the coast before turning north, adding roughly an hour and a half to two hours. It exists because of what sits along it.',
        ],
      },
      {
        heading: 'Why pilgrims choose Badr',
        paragraphs: [
          'Badr is where the Battle of Badr was fought in the second year after the Hijrah — the first major engagement of the Muslim community, and one referenced directly in the Qur\'an. The site today includes the martyrs\' cemetery and the surrounding plain, and for many pilgrims standing there is among the most affecting hours of the entire journey.',
          'It is not a detour that photographs well. It is quiet, and mostly what is there is landscape and a burial ground. But pilgrims who make the stop rarely regret it, and those who skip it often say they wish they had known it was an option.',
          'The road also passes near other sites of the Hijrah route, and drivers who know the area can point them out as you go. Not all drivers can. If this matters to you, say so when booking and we will assign accordingly.',
        ],
      },
      {
        heading: 'The Miqat for your return',
        paragraphs: [
          'If you are travelling Makkah → Madinah and intend to perform Umrah again afterwards, your Miqat on the return journey will be Dhul Hulayfah, also known as Abyar Ali — about nine kilometres southwest of Madinah, on the road back toward Makkah. There is a large mosque there with facilities for changing into Ihram.',
          'This catches people out in both directions. Note it now.',
        ],
      },
      {
        heading: 'What the drive is actually like',
        paragraphs: [
          'Highway 15 is a good road — dual carriageway, well surfaced, with service stations at reasonable intervals. It is also long, largely featureless desert, and it gets hot. Sunset over that landscape is genuinely beautiful; midday in July is simply endurance.',
          'We build in a stop for prayer and refreshment as standard, timed around the prayer that falls during your journey. If you would prefer to push through, tell the driver. If you would prefer two stops, that is also fine — this is your vehicle for the duration, not a shared shuttle running to someone else\'s schedule.',
          'Vehicles are stocked with water bottles. Badr waiting time included: 1 hour.',
        ],
      },
      {
        heading: 'Train or car?',
        paragraphs: [
          'The Haramain train covers Makkah to Madinah in roughly two and a half hours — considerably faster than any road option. For a straightforward A-to-B journey with light luggage, it is hard to argue against.',
          'But the train cannot stop at Badr. It cannot detour to Dhul Hulayfah. It runs between two stations that are both some distance from the hotel districts, and during peak season it books out weeks ahead. A private car is slower and, for one or two people, more expensive — what it buys you is the ability to shape the day.',
          'For groups of four or more, the economics usually tip the other way as well.',
        ],
      },
    ],
    fares: {
      note: 'Fares without VAT. Subject to change without notice. Badr waiting time: 1 hour.',
      columns: ['Direct route', 'Via Badr'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 335', 'From SAR 400'] },
        { vehicle: 'GMC Yukon (5 pax)', prices: ['From SAR 750', 'From SAR 900'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 450', 'From SAR 550'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 550', 'From SAR 650'] },
        { vehicle: 'Coaster (22 pax)', prices: ['From SAR 800', 'From SAR 1000'] },
        { vehicle: 'Coach (50+ pax)', prices: ['Contact', 'Contact'] },
      ],
    },
    faqs: [
      {
        question: 'How long does Makkah to Madinah take by car?',
        answer:
          'About 4.5 to 5 hours direct, or 6 to 7 hours via Badr including a stop at the site.',
      },
      {
        question: 'How far is Makkah from Madinah?',
        answer: 'Approximately 450 kilometres by the direct route.',
      },
      {
        question: 'Can we stop at Badr on the way?',
        answer:
          'Yes. Select the Badr route when booking — it adds roughly 1.5 to 2 hours plus your time at the site. One hour waiting at Badr is included.',
      },
      {
        question: 'Where is the Miqat when returning from Madinah to Makkah?',
        answer: 'Dhul Hulayfah (Abyar Ali), about 9 kilometres from Madinah on the Makkah road.',
      },
      {
        question: 'Do you stop for prayer?',
        answer:
          'Yes, a prayer and refreshment stop is standard, timed to the prayer falling during your journey.',
      },
      {
        question: 'Is it cheaper than the train?',
        answer:
          'For one or two passengers the train is usually cheaper. For groups of four or more, a private vehicle is often comparable or better, and includes door-to-door service.',
      },
    ],
    related: [
      { label: 'Jeddah Airport to Makkah', href: `${BASE}/jeddah-airport-to-makkah` },
      { label: 'Madinah to Makkah (return)', href: `${BASE}/madinah-to-makkah` },
      { label: 'Madinah Airport guide', href: '/airport-guides/med' },
    ],
  },

  // ─── PAGE 3 ───────────────────────────────────────────────────────────────
  {
    slug: 'jeddah-airport-to-madinah',
    from: 'Jeddah Airport',
    to: 'Madinah Hotel',
    searchHref: SEARCH('Jeddah Airport', 'Madinah Hotel'),
    primaryKeyword: 'jeddah airport to madinah taxi',
    title: 'Jeddah Airport to Madinah Taxi — Direct Transfer',
    metaDescription:
      'Private transfer from Jeddah Airport (JED) to Madinah. 4–5 hour direct journey, flight tracking, prayer stops, fixed fares. WhatsApp booking.',
    h1: 'Jeddah Airport to Madinah — Private Transfer',
    badge: 'JED → Madinah · ~420 km',
    lead:
      'This is the leg pilgrims most often underestimate. Jeddah Airport to Madinah is approximately 420 kilometres — four to five hours of driving, on top of whatever flight you have just stepped off.',
    featured: true,
    sections: [
      {
        heading: 'A long drive after a long flight',
        paragraphs: [
          'Many Umrah itineraries begin in Madinah rather than Makkah, and for good reason: it allows you to visit the Prophet\'s Mosque ﷺ before performing Umrah, and to enter Ihram at Dhul Hulayfah on the way south. If that is your plan, this is your first journey in Saudi Arabia, and it happens while you are at your most tired.',
          'We mention this because the vehicle choice matters more here than on the short Makkah run. Ninety minutes in a cramped car is tolerable. Five hours is not.',
        ],
      },
      {
        heading: 'Flight tracking and terminals',
        paragraphs: [
          'As with all our JED pickups, we track your flight directly. Most international arrivals use Terminal 1; seasonal pilgrim charters may use the Hajj Terminal. Confirm your terminal at booking if you know it — and if it changes, we will adjust without you needing to contact us.',
          'Given the length of this transfer, we recommend confirming your booking the day before travel so the driver can plan rest appropriately.',
        ],
      },
      {
        heading: 'The route',
        paragraphs: [
          'The road north runs broadly parallel to the Red Sea coast before turning inland toward Madinah. It passes through open desert and some genuinely striking volcanic terrain — the harrat, black basalt fields, are unlike anything most visitors have seen.',
          'There are service stations along the way, and we stop at least once for prayer and refreshment. On a journey this length we would generally suggest two stops, and the driver will offer.',
        ],
      },
      {
        heading: 'Arriving in Madinah',
        paragraphs: [
          'Unlike Makkah, there is no non-Muslim checkpoint on the Madinah approach for the city generally, though the central Haram area is restricted. Most pilgrim hotels sit within walking distance of the Prophet\'s Mosque ﷺ, in the districts immediately surrounding it.',
          'Traffic in the central area is heavily managed, particularly around prayer times, and some streets close to vehicles. Our drivers will take you as close to your hotel entrance as vehicle access permits — which, during a busy Maghrib, may be a short walk. Give your driver the hotel name and district rather than only a map pin; local knowledge beats GPS in that part of the city.',
        ],
      },
      {
        heading: 'Should you fly to Madinah instead?',
        paragraphs: [
          'Worth saying plainly: Madinah has its own international airport (MED), roughly 15 kilometres from the Prophet\'s Mosque ﷺ — a 20 to 25 minute transfer. If your routing allows you to fly directly into MED, you avoid this drive entirely.',
          'Many pilgrims do not have that option, either because of carrier availability or because their visa routing brings them through Jeddah. If you are still booking flights, it is worth checking.',
          'The Haramain train is also an option, running from Jeddah Airport station to Madinah in around two hours. Same trade-offs as elsewhere: faster and cheaper for light travellers, less flexible for families with luggage and unpredictable arrival times.',
        ],
      },
    ],
    fares: {
      note: 'VAT not included. Subject to change without notice.',
      columns: ['Jeddah Airport → Madinah Hotel'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 375'] },
        { vehicle: 'GMC Yukon (5 pax)', prices: ['From SAR 800'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 475'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 550'] },
        { vehicle: 'Coaster (22 pax)', prices: ['From SAR 850'] },
        { vehicle: 'Coach (50+ pax)', prices: ['Contact'] },
      ],
    },
    faqs: [
      {
        question: 'How long is the drive from Jeddah Airport to Madinah?',
        answer: 'Approximately 4 to 5 hours, covering around 420 kilometres.',
      },
      {
        question: 'Is there a direct transfer, or do I change vehicles?',
        answer: 'Direct. The same vehicle and driver take you door to door.',
      },
      {
        question: 'Do you stop on the way?',
        answer: 'Yes — at least one prayer and refreshment stop, usually two on this route.',
      },
      {
        question: 'Can I stop at Dhul Hulayfah (Abyar Ali)?',
        answer:
          'That Miqat sits on the Madinah–Makkah road, so it is relevant to your onward journey to Makkah rather than this one. It can be added as a stop on request for the reverse Madinah–Makkah leg.',
      },
      {
        question: 'What if my flight arrives at 2am?',
        answer: 'We operate 24 hours and track your flight.',
      },
      {
        question: 'Would flying into Madinah be easier?',
        answer:
          'If your routing allows it, yes — Madinah\'s own airport is only 20 minutes from the Haram. We also cover MED transfers.',
      },
    ],
    related: [
      { label: 'Madinah Airport guide', href: '/airport-guides/med' },
      { label: 'Madinah to Makkah', href: `${BASE}/madinah-to-makkah` },
      { label: 'Madinah to Jeddah Airport (return)', href: `${BASE}/madinah-to-jeddah-airport` },
      { label: 'Madinah Airport to hotel', href: `${BASE}/madinah-airport-to-madinah` },
    ],
  },

  // ─── Remaining pages (unique briefs) ──────────────────────────────────────
  {
    slug: 'madinah-airport-to-madinah',
    from: 'Madinah Airport',
    to: 'Madinah Hotel',
    searchHref: SEARCH('Madinah Airport', 'Madinah Hotel'),
    primaryKeyword: 'madinah airport to hotel taxi',
    title: 'Madinah Airport to Hotel Taxi — 20 Minute Transfer',
    metaDescription:
      'Private transfer from Madinah Airport (MED) to your hotel near the Prophet\'s Mosque. Short 20–25 minute hop, fixed fares, prayer-time access tips.',
    h1: 'Madinah Airport to Madinah Hotel — Private Transfer',
    badge: 'MED → Hotel · ~15 km',
    lead:
      'Prince Mohammad bin Abdulaziz International Airport sits roughly 15 kilometres from the Prophet\'s Mosque ﷺ — usually a 20 to 25 minute transfer when traffic is calm.',
    featured: true,
    sections: [
      {
        heading: 'A short hop that still needs planning',
        paragraphs: [
          'Compared with Jeddah Airport to Makkah, this is a brief ride — but Madinah\'s central hotel zone is tightly managed around prayer times. Some streets close to vehicles, and drop-off points shift during busy Maghrib and Isha.',
          'Give your driver the hotel name and district, not only a map pin. Local knowledge beats GPS when vehicle access is restricted near the Haram.',
        ],
      },
      {
        heading: 'MED terminal layout',
        paragraphs: [
          'MED is compact compared with Jeddah. International and domestic flows are straightforward, but peak Umrah and Hajj seasons still create queues at immigration and baggage.',
          'We track your flight and meet you after arrivals. If your hotel is within walking distance of the Prophet\'s Mosque, we will take you as close to the entrance as access permits.',
        ],
      },
    ],
    fares: {
      note: 'Fixed fares. VAT not included. Subject to change without notice.',
      columns: ['Madinah Airport → Madinah Hotel'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 90'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 140'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 180'] },
        { vehicle: 'Coaster (22 pax)', prices: ['Contact'] },
      ],
    },
    faqs: [
      {
        question: 'How long is Madinah Airport to the hotel?',
        answer: 'About 20 to 25 minutes covering roughly 15 kilometres, longer around prayer times.',
      },
      {
        question: 'Can the driver stop at the hotel entrance?',
        answer:
          'As close as vehicle access allows. During busy prayers some streets close — you may walk a short distance.',
      },
      {
        question: 'Do you operate overnight?',
        answer: 'Yes. MED arrivals run 24 hours with flight tracking.',
      },
    ],
    related: [
      { label: 'Madinah Airport guide', href: '/airport-guides/med' },
      { label: 'Madinah to Makkah', href: `${BASE}/madinah-to-makkah` },
      { label: 'Jeddah Airport to Madinah', href: `${BASE}/jeddah-airport-to-madinah` },
    ],
  },

  {
    slug: 'makkah-to-jeddah-airport',
    from: 'Makkah Hotel',
    to: 'Jeddah Airport',
    searchHref: SEARCH('Makkah Hotel', 'Jeddah Airport'),
    primaryKeyword: 'makkah to jeddah airport taxi',
    title: 'Makkah to Jeddah Airport Taxi — Departure Transfer',
    metaDescription:
      'Private transfer from your Makkah hotel to Jeddah Airport (JED). Departure timing advice, Zamzam luggage tips, checkpoint notes, fixed fares.',
    h1: 'Makkah to Jeddah Airport — Private Transfer',
    badge: 'Makkah → JED · ~95 km',
    lead:
      'The return run to Jeddah Airport is the same 95-kilometre expressway as arrival — but departure timing, Zamzam luggage, and the exit checkpoint change how you should plan the day.',
    featured: true,
    sections: [
      {
        heading: 'How early should you leave?',
        paragraphs: [
          'For international flights we generally recommend leaving Makkah 4 to 5 hours before departure in normal conditions, and longer during Ramadan nights or the Hajj period when the expressway can double in time.',
          'Add buffer if you are checking Zamzam water — many airlines require it as checked baggage with specific packing rules, which slows the check-in queue.',
        ],
      },
      {
        heading: 'Zamzam and luggage',
        paragraphs: [
          'Families almost always leave with more luggage than they arrived with. Size up the vehicle if you are near passenger capacity — a cramped sedan with Zamzam containers is a stressful start to a long flight.',
        ],
      },
      {
        heading: 'The checkpoint on exit',
        paragraphs: [
          'The Makkah checkpoint still applies on the way out. Keep passports and boarding passes accessible. Our drivers hold the correct permits and know the procedure.',
        ],
      },
    ],
    fares: {
      note: 'Same base corridor as Jeddah Airport → Makkah. VAT not included. Contact for peak-season pricing.',
      columns: ['Makkah Hotel → Jeddah Airport'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 210'] },
        { vehicle: 'GMC Yukon (5 pax)', prices: ['From SAR 350'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 275'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 325'] },
        { vehicle: 'Coaster (22 pax)', prices: ['From SAR 550'] },
      ],
    },
    faqs: [
      {
        question: 'How long before my flight should I leave Makkah?',
        answer:
          'Plan 4–5 hours before international departure in normal conditions; allow more in Ramadan and Hajj periods.',
      },
      {
        question: 'Can you handle Zamzam containers?',
        answer:
          'Yes — book a vehicle with realistic luggage capacity. Confirm airline packing rules before you travel.',
      },
    ],
    related: [
      { label: 'Jeddah Airport to Makkah (arrival)', href: `${BASE}/jeddah-airport-to-makkah` },
      { label: 'Jeddah Airport guide', href: '/airport-guides/jed' },
    ],
  },

  {
    slug: 'madinah-to-makkah',
    from: 'Madinah Hotel',
    to: 'Makkah Hotel',
    searchHref: SEARCH('Madinah Hotel', 'Makkah Hotel'),
    primaryKeyword: 'madinah to makkah taxi',
    title: 'Madinah to Makkah Taxi — Via Dhul Hulayfah Miqat',
    metaDescription:
      'Private transfer from Madinah to Makkah with Dhul Hulayfah (Abyar Ali) Miqat stop. Ihram facilities, prayer stops, fixed fares.',
    h1: 'Madinah to Makkah — Private Transfer',
    badge: 'Madinah → Makkah · ~450 km',
    lead:
      'The southbound journey from Madinah to Makkah is where most pilgrims enter Ihram at Dhul Hulayfah (Abyar Ali) — about nine kilometres from Madinah on the Makkah road.',
    featured: true,
    sections: [
      {
        heading: 'Dhul Hulayfah as the centrepiece',
        paragraphs: [
          'Abyar Ali mosque has facilities for changing into Ihram, making wudu, and praying before you continue. Tell us at booking if you want a Miqat stop — it is the single most important planning detail on this route.',
          'Drivers familiar with pilgrim traffic time the stop so you are not rushed, then continue the remaining hours to Makkah with a prayer and refreshment break as standard.',
        ],
      },
      {
        heading: 'The road south',
        paragraphs: [
          'Expect roughly 4.5 to 5 hours direct, longer with an extended Miqat stop. Highway 15 is dual carriageway with service stations; midday heat in summer is significant — water is stocked in the vehicle.',
        ],
      },
    ],
    fares: {
      note: 'Comparable to Makkah → Madinah direct fares. VAT not included. Subject to change without notice.',
      columns: ['Madinah Hotel → Makkah Hotel'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 335'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 450'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 550'] },
        { vehicle: 'Coaster (22 pax)', prices: ['From SAR 800'] },
      ],
    },
    faqs: [
      {
        question: 'Can we stop at Dhul Hulayfah for Ihram?',
        answer:
          'Yes. Request the Miqat stop when booking. Facilities at Abyar Ali mosque support changing and prayer.',
      },
      {
        question: 'How long does Madinah to Makkah take?',
        answer: 'About 4.5 to 5 hours direct, plus time at Dhul Hulayfah if you stop for Ihram.',
      },
    ],
    related: [
      { label: 'Makkah to Madinah', href: `${BASE}/makkah-to-madinah` },
      { label: 'Madinah ziyarat tour', href: `${BASE}/madinah-ziyarat-tour` },
    ],
  },

  {
    slug: 'makkah-to-taif',
    from: 'Makkah Hotel',
    to: 'Taif',
    searchHref: SEARCH('Makkah Hotel', 'Taif'),
    primaryKeyword: 'makkah to taif taxi',
    title: 'Makkah to Taif Taxi — Al-Hada Road & Mazarats',
    metaDescription:
      'Private transfer from Makkah to Taif via the Al-Hada mountain road. Qarn al-Manazil Miqat, cooler climate, mazarat day trips, fixed fares.',
    h1: 'Makkah to Taif — Private Transfer',
    badge: 'Makkah → Taif · mountain road',
    lead:
      'Taif sits in the highlands east of Makkah — cooler air, switchback mountain roads, and the Qarn al-Manazil (As-Sail) Miqat on related approaches.',
    featured: false,
    sections: [
      {
        heading: 'Al-Hada mountain road',
        paragraphs: [
          'The Al-Hada escarpment is scenic and winding. Motion-sensitive travellers should say so when booking — we can pace the drive and schedule stops. Journey time is typically around two hours depending on traffic and stops for mazarats.',
        ],
      },
      {
        heading: 'Mazarats and climate',
        paragraphs: [
          'Many pilgrims combine Taif with visits to historical sites and a break from Makkah heat. Confirm whether you need a one-way drop, a same-day return, or a multi-stop mazarat itinerary.',
        ],
      },
    ],
    fares: {
      note: 'VAT not included. Day-return and mazarat packages available on request.',
      columns: ['Makkah → Taif'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 280'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 380'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 450'] },
        { vehicle: 'Coaster (22 pax)', prices: ['Contact'] },
      ],
    },
    faqs: [
      {
        question: 'How long is Makkah to Taif?',
        answer: 'Around two hours via the mountain road, longer with mazarat stops.',
      },
      {
        question: 'Is the road suitable if I get carsick?',
        answer:
          'The Al-Hada switchbacks can be demanding. Tell us when booking so the driver can pace the journey.',
      },
    ],
    related: [
      { label: 'Makkah ziyarat tour', href: `${BASE}/makkah-ziyarat-tour` },
      { label: 'Jeddah Airport to Makkah', href: `${BASE}/jeddah-airport-to-makkah` },
    ],
  },

  {
    slug: 'madinah-to-jeddah-airport',
    from: 'Madinah Hotel',
    to: 'Jeddah Airport',
    searchHref: SEARCH('Madinah Hotel', 'Jeddah Airport'),
    primaryKeyword: 'madinah to jeddah airport taxi',
    title: 'Madinah to Jeddah Airport Taxi — Direct Departure',
    metaDescription:
      'Private transfer from Madinah hotel to Jeddah Airport (JED). Plan a 5-hour buffer for the ~420 km drive. Fixed fares, prayer stops, 24/7.',
    h1: 'Madinah to Jeddah Airport — Private Transfer',
    badge: 'Madinah → JED · ~420 km',
    lead:
      'This is the reverse of Jeddah Airport to Madinah — roughly 420 kilometres and four to five hours. Departure buffer for a long drive matters more than anything else.',
    featured: false,
    sections: [
      {
        heading: 'Departure buffer for a 5-hour drive',
        paragraphs: [
          'For international flights out of JED, leave Madinah with a generous buffer — typically 7–8 hours before departure in normal conditions, more in peak season. Factor prayer stops and possible highway delays.',
          'Confirm terminal (Terminal 1 vs Hajj Terminal) when you book so the drop-off is correct.',
        ],
      },
    ],
    fares: {
      note: 'Comparable to Jeddah Airport → Madinah. VAT not included.',
      columns: ['Madinah Hotel → Jeddah Airport'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['From SAR 375'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['From SAR 475'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['From SAR 550'] },
        { vehicle: 'Coaster (22 pax)', prices: ['From SAR 850'] },
      ],
    },
    faqs: [
      {
        question: 'How early should I leave Madinah for a JED flight?',
        answer:
          'Plan at least 7–8 hours before international departure in normal conditions; allow more during Ramadan and Hajj.',
      },
    ],
    related: [
      { label: 'Jeddah Airport to Madinah', href: `${BASE}/jeddah-airport-to-madinah` },
      { label: 'Madinah Airport to hotel', href: `${BASE}/madinah-airport-to-madinah` },
    ],
  },

  {
    slug: 'makkah-ziyarat-tour',
    from: 'Makkah Hotel',
    to: 'Makkah Ziyarat',
    searchHref: SEARCH('Makkah Hotel', 'Makkah Mazarats'),
    primaryKeyword: 'makkah ziyarat tour car',
    title: 'Makkah Ziyarat Tour Car — Half-Day Private Hire',
    metaDescription:
      'Private half-day Makkah ziyarat tour: Jabal al-Nour, Jabal Thawr, Mina, Arafat, Muzdalifah. Hourly or fixed package with licensed driver.',
    h1: 'Makkah Ziyarat Tour — Private Car',
    badge: 'Half-day · Makkah sites',
    lead:
      'This is half-day hire rather than a single point-to-point transfer — a private vehicle and driver for the major Makkah ziyarat sites.',
    featured: false,
    sections: [
      {
        heading: 'Typical stops',
        paragraphs: [
          'Common itineraries include Jabal al-Nour (Cave of Hira), Jabal Thawr, Mina, Arafat, and Muzdalifah. Exact order depends on traffic, prayer times, and how long your group wants at each site.',
        ],
      },
      {
        heading: 'Hourly vs fixed',
        paragraphs: [
          'Choose a fixed half-day package if you want a clear price, or hourly hire if your group prefers a flexible pace. Coaster and van options suit extended families and small tour groups.',
        ],
      },
    ],
    fares: {
      note: 'Packages vary by duration and vehicle. Contact for custom itineraries. VAT not included.',
      columns: ['Half-day package (from)'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['Contact'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['Contact'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['Contact'] },
        { vehicle: 'Coaster (22 pax)', prices: ['Contact'] },
      ],
    },
    faqs: [
      {
        question: 'How long is a typical Makkah ziyarat tour?',
        answer: 'Most private half-day tours run 4–6 hours depending on stops and pace.',
      },
      {
        question: 'Is a guide included?',
        answer:
          'Drivers know the routes and can point out sites. For a dedicated religious guide, request one when booking.',
      },
    ],
    related: [
      { label: 'Madinah ziyarat tour', href: `${BASE}/madinah-ziyarat-tour` },
      { label: 'Makkah to Taif', href: `${BASE}/makkah-to-taif` },
    ],
  },

  {
    slug: 'madinah-ziyarat-tour',
    from: 'Madinah Hotel',
    to: 'Madinah Ziyarat',
    searchHref: SEARCH('Madinah Hotel', 'Madinah Mazarats'),
    primaryKeyword: 'madinah ziyarat tour car',
    title: 'Madinah Ziyarat Tour Car — Quba, Uhud & More',
    metaDescription:
      'Private Madinah ziyarat tour: Quba Mosque, Qiblatain, Uhud, Seven Mosques. Typical half-day duration with licensed driver.',
    h1: 'Madinah Ziyarat Tour — Private Car',
    badge: 'Half-day · Madinah sites',
    lead:
      'A private vehicle for Madinah\'s major ziyarat sites — Quba Mosque, Masjid al-Qiblatain, Uhud, and the Seven Mosques — at a pace that suits your family.',
    featured: false,
    sections: [
      {
        heading: 'Typical duration and stops',
        paragraphs: [
          'Most groups complete a focused Madinah ziyarat in half a day. Traffic near the Haram and prayer times affect timing; we schedule around your preferred prayer windows.',
        ],
      },
    ],
    fares: {
      note: 'Packages by vehicle size and duration. VAT not included.',
      columns: ['Half-day package (from)'],
      rows: [
        { vehicle: 'Sedan (3 pax)', prices: ['Contact'] },
        { vehicle: 'Staria Van (7 pax)', prices: ['Contact'] },
        { vehicle: 'HiAce Van (10 pax)', prices: ['Contact'] },
      ],
    },
    faqs: [
      {
        question: 'Which sites are usually included?',
        answer:
          'Quba Mosque, Masjid al-Qiblatain, Mount Uhud, and the Seven Mosques are the most common. Custom stops available on request.',
      },
    ],
    related: [
      { label: 'Makkah ziyarat tour', href: `${BASE}/makkah-ziyarat-tour` },
      { label: 'Madinah to Makkah', href: `${BASE}/madinah-to-makkah` },
    ],
  },
]

export const TRANSFER_ROUTE_SLUGS = TRANSFER_ROUTES.map((r) => ({ slug: r.slug }))

export const TRANSFER_ROUTE_LOOKUP = TRANSFER_ROUTES.reduce((acc, route) => {
  acc[route.slug] = route
  return acc
}, {})

export function getTransferRouteBySlug(slug) {
  return TRANSFER_ROUTE_LOOKUP[slug] || null
}

export function getFeaturedTransferRoutes() {
  return TRANSFER_ROUTES.filter((r) => r.featured)
}
