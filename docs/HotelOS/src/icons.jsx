// Minimal icon set, stroke-based, works in light + dark themes.
// 16px default. Pass size prop to override.
const I = (d, extra) => ({ size = 16, color = "currentColor", strokeWidth = 1.75, ...p }) =>
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {extra}
    {d && <path d={d} />}
  </svg>;

const Icons = {
  Search:      I("M11 19a8 8 0 1 1 5.29-14M21 21l-4.35-4.35"),
  Command:     I("M18 6a2 2 0 1 0-2 2h2zM6 6a2 2 0 1 1 2 2H6zm12 12a2 2 0 1 1-2-2h2zM6 18a2 2 0 1 0 2-2H6zM8 8h8v8H8z"),
  ChevronDown: I("m6 9 6 6 6-6"),
  ChevronRight:I("m9 6 6 6-6 6"),
  ChevronLeft: I("m15 6-6 6 6 6"),
  Plus:        I("M12 5v14M5 12h14"),
  Dot:         I(null, <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>),
  Check:       I("m5 13 4 4L19 7"),
  X:           I("M18 6 6 18M6 6l18 18"),
  Filter:      I("M3 5h18l-7 9v5l-4 2v-7z"),
  Calendar:    I("M3 9h18M8 3v4m8-4v4", <rect x="3" y="5" width="18" height="16" rx="2"/>),
  Users:       I("M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0M17 11a4 4 0 1 0 0-8M22 21a7 7 0 0 0-5-6.7"),
  User:        I("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0"),
  Bed:         I("M3 18v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 14h18M7 10V8a2 2 0 0 1 2-2h2v4"),
  Door:        I("M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M4 21h16M15 12.5v1"),
  Sparkles:    I("M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"),
  Home:        I("M3 12 12 3l9 9v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"),
  Tool:        I("M14.7 6.3a4 4 0 0 0 5 5l-10 10a2.8 2.8 0 1 1-4-4z"),
  Tag:         I("M20 12 12 20l-8-8V4h8z", <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/>),
  Receipt:     I("M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4"),
  Coin:        I(null, <><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 10H10.5a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3H9"/></>),
  Briefcase:   I("M3 9h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 9V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"),
  BarChart:    I("M3 21h18M6 17V9m5 8V5m5 12v-6"),
  Settings:    I("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>),
  Bell:        I("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"),
  Moon:        I("M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"),
  Sun:         I("M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4", <circle cx="12" cy="12" r="4"/>),
  MoreH:       I(null, <><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></>),
  Download:    I("M12 3v13m0 0 5-5m-5 5-5-5M4 21h16"),
  Arrow:       I("M5 12h14M13 6l6 6-6 6"),
  ArrowLeft:   I("M19 12H5M11 6l-6 6 6 6"),
  Shield:      I("M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z", <path d="m9 12 2 2 4-4"/>),
  Wifi:        I("M5 12a10 10 0 0 1 14 0M8 16a5 5 0 0 1 8 0M12 20h.01"),
  Sun2:        I(null, <circle cx="12" cy="12" r="4"/>),
  Pencil:      I("M12 20h9M16.5 3.5a2 2 0 1 1 3 3L7 19l-4 1 1-4z"),
  Key:         I("M15 8a3 3 0 1 1 0 .01M14 10 4 20l2 2 1.5-1.5L6 19l2-2 1.5 1.5L11 17l-1.5-1.5L11 14l3 3 1-1z"),
  Flag:        I("M4 21V4h13l-2 4 2 4H4"),
  Hash:        I("M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"),
  Phone:       I("M22 16.9v3a2 2 0 0 1-2.2 2 20 20 0 0 1-8.6-3.1 20 20 0 0 1-6-6A20 20 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.4 2.5a2 2 0 0 1-.6 1.8L7.5 9.2a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 1.8-.6l2.5.4a2 2 0 0 1 1.7 2z"),
  Mail:        I("M4 6h16v12H4z", <path d="m4 6 8 7 8-7"/>),
  Signature:   I("M3 18h18M4 14c2 0 3-2 4-5s2-5 3-5 1 2 2 5 2 5 4 5c2 0 3-1 4-3"),
  CheckCircle: I("m8 12 3 3 5-6", <circle cx="12" cy="12" r="9"/>),
  AlertTri:    I("M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01"),
  Clock:       I("M12 7v5l3 2", <circle cx="12" cy="12" r="9"/>),
  CreditCard:  I("M3 10h18", <rect x="3" y="5" width="18" height="14" rx="2"/>),
  Building:    I("M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"),
  Star:        I("M12 3.5 14.5 9l6 .5-4.5 4 1.5 6-5.5-3-5.5 3 1.5-6L3.5 9.5l6-.5z"),
  Percent:     I("M5 19 19 5", <circle cx="7.5" cy="7.5" r="2.5"/>, <circle cx="16.5" cy="16.5" r="2.5"/>),
  Globe:       I("M3 12h18M12 3a14 14 0 0 1 0 18A14 14 0 0 1 12 3Z", <circle cx="12" cy="12" r="9"/>),
};

window.Icons = Icons;
