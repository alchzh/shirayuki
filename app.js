/* eslint-disable no-console */
import { Client } from "discord.js";
import parser from "discord-command-parser";

import config from "./config.js";
import { executeCommand } from "./lib/commands.js";
import { loadCommmandsFromFiles } from "./commandLoader.js";
import { reloadRoles } from "./lib/roles.js";
import MessageMentionsRegex from "./lib/MessageMentionsRegex.js";

const client = new Client();

client.config = config;

function partialMessage(message, part) {
  const partial = Object.create(message, {
    content: { value: part },
  });

  partial.mentions = new MessageMentionsRegex(partial);

  return partial;
}

client.on("ready", async function onReady() {
  Promise.all(
    client.guilds.cache.map(guild => {
      console.log(`${guild.name} ${guild.owner.user.tag}`);
      return reloadRoles(guild);
    })
  ).then(() => {
    client.on("message", async function onMessage(message) {
      for (const line of message.content.split("\n")) {
        const parsed = parser.parse(partialMessage(message, line), config.prefix);

        if (!parsed.success) return;

        // eslint-disable-next-line no-await-in-loop
        try {
          await executeCommand(parsed);
        } catch (e) {
          message.react("❌").catch(() => {});
          return;
        }
      }

      message.react("✅").catch(() => {});
    });

    client.on("guildCreate", guild => {
      reloadRoles(guild);
    });

    client.user
      .setActivity(".help", { type: "LISTENING" })
      .then(() => {
        console.log("up and running!");
      })
      .catch(console.error);
  });
});

loadCommmandsFromFiles(client, "./commands").then(() => {
  client.login(config.token);
});
