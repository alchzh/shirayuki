import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.json"));

fs.watchFile("./config.json", () => {
  try {
    Object.assign(config, JSON.parse(fs.readFileSync("./config.json")));
  } catch (e) {
    console.error(e);
  }
});

export default config;
