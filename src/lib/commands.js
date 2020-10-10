/* eslint-disable no-console */
/* eslint-disable max-classes-per-file */

import { Collection, Message } from "discord.js";
import config from "../config.js";
import { getPermissionLevel, isTeamRole } from "./roles.js";

// Custom Errors
export class ConfirmationError extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);

    this.name = "ConfirmationError";
  }
}

export class ArgumentsError extends TypeError {
  constructor(message = "", ...args) {
    super(message, ...args);

    this.name = "ArgumentsError";
  }
}

// Command Execution
export function findCommand(client, command) {
  return client.commands.get(command) ?? client.commands.get(client.aliases.get(command));
}

export async function confirm(message, prompt, force) {
  if (force) {
    message.react("👍");
    return;
  }

  const confirmMessage = await message.channel.send(
    `${prompt} Confirm by reacting with :thumbsup: or by typing \`yes\`.`
  );

  const confirmReaction = await confirmMessage.react("👍");

  const collected = await Promise.race([
    confirmMessage.awaitReactions(
      (reaction, user) => reaction.emoji.name === "👍" && user.id === message.author.id,
      { max: 1, time: config.confirmWaitTime }
    ),
    message.channel.awaitMessages(
      m => m.author.id === message.author.id && m.content.charAt(0).toLowerCase() === "y",
      { max: 1, time: config.confirmWaitTime }
    ),
  ]);

  if (collected.size === 0) {
    throw new ConfirmationError(prompt);
  }

  const collect = collected.first();
  if (collect instanceof Message) {
    await confirmReaction.users.remove(message.client.user.id);
  }
}

function argToFlag(arg) {
  return arg.substring(2).replace(/-([a-z])/g, (_, u) => u.toUpperCase());
}

export async function executeCommand(command, { message, arguments: _args }) {
  if (!command) return;

  if (getPermissionLevel(message.member) < command.permLevel) {
    await message.channel.send(`You don't have permissions to execute command \`${command.name}\`.`);
    return;
  }

  const args = [];
  const flags = Object.create(null);

  for (const arg of _args) {
    if (arg.startsWith("--")) {
      flags[argToFlag(arg)] = true;
    } else {
      args.push(arg);
    }
  }

  try {
    if (args.length < (command.minArgs ?? 0)) {
      throw new ArgumentsError(
        `invalid number of arguments. ${command.minArgs} arguments expected, ${args.length} found.`
      );
    }

    if (message.mentions.roles.size < (command.minRoles ?? 0)) {
      throw new ArgumentsError(
        `invalid number of roles mentioned. ${command.minRoles} roles expected, ${message.mentions.roles.size} found.`
      );
    }

    if (command.minTeams !== undefined) {
      message.mentions.teams = message.mentions.roles.filter(isTeamRole);

      if (message.mentions.teams.size < command.minTeams) {
        throw new ArgumentsError(
          `invalid number of teams mentioned. ${command.minTeams} teams expected, ${message.mentions.teams.size} found.`
        );
      }
    }

    if (command.minRooms !== undefined) {
      message.mentions.rooms = new Collection();
      message.mentions.channels.each(channel => {
        if (channel.parent && channel.parent.type === "category")
          message.mentions.rooms.set(channel.parent.id, channel.parent);
      });

      if (message.mentions.rooms.size < command.minRooms) {
        throw new ArgumentsError(
          `invalid number of rooms mentioned. ${command.minRooms} rooms expected, ${message.mentions.rooms.size} found.`
        );
      }
    }

    await command.exec({ message, args, flags });
  } catch (e) {
    if (e instanceof ConfirmationError) {
      await message.channel.send(`No confirmation was received. Command \`${command.name}\` was canceled.`);

      throw e;
    } else {
      await message.channel.send(e.toString());
      await message.client.commands.get("help").exec({ message, args: [command.name] });

      if (!(e instanceof ArgumentsError)) {
        console.error(e);
        console.error(e.stack);
      }

      throw e;
    }
  }
}
