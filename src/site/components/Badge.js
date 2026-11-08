import van from "vanjs-core";

const { span } = van.tags;

export default function Badge(label, className = "") {
  return span(
    {
      class: `inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-neutral-900 uppercase shadow-sm backdrop-blur sm:text-[11px] ${className}`,
    },
    label,
  );
}
