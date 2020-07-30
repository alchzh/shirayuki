import { confirm } from "../lib/commands.js";
import { reloadRoles } from "../lib/roles.js";
import {
  addToRoom,
  removeFromRoom,
  emptyRoom,
  createRoom,
  deleteRoom,
  updateOverwrites,
  isDefaultRoom,
} from "../lib/rooms.js";
import { channelSort } from "../lib/sort.js";

export const add = {
  name: "add",
  shortdesc: "Add Team(s) to Room",
  description: "Example bot-style usage: `.a @A2 #room-1`\nExample NL-style usage: `.add @A2 to #room-1`",
  aliases: ["a"],
  permLevel: 3,
  minRoles: 1,
  minRooms: 1,
  exec: async function execAdd({ message, flags }) {
    const { roles, rooms } = message.mentions;
    const room = rooms.first();

    await confirm(
      message,
      `Are you sure you want to add team(s) ${roles.array().join(", ")} to room \`${room.name}\`?`,
      flags.force
    );

    return addToRoom(room, ...roles.array());
  },
};

export const remove = {
  name: "remove",
  shortdesc: "Remove Team(s) from Room",
  description:
    "Example bot-style usage: `.r @A2 #room-1`\nExample NL-style usage: `.remove @A2 from #room-1`",
  aliases: ["r", "rm"],
  permLevel: 3,
  minRoles: 1,
  minRooms: 1,
  exec: async function execRemove({ message, flags }) {
    const { roles, rooms } = message.mentions;
    const room = rooms.first().parent;

    await confirm(
      message,
      `Are you sure you want to remove team(s) ${roles.array().join(", ")} from room \`${room.name}\`?`,
      flags.force
    );

    return removeFromRoom(room, ...roles.array());
  },
};

export const transfer = {
  name: "transfer",
  shortdesc: "Transfer Team(s) between Rooms",
  description:
    "This command requires you to tag two channels; tag the room that you are transferring the team __from__ first, and tag the channel that you are transferring the team __to__ second.\nExample bot-style usage: `.t @A2 #room-1 #room-3`\nExample NL-style usage: `.transfer @A2 from #room-1 to #room-3`",
  aliases: ["t", "move", "mv"],
  permLevel: 3,
  minRoles: 1,
  minRooms: 2,
  exec: async function execTransfer({ message, flags }) {
    const role = message.mentions.roles.first();
    const [from, to] = message.mentions.rooms.first(2);

    await confirm(
      message,
      `Are you sure you want to transfer team ${role} from room \`${from.name}\` to \`${to.name}\`?`,
      flags.force
    );

    return Promise.all([removeFromRoom(from, role), addToRoom(to, role)]);
  },
};

export const empty = {
  name: "empty",
  shortdesc: "Empty Room(s)",
  description:
    "This command removes all teams from a given room (or multiple). If no rooms specified, empties all rooms.\nExample bot-style usage: `.e #room-1`\nExample NL-style usage: `.empty #room-1`",
  aliases: ["e", "clear"],
  permLevel: 4,
  minRooms: 0,
  exec: async function execEmpty({ message, flags }) {
    const rooms = message.mentions.rooms.size
      ? message.mentions.rooms
      : channelSort(
          message.guild.channels.cache.filter(
            channel => channel.type === "category" && !isDefaultRoom(channel)
          )
        );

    await confirm(
      message,
      `Are you sure you want to empty room(s) \`${rooms.map(room => room.name).join("`, `")}\`?`,
      flags.force
    );

    return Promise.all(rooms.map(room => emptyRoom(room)));
  },
};

export const create = {
  name: "create",
  shortdesc: "Create Room(s)",
  description:
    'Room names must be less than 90 characters long. Surround the room names with double quotation marks. If you want to create multiple rooms at a time, separate the room names with spaces. \nExample bot-style usage: `.c "Room 1" "Room 2"`\nExample NL-style usage: `.create "Room 1" "Room 2"`',
  aliases: ["c", "create-room", "create-rooms"],
  permLevel: 4,
  minArgs: 1,
  exec: async function execCreate({ message, args, flags }) {
    await confirm(
      message,
      `Are you sure you want to create the room(s) \`${args.join("`, `")}\`?`,
      flags.force
    );

    for (const name of args) {
      await createRoom(message.channel.guild, name);
    }
  },
};

const deleteCommand = {
  name: "delete",
  shortdesc: "Delete Room(s)",
  description:
    "This command can only be run by users with the Control Room role.\nExample bot-style usage: `.d #room-1`\nExample NL-style usage: `.delete Room 1`",
  aliases: ["d", "del", "delete-room", "delete-rooms"],
  permLevel: 4,
  minRooms: 1,
  exec: async function execDelete({ message, flags }) {
    const { rooms } = message.mentions;

    await confirm(
      message,
      `Are you sure you want to delete room(s) \`${rooms.map(room => room.name).join("`, `")}\`?`,
      flags.force
    );

    return Promise.all(rooms.map(room => deleteRoom(room)));
  },
};

export { deleteCommand as delete };

export const createFinals = {
  name: "create-finals",
  shortdesc: "Create Finals Room",
  description:
    "This command creates a special finals room that contains a channel for the playing teams to type in and a channel for everyone else to comment in. The command requires you to tag the two teams who are competing in the finals. Teams cannot be added or removed from a finals room. This command can only be run by users with the Control Room role.\nExample bot-style usage: `.f @A2 @B1`\nExample NL-style usage: `.finals @A2 and @B1`",
  aliases: ["f", "finals"],
  permLevel: 4,
  minTeams: 2,
  exec: async function execCreateFinals({ message, flags }) {
    const { guild } = message;
    const [team1, team2] = message.mentions.teams.first(2);

    await confirm(
      message,
      `Are you sure you want to create the finals room ${team1} vs ${team2}?`,
      flags.force
    );

    await reloadRoles(guild);

    const { everyone, staff, spectator, playerCoach } = guild.roles;

    /*
    const otherTeams = guild.roles.cache.filter(
      role =>
        !isGeneralRole(role) &&
        !isDefaultRole(role) &&
        role !== team1 &&
        role !== team2 &&
        role.members.size > 0
    );
    */

    const room = await guild.channels.create("Finals", {
      type: "category",
      position: 3,
    });

    const [gameText, audienceText] = await Promise.all([
      guild.channels.create("finals-text", {
        parent: room,
      }),

      guild.channels.create("finals-audience", {
        parent: room,
      }),

      guild.channels.create("finals-voice", {
        parent: room,
        type: "voice",
      }),
    ]);

    await Promise.all([
      // Room Permissions
      room.updateOverwrite(everyone, {
        VIEW_CHANNEL: false,
      }),
      updateOverwrites(room, [staff, spectator, playerCoach], {
        VIEW_CHANNEL: true,
      }),

      // Text Channel Permissions
      updateOverwrites(gameText, [spectator, playerCoach], {
        SEND_MESSAGES: false,
      }),
      updateOverwrites(gameText, [team1, team2], {
        SEND_MESSAGES: true,
      }),

      // Audience Permissions
      // ideally the team1 and team2 overwrites would override the category playerCoach overwrite, meaning that team1/team2  would be unable to see #finals-audience
      // however, it doesn't seem discord permissions works that way? even if team1/team2 are set to VIEW_CHANNEL: false and playerCoach is set to true, team1/team2 can still see
      // this solution is somewhat hackish
      // it gives every non-team1/team2 team permissions to view and takes away view permissions from the general player/coach role
      // this solution assumes every player is given a team; if that's not the case, it won't work perfectly
      // it's better than letting the teams see the audience chat though; allowing that might result in some form of cheating
      updateOverwrites(audienceText, [team1, team2 /* , playerCoach */], {
        VIEW_CHANNEL: false,
      }),
      /*
      updateOverwrites(audienceText, otherTeams, {
        VIEW_CHANNEL: true,
      }),
      */

      // Voice Permissions
      /*
      updateOverwrites(voice, [spectator, playerCoach], {
        VIEW_CHANNEL: false,
      }),
      */
    ]);
  },
};
