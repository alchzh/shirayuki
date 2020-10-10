/* eslint-disable no-console */

import Discord from "discord.js";
import { promises as fsPromises } from "fs";
import { join as joinPath, dirname } from "path";
import { fileURLToPath } from "url";

export function loadCommand(client, command) {
  if (client.commands.has(command.name)) {
    throw TypeError(`invalid reassignment of command ${command.name}. Do we need a reload?`);
  }
  for (const alias of command.aliases || []) {
    if (client.aliases.has(alias)) {
      throw TypeError(`invalid reassignment of alias ${alias}. Do we need a reload?`);
    }
  }

  client.commands.set(command.name, command);
  for (const alias of command.aliases) {
    client.aliases.set(alias, command.name);
  }
}

export async function loadCommmandsFromFiles(client, directory) {
  client.commands = new Discord.Collection();
  client.aliases = new Discord.Collection();

  const loaderDirname =
    typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));
  const commandsDirname = joinPath(loaderDirname, directory);
  const lsDir = await fsPromises.readdir(commandsDirname);

  await Promise.all(
    lsDir.map(async file => {
      const stat = await fsPromises.stat(joinPath(commandsDirname, file));
      let fullFile;

      if (stat.isFile() && file.endsWith(".js")) {
        fullFile = file;
      } else if (stat.isDirectory()) {
        const indexPath = joinPath(file, "index.js");
        const indexStat = await fsPromises.stat(joinPath(commandsDirname, indexPath));

        if (indexStat.isFile()) {
          fullFile = indexPath;
        }
      }

      if (fullFile) {
        import(`${directory}/${fullFile}`)
          .then(commands => {
            Object.values(commands).forEach(command => {
              loadCommand(client, command);
              console.log("Loaded command: ", command.name);
            });
          })
          .catch(e => {
            console.error(`Failed to load commands from ${file}`);
            console.error(e.stack);
          });
      }
    })
  );
}
