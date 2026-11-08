import van from "vanjs-core";
import { adminStore } from "../adminStore.js";

const { div } = van.tags;

const TONES = {
  info: "bg-zinc-900 text-white",
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
};

export default function Toast() {
  return div({ class: "pointer-events-none fixed inset-x-0 bottom-24 z-50 lg:bottom-6 flex justify-center px-4", role: "status", "aria-live": "polite" }, () => {
    const notice = adminStore.notice.val;
    return notice
      ? div({ class: `max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${TONES[notice.type] ?? TONES.info}` }, notice.message)
      : div();
  });
}
