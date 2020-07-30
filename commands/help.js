import { findCommand } from "../lib/commands.js";

const DEFAULT_ORDER = ["i", "c", "f", "d", "nt", "dt", "m", "s", "a", "r", "t", "e", "locate", "list", "h"];

export const help = {
  name: "help",
  shortdesc: "Display This Help",
  description: "Example bot-style usage: `.h`\nExample NL-style usage: `.help`",
  aliases: ["h"],
  confirm: false,
  permLevel: 3,
  minArgs: 0,
  exec: async function execHelp({ message, args }) {
    const helpMessage = {
      color: message.client.config.embedColor || "WHITE",
      title: `${message.client.config.name} Help`,
      description: args.length
        ? ""
        : "This bot is able to perform initial server setup, create and delete rooms, and add, remove, or transfer teams to and from rooms. It supports both conventional bot-style syntax and natural language-style [NL-style] syntax. Commands acting on existing teams or rooms require you to tag the role of the team you are operating on and/or the text channels representing the rooms you are operating on. Unless otherwise stated, commands can only be run by users with the Control Room or Staff roles. Add --force to the end of your command to override having to confirm.",
      fields: [],
    };

    const order = args.length > 0 ? args : DEFAULT_ORDER;

    const commands = order.map(a => findCommand(message.client, a)).filter(s => !!s);

    if (commands.length) {
      for (const { shortdesc, description } of commands) {
        helpMessage.fields.push({ name: shortdesc, value: description });
      }
    } else {
      helpMessage.fields.push({
        name: "Not found",
        value: `Specified command(s) \`${args.join("`, `")}\` not found`,
      });
    }

    message.channel.send({ embed: helpMessage });
  },
};
