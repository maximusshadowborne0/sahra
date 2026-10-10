/* =====================================================================
   SAHRA — CONTENT FILE  (edit everything here, no other file needed)
   - Rename hotels / camps / activities
   - Replace `image` with your own photo (e.g. "assets/hotel-1.jpg")
   - Add a `video` (e.g. "assets/hotel-1.mp4") to play it behind the text
     on that item's detail page
   ===================================================================== */

// Online placeholder photos, picked by keyword. Replace with your own later.
const img = (tags, seed, w = 1000, h = 700) =>
  `https://loremflickr.com/${w}/${h}/${tags}?lock=${seed}`;

const GRADS = [
  ['#D8B27C', '#B96545'], ['#176B78', '#142B35'], ['#B96545', '#142B35'],
  ['#176B78', '#D8B27C'], ['#8B8175', '#142B35']
];

const mk = (o, i) => ({
  video: '',
  season: 'All year',
  duration: 'Full day',
  group: '2 – 20 guests',
  price: 'On request',
  long: 'Write the full story of this place here. It appears over the video or photo on the detail page.',
  highlights: ['Highlight one', 'Highlight two', 'Highlight three', 'Highlight four'],
  g: GRADS[i % 5],
  ...o,
  id: o.id || o.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  image: o.image || img(o.tags, o.seed),
  gallery: o.gallery || [1, 2, 3].map(k => img(o.tags, o.seed * 10 + k, 700, 500))
});

window.SAHRA = {
  brand: {
    name: 'Sahra',
    tagline: 'Sinai, from the desert to the Red Sea',
    whatsapp: '201000000000',        // international format, no +
    email: 'hello@sahra.example'
  },

  // Optional: URL of your own backend that talks to an AI model.
  // It receives POST {messages:[{role,content}]} and returns {reply:"..."}.
  chatEndpoint: '',

  operation: [
    { name: 'Hiace', kind: 'Operation', tags: 'minibus,van', seed: 1, short: 'Private van', long: 'Comfortable private Hiace vans for families and small groups, with a driver who knows every road in Sinai.', duration: 'Door to door', group: '2 – 12 guests' },
    { name: 'Bus', kind: 'Operation', tags: 'coach,bus,travel', seed: 2, short: 'Group coach', long: 'Air-conditioned coaches for larger groups, schools and events.', duration: 'Door to door', group: '15 – 50 guests' },
    { name: 'Airplane', kind: 'Operation', tags: 'airplane,wing,sky', seed: 3, short: 'Flights', long: 'Flights to Sharm El Sheikh with a transfer waiting at arrivals.', duration: 'Flight + transfer', group: '1 – 100 guests' }
  ].map(mk),

  // Hotels and camps are numbered, no levels.
  stays: [
    ...[1, 2, 3, 4, 5, 6].map(n => ({ name: 'Hotel ' + n, kind: 'Hotel', tags: 'luxury,hotel,resort', seed: 20 + n, short: 'A comfortable stay in Sinai', duration: 'Per night', group: '1 – 4 per room' })),
    ...[1, 2, 3, 4].map(n => ({ name: 'Camp ' + n, kind: 'Camp', tags: 'desert,camp,tent', seed: 40 + n, short: 'Sleep under the Sinai sky', duration: 'Per night', group: '1 – 6 per tent' }))
  ].map(mk),

  activities: [
    ['Lagoona', 'lagoon,turquoise,sea'], ['Twyalt', 'bedouin,desert,sinai'], ['Blue Hole', 'blue,hole,dahab'],
    ['Stars', 'milky,way,desert'], ['Yacht Dahab', 'yacht,red,sea'], ['Yacht Taba', 'sailboat,sea,sunset'],
    ['Nuwwbea', 'beach,sinai,sea'], ['Sharm', 'sharm,el,sheikh'], ['Sant Katren', 'mountain,sinai,sunrise'],
    ['Diving', 'scuba,coral,reef'], ['Sfare', 'safari,desert,jeep'], ['Ras Shtan', 'canyon,red,rock'],
    ['Wade 8zlan', 'oasis,valley,palm'], ['Wade w4wa4', 'canyon,desert,rocks'], ['Banorama Dahab', 'dahab,panorama,mountains'],
    ['Movie Night', 'cinema,night,beach'], ['Abr Bnt', 'rock,climbing,mountain'], ['G7aza', 'gazelle,desert'],
    ['Ras Mohamed', 'ras,mohammed,coral']
  ].map((a, i) => ({ name: a[0], kind: 'Activity', tags: a[1], seed: 60 + i, short: 'Discover ' + a[0] + ' with a Sahra guide' })).map(mk)
};
