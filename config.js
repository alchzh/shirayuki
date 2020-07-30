import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.json"));

fs.watchFile("./config.json", () => {
  Object.assign(config, JSON.parse(fs.readFileSync("./config.json")));
});

export default config;
