/* eslint-disable no-console */
import { Client, RoleManager, GuildChannelManager } from "discord.js";
import parser from "discord-command-parser";

import "./lib/discordjs-ext/updateOverwrites.js";

import config from "./config.js";
import { executeCommand, findCommand, ArgumentsError, ConfirmationError } from "./lib/commands.js";
import { loadCommmandsFromFiles } from "./commandLoader.js";
import { registerMany, register } from "./lib/discordjs-ext/register.js";

import serverTemplate from "./serverTemplate.js";
import createPartialMessage from "./lib/discordjs-ext/createPartialMessage.js";
import colorGenerator from "./lib/colorGenerator.js";

const SPLITTER_REGEX = /(```.*?```|(?!\n).)+/gs;

const client = new Client();

client.config = config;

(function registerRoles() {
  registerMany(RoleManager, serverTemplate.roles);
  register(RoleManager, "everyone", (r, _this) => r.id === _this.guild.id);
})();

(function registerChannels() {
  registerMany(GuildChannelManager, serverTemplate.channels);
})();

client.on("ready", async function onReady() {
  await Promise.all(
    client.guilds.cache.map(guild => {
      console.log(`${guild.name}`);
      guild.colorGenerator = colorGenerator();
      return guild.roles.fetch();
    })
  );

  client.on("message", async function onMessage(message) {
    if (message.author.id === client.user.id || !message.content || !message.content.length) return;

    for (const line of message.content.match(SPLITTER_REGEX)) {
      const parsed = parser.parse(createPartialMessage(message, line), config.prefix);
      if (!parsed.success) return;

      const command = findCommand(message.client, parsed.command);
      if (!command) return;

      try {
        await executeCommand(command, parsed);
      } catch (e) {
        message.react("❌").catch(() => {});

        if (!(e instanceof ConfirmationError || e instanceof ArgumentsError)) {
          console.error(e);
          console.error(e.stack);
        }

        return;
      }
    }

    message.react("✅").catch(() => {});
  });

  client.on("guildCreate", guild => {
    guild.roles.fetch();
  });

  client.user
    .setActivity(".help", { type: "LISTENING" })
    .then(() => {
      console.log("up and running!");
    })
    .catch(e => console.error(e));
});

loadCommmandsFromFiles(client, "./commands").then(() => {
  client.login(config.token);
});
