import selfsigned from "selfsigned";

const getPems = (url) => {
  const attrs = [{ name: "commonName", value: url }];
  const pems = selfsigned.generate(attrs, { days: 365 });
  return pems;
};

export const getCertAndKey = (url) => {
  const { private: key, cert } = getPems(url);
  return { key, cert };
};
