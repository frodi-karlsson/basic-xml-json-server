import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

export default {
  input: "src/config-server.js",
  output: {
    file: "config-server.bundle.cjs",
    format: "cjs",
  },
  plugins: [
    commonjs(),
    resolve({
      preferBuiltins: true,
    }),
    terser(),
    json(),
  ],
};
