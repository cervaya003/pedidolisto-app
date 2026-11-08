// Lectura y escritura inmutable por ruta: "theme.colors.primary", "products.3.name".

export const getIn = (source, path) => path.split(".").reduce((value, key) => value?.[key], source);

const setInKeys = (source, [key, ...rest], value) => {
  const copy = Array.isArray(source) ? [...source] : { ...source };
  copy[key] = rest.length ? setInKeys(source?.[key] ?? {}, rest, value) : value;
  return copy;
};

export const setIn = (source, path, value) => setInKeys(source, path.split("."), value);

export const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  copy.splice(to, 0, copy.splice(from, 1)[0]);
  return copy;
};
