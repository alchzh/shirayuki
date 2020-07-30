/* eslint-disable no-console */

import Discord from "discord.js";
import { promises as fsPromises } from "fs";

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

  const commandFiles = (await fsPromises.readdir(directory)).filter(file => file.endsWith(".js"));

  await Promise.all(
    commandFiles.map(file =>
      import(`${directory}/${file}`)
        .then(commands => {
          Object.values(commands).forEach(command => {
            loadCommand(client, command);
            console.log("Loaded command: ", command.name);
          });
        })
        .catch(e => {
          console.error(`Failed to load commands from ${file}`);
          console.error(e.stack);
        })
    )
  );
}
