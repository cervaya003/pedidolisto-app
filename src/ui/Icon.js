import van from "vanjs-core";

const { svg, path } = van.tags("http://www.w3.org/2000/svg");

const PATHS = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowDown: "M12 5v14M18 13l-6 6-6-6",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.8 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11",
  truck: "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
  type: "M4 7V5h16v2M12 5v14M9 19h6",
  check: "M5 12.5l4.5 4.5L19 7",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  pin: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  instagram:
    "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm8 7.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17.5 6.5h.01",
  facebook: "M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.8 1.8-1.8H18V2.6A20 20 0 0 0 15.4 2.5C12.8 2.5 11 4 11 7v2.5H8V13h3v8",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff:
    "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2",
  monitor: "M3 5h18v11H3zM8 20h8M12 16v4",
  tablet: "M6 3h12v18H6zM11 18h2",
  phone: "M8 3h8v18H8zM11 18h2",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  store: "M4 9l1.5-5h13L20 9M4 9h16v11H4zM9 20v-6h6v6",
  palette:
    "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-2 2-2H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8ZM7.5 11.5h.01M10 7.5h.01M15 7.5h.01",
  layout: "M4 4h16v16H4zM4 10h16M10 10v10",
  tag: "M3 12V4h8l9 9-8 8-9-9ZM7.5 7.5h.01",
  box: "M3 7l9-4 9 4v10l-9 4-9-4V7Zm0 0l9 4 9-4M12 11v10",
  image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6M9 16h3",
  cart: "M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6M9 20h.01M17 20h.01",
  minus: "M5 12h14",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4",
  star: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5Z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  home: "M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5",
  lock: "M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  loader: "M12 3a9 9 0 1 0 9 9",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Zm-3.5 9 2.5 2.5 4.5-5",
};

export default function Icon(name, className = "size-5") {
  return svg(
    {
      class: className,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.8",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    path({ d: PATHS[name] }),
  );
}
