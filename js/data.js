/* =====================================================================
   SAHRA — CONTENT FILE.  Everything you will want to edit lives here
   (and the hotel list in js/hotels.js, photos/videos in js/media.js).
   ===================================================================== */
(function () {
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* ---- Price ranges. Replace `from` with real nightly rates when you have them,
          e.g. from: 'from 900 EGP'. Leave '' to show "Rates on request". ---- */
  const TIERS = {
    budget:  { id: 'budget',  name: 'Essential',   sub: 'Camps & friendly stays',      sym: 1, hue: ['#E6C48E', '#B96545'], from: '', blurb: 'Relaxed, social and easy on the wallet. Beach camps, hostel-style stays and simple clean rooms near the lagoon and the lighthouse.' },
    comfort: { id: 'comfort', name: 'Comfort',     sub: 'Middle-range hotels',          sym: 2, hue: ['#7FD3CF', '#176B78'], from: '', blurb: 'The sweet spot. Proper hotels with comfortable rooms, good locations and the little extras that make a week feel easy.' },
    premium: { id: 'premium', name: 'Premium',     sub: 'Resorts & boutique',           sym: 3, hue: ['#A5B6FF', '#2B4C7E'], from: '', blurb: 'Resort feel: pools, sea access, bigger rooms and more to do without leaving the property.' },
    luxury:  { id: 'luxury',  name: 'Luxury & VIP', sub: 'Business, VIP & spa',         sym: 4, hue: ['#FFE2A0', '#C98A3A'], from: '', blurb: 'The top of the coast. Large resorts, spa, private service and the full five-star experience.' }
  };

  const BRAND = {
    name: 'Sahra',
    tagline: 'Sinai, from the desert to the Red Sea',
    whatsapp: '201000000000',                // <- put your WhatsApp number here (international format, no +)
    email: 'saahraaaaaaaaa@gmail.com',
    logo: 'assets/logo-emblem.png'           // round emblem used in the menu and footer (full logo: assets/logo-full.jpg)
  };

  const KIND_LABEL = { Hotel: 'Hotel', Resort: 'Resort', Camp: 'Camp' };

  /* ---- Hotels & camps (from js/hotels.js) + media (from js/media.js) ---- */
  const stays = (window.SAHRA_HOTELS || []).map((h, i) => {
    const m = (window.SAHRA_MEDIA || {})[h.id] || { pics: [], vids: [] };
    const order = ['Exterior', 'Rooms', 'Bathrooms'];
    const pics = m.pics.slice().sort((a, b) => (order.indexOf(a.cat) + 1 || 99) - (order.indexOf(b.cat) + 1 || 99));
    return Object.assign({
      section: 'stay', location: 'Dahab, South Sinai', price: TIERS[h.tier].from || 'Rates on request',
      pics, vids: m.vids, cover: pics[0] ? pics[0].thumb : '', coverBig: pics[0] ? pics[0].src : '',
      short: `${KIND_LABEL[h.kind] || h.kind} · ${TIERS[h.tier].name}`,
      long: h.kind === 'Camp'
        ? `${h.name} is one of the camps on our Dahab list. Open the links below to see photos, reels and the booking page, then tell us your dates and group size — we confirm availability and the best rate, and arrange your transfer.`
        : `${h.name} is on our Dahab ${TIERS[h.tier].name.toLowerCase()} list. Open the links below to see photos, reels and the booking page, then tell us your dates and group size — we confirm rooms, rates and your transfer.`,
      idx: i
    }, h);
  });

  /* ---- Operation (transport) ---- */
  const operation = [
    { name: 'Hiace', scene: 'road', short: 'Private van', long: 'Comfortable private Hiace vans for families and small groups, with a driver who knows every road in Sinai.', duration: 'Door to door', group: '2 – 12 guests' },
    { name: 'Bus', scene: 'road', short: 'Group coach', long: 'Air-conditioned coaches for larger groups, schools and events.', duration: 'Door to door', group: '15 – 50 guests' },
    { name: 'Airplane', scene: 'sky', short: 'Flights', long: 'Flights to Sharm El Sheikh with a transfer waiting at arrivals.', duration: 'Flight + transfer', group: '1 – 100 guests' }
  ].map(o => Object.assign({ section: 'ops', kind: 'Operation', id: slug(o.name), price: 'On request', pics: [], vids: [] }, o));

  /* ---- Travel's activities (names as in your list — fix any spelling here) ---- */
  const A = [
    ['Lagoona', 'sea', 'Turquoise shallows and wind-sport paradise.'],
    ['Twyalt', 'desert', 'A Sinai classic — desert stop-over.'],
    ['Blue Hole', 'dive', 'The legendary Dahab dive and snorkel site.'],
    ['Stars', 'night', 'A night under the Milky Way, far from any light.'],
    ['Yacht Dahab', 'sea', 'Sail the Gulf of Aqaba from Dahab.'],
    ['Yacht Taba', 'sunset', 'Sunset on the water at the top of the Red Sea.'],
    ['Nuwwbea', 'sea', 'Nuweiba — long beaches and calm bays.'],
    ['Sharm', 'sunset', 'Sharm El Sheikh — reefs, nightlife and resorts.'],
    ['Saint Catherine', 'mountain', 'Sunrise in the mountains of the Holy Mount.'],
    ['Diving', 'dive', 'Certified instructors, full equipment, coral gardens.'],
    ['Safari', 'desert', 'Jeep and quad through dunes and canyons.'],
    ['Ras Shtan', 'mountain', 'Red rock coast and quiet coves.'],
    ['Wade 8zlan', 'desert', 'A hidden valley of palms and stone.'],
    ['Wade w4wa4', 'mountain', 'Canyons and rocky trails.'],
    ['Panorama Dahab', 'mountain', 'The whole bay from above.'],
    ['Movie Night', 'night', 'Cinema under the stars, on the sand.'],
    ['Abr Bnt', 'mountain', 'Rock, ridge and a long view.'],
    ['G7aza', 'desert', 'Gazelle country — a gentle desert day.'],
    ['Ras Mohamed', 'dive', 'The national park: coral walls and big blue.']
  ];
  const activities = A.map((a, i) => ({
    section: 'act', kind: 'Activity', id: slug(a[0]), name: a[0], scene: a[1], short: a[2], idx: i,
    long: a[2] + ' Tell us your dates and we build it into your trip — transport, guide and timing included.',
    duration: 'Half or full day', group: '2 – 20 guests', price: 'On request', pics: [], vids: []
  }));

  window.SAHRA = { brand: BRAND, tiers: TIERS, tierOrder: ['budget', 'comfort', 'premium', 'luxury'], stays, operation, activities, chatEndpoint: '' };
})();
