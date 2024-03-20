export const deepCopy = (obj, cache = new WeakMap()) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  const copy = Array.isArray(obj) ? [] : {};
  cache.set(obj, copy);
  Object.keys(obj).forEach((key) => {
    copy[key] = deepCopy(obj[key], cache);
  });
  return copy;
};

export const getDuplicateKeys = (arr) => {
  const keys = {};
  const duplicates = {};
  for (let i = 0; i < arr.length; i++) {
    const obj = arr[i];
    for (const key in obj) {
      if (keys[key]) {
        duplicates[key] = true;
      }
      keys[key] = true;
    }
  }
  return Object.keys(duplicates);
};

export const formatJson = (oldJson, req) => {
  if (Array.isArray(oldJson)) {
    return oldJson.map((json) => formatJson(json, req));
  } else if (typeof oldJson === "object") {
    let json = deepCopy(oldJson);
    if (json.content) return formatJson(json.content, req);
    if (json.OFP) return formatJson(json.OFP, req);
    if (json.children) {
      const duplicateKeys = getDuplicateKeys(json.children);
      if (duplicateKeys.length) {
        duplicateKeys.forEach((key) => {
          json[key] = json[key] || [];
          json[key].push(...json.children.map((c) => c[key]).filter((c) => c));
        });
        const otherChildren = json.children.filter(
          (c) => !duplicateKeys.some((key) => c[key])
        );
        json.children = otherChildren;
        return formatJson(json, req);
      }
      const children = {
        ...json.children.reduce((acc, child, i) => ({ ...acc, ...child }), {}),
      };
      const { children: _, ...rest } = json;
      json = {
        ...rest,
        ...children,
      };
      return formatJson(json, req);
    }
    Object.keys(json).forEach((key) => {
      json[key] = formatJson(json[key], req);
    });
    return json;
  } else if (typeof oldJson === "string") {
    // do nothing for now
    return oldJson;
  }
};
