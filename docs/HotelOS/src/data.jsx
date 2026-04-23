// Turkish sample data for HotelOS Phase 1
// Keep it realistic — Izmir-ish boutique hotel, ~24 rooms.

const TR = {
  // shell
  brand: "HotelOS",
  hotel: "Deniz Butik Otel",
  property: "Çeşme · İzmir",
  searchPlaceholder: "Rezervasyon, misafir, oda ara…",
  // nav
  nav: [
    { key: "dashboard", label: "Özet", group: "Operasyon" },
    { key: "reservations", label: "Rezervasyonlar", group: "Operasyon", badge: 4 },
    { key: "rooms", label: "Odalar", group: "Operasyon" },
    { key: "guests", label: "Misafirler", group: "Operasyon" },
    { key: "housekeeping", label: "Kat Hizmetleri", group: "Operasyon", soon: true },
    { key: "maintenance", label: "Teknik Servis", group: "Operasyon", soon: true },
    { key: "agency", label: "Acente & Fiyat", group: "Ticari", soon: true },
    { key: "accounting", label: "Muhasebe", group: "Ticari", soon: true },
    { key: "hr", label: "İnsan Kaynakları", group: "Ticari", soon: true },
    { key: "reports", label: "Raporlar", group: "Ticari", soon: true },
    { key: "settings", label: "Ayarlar", group: "Sistem" },
  ],
};

// Rooms: 3 floors × 8 rooms
const ROOM_TYPES = [
  { id: "std", name: "Standart Deniz", capacity: 2, basePrice: 4200 },
  { id: "dlx", name: "Deluxe Balkon", capacity: 2, basePrice: 5800 },
  { id: "fam", name: "Aile Süit", capacity: 4, basePrice: 9400 },
  { id: "exe", name: "Executive", capacity: 2, basePrice: 7600 },
];

const ROOMS = (() => {
  const out = [];
  const views = ["Deniz", "Bahçe", "Havuz"];
  const statuses = ["CLEAN", "DIRTY", "FAULTY", "DND", "CLEAN", "CLEAN", "DIRTY", "CLEAN"];
  let i = 0;
  for (let f = 1; f <= 3; f++) {
    for (let n = 1; n <= 8; n++) {
      const num = `${f}0${n}`;
      const typeId = n <= 4 ? "std" : n <= 6 ? "dlx" : n === 7 ? "exe" : "fam";
      out.push({
        id: `room-${num}`,
        number: num,
        floor: f,
        typeId,
        view: views[(f + n) % 3],
        status: statuses[i % statuses.length],
        faultNote: i % 13 === 3 ? "Klima arızalı, soğutmuyor" : null,
      });
      i++;
    }
  }
  return out;
})();

const GUESTS = [
  { id: "g1", firstName: "Elif", lastName: "Yıldız", tc: "•••••••9834", phone: "+90 532 418 22 61", email: "elif.yildiz@mail.com", nationality: "TR", totalStays: 4, totalRevenue: 38400, vip: true, segment: "Sadık", blacklisted: false },
  { id: "g2", firstName: "Mert", lastName: "Aksoy", tc: "•••••••4102", phone: "+90 505 211 88 45", email: "m.aksoy@mail.com", nationality: "TR", totalStays: 1, totalRevenue: 9200, vip: false, segment: "Yeni", blacklisted: false },
  { id: "g3", firstName: "Sofia", lastName: "Ricci", tc: null, passport: "YB8842310", phone: "+39 345 778 12 04", email: "s.ricci@mail.com", nationality: "IT", totalStays: 2, totalRevenue: 14800, vip: false, segment: "Acente", blacklisted: false },
  { id: "g4", firstName: "Ahmet", lastName: "Kaya", tc: "•••••••6620", phone: "+90 533 912 30 18", email: "a.kaya@mail.com", nationality: "TR", totalStays: 7, totalRevenue: 72400, vip: true, segment: "VIP", blacklisted: false },
  { id: "g5", firstName: "Johan", lastName: "Weber", tc: null, passport: "C01XY4521", phone: "+49 171 445 29 90", email: "j.weber@mail.com", nationality: "DE", totalStays: 1, totalRevenue: 11200, vip: false, segment: "Acente", blacklisted: false },
  { id: "g6", firstName: "Zeynep", lastName: "Demir", tc: "•••••••8891", phone: "+90 538 777 55 10", email: "z.demir@mail.com", nationality: "TR", totalStays: 3, totalRevenue: 27600, vip: false, segment: "Sadık", blacklisted: false },
  { id: "g7", firstName: "Burak", lastName: "Öztürk", tc: "•••••••0274", phone: "+90 544 102 92 77", email: "b.ozturk@mail.com", nationality: "TR", totalStays: 0, totalRevenue: 0, vip: false, segment: "Yeni", blacklisted: true, blacklistReason: "Ödenmemiş hasar, 12.300 TL (Eki 2024)" },
];

const AGENCIES = [
  { id: "dir", name: "Direkt", commission: 0, color: "#57534e" },
  { id: "book", name: "Booking.com", commission: 15, color: "#1d4ed8" },
  { id: "exp", name: "Expedia", commission: 18, color: "#b45309" },
  { id: "jolly", name: "Jolly Tur", commission: 12, color: "#7c3aed" },
];

const RESERVATIONS = [
  { id: "R-24851", guestId: "g4", roomId: "room-302", agencyId: "dir", checkIn: "2026-04-23", checkOut: "2026-04-27", adults: 2, children: 0, status: "ARRIVAL_TODAY", totalPrice: 30400, paid: 15200, balance: 15200, nights: 4, kbs: "pending", signature: "signed", notes: "VIP — hoş geldin şampanyası ve meyve tabağı ayarlandı." },
  { id: "R-24852", guestId: "g1", roomId: "room-205", agencyId: "dir", checkIn: "2026-04-23", checkOut: "2026-04-25", adults: 2, children: 1, status: "ARRIVAL_TODAY", totalPrice: 11600, paid: 11600, balance: 0, nights: 2, kbs: "sent", signature: "signed", notes: "Bebek beşiği istendi." },
  { id: "R-24853", guestId: "g3", roomId: "room-108", agencyId: "book", checkIn: "2026-04-23", checkOut: "2026-04-30", adults: 2, children: 0, status: "ARRIVAL_TODAY", totalPrice: 40600, paid: 40600, balance: 0, nights: 7, kbs: "pending", signature: "pending", notes: "" },
  { id: "R-24854", guestId: "g2", roomId: "room-103", agencyId: "dir", checkIn: "2026-04-22", checkOut: "2026-04-24", adults: 2, children: 0, status: "CHECKEDIN", totalPrice: 8400, paid: 8400, balance: 0, nights: 2, kbs: "sent", signature: "signed", notes: "" },
  { id: "R-24855", guestId: "g6", roomId: "room-206", agencyId: "jolly", checkIn: "2026-04-21", checkOut: "2026-04-23", adults: 2, children: 2, status: "DEPARTURE_TODAY", totalPrice: 13200, paid: 13200, balance: 0, nights: 2, kbs: "sent", signature: "signed", notes: "" },
  { id: "R-24856", guestId: "g5", roomId: "room-301", agencyId: "book", checkIn: "2026-04-20", checkOut: "2026-04-23", adults: 2, children: 0, status: "DEPARTURE_TODAY", totalPrice: 15600, paid: 15600, balance: 0, nights: 3, kbs: "sent", signature: "signed", notes: "" },
  { id: "R-24857", guestId: "g4", roomId: "room-304", agencyId: "dir", checkIn: "2026-04-26", checkOut: "2026-04-28", adults: 2, children: 0, status: "CONFIRMED", totalPrice: 15200, paid: 5000, balance: 10200, nights: 2, kbs: "waiting", signature: "pending", notes: "" },
  { id: "R-24858", guestId: "g1", roomId: "room-207", agencyId: "exp", checkIn: "2026-04-28", checkOut: "2026-05-02", adults: 2, children: 0, status: "CONFIRMED", totalPrice: 23200, paid: 23200, balance: 0, nights: 4, kbs: "waiting", signature: "signed", notes: "" },
  { id: "R-24859", guestId: "g2", roomId: null, agencyId: "dir", checkIn: "2026-04-30", checkOut: "2026-05-02", adults: 2, children: 0, status: "WAITING", totalPrice: 9400, paid: 0, balance: 9400, nights: 2, kbs: "waiting", signature: "pending", notes: "" },
];

// Past reservation history for guest g1 (Elif Yıldız)
const GUEST_HISTORY_G1 = [
  { id: "R-23110", when: "Oca 2026", room: "Deluxe 208", nights: 3, total: 18400, agency: "Direkt" },
  { id: "R-22540", when: "Eyl 2025", room: "Deluxe 205", nights: 5, total: 29000, agency: "Direkt" },
  { id: "R-21902", when: "Haz 2025", room: "Standart 104", nights: 2, total: 8800, agency: "Booking.com" },
  { id: "R-20880", when: "Mar 2025", room: "Standart 102", nights: 4, total: 16800, agency: "Direkt" },
];

// Occupancy sparkline data — last 14 days
const OCCUPANCY_14D = [62, 64, 71, 68, 74, 79, 82, 76, 70, 73, 77, 84, 86, 83];
const REVENUE_14D = [82, 88, 101, 94, 112, 126, 134, 118, 102, 108, 121, 139, 142, 137];

function trDate(iso) {
  const d = new Date(iso);
  const M = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  return `${d.getDate()} ${M[d.getMonth()]}`;
}
function trMoney(kurus) {
  const lira = Math.round(kurus);
  return lira.toLocaleString("tr-TR") + " ₺";
}
function statusMeta(s) {
  return {
    WAITING:           { label: "Beklemede",      tone: "info"  },
    CONFIRMED:         { label: "Onaylandı",      tone: "neutral"},
    ARRIVAL_TODAY:     { label: "Bugün giriş",    tone: "good"  },
    CHECKEDIN:         { label: "İç etti",        tone: "good"  },
    DEPARTURE_TODAY:   { label: "Bugün çıkış",    tone: "warn"  },
    CHECKEDOUT:        { label: "Çıkış yapıldı",  tone: "muted" },
    CANCELLED:         { label: "İptal",          tone: "bad"   },
    NOSHOW:            { label: "No-show",        tone: "bad"   },
  }[s] || { label: s, tone: "neutral" };
}
function roomStatusMeta(s) {
  return {
    CLEAN:  { label: "Temiz",    tone: "good"  },
    DIRTY:  { label: "Kirli",    tone: "warn"  },
    FAULTY: { label: "Arızalı",  tone: "bad"   },
    DND:    { label: "DND",      tone: "info"  },
  }[s] || { label: s, tone: "neutral" };
}
function guestById(id) { return GUESTS.find(g => g.id === id); }
function roomById(id) { return ROOMS.find(r => r.id === id); }
function agencyById(id) { return AGENCIES.find(a => a.id === id); }
function roomTypeById(id) { return ROOM_TYPES.find(t => t.id === id); }

Object.assign(window, {
  TR, ROOMS, ROOM_TYPES, GUESTS, AGENCIES, RESERVATIONS, GUEST_HISTORY_G1,
  OCCUPANCY_14D, REVENUE_14D,
  trDate, trMoney, statusMeta, roomStatusMeta,
  guestById, roomById, agencyById, roomTypeById,
});
