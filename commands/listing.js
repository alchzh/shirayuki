import { roleSort, channelSort } from "../lib/sort.js";
import { isTeamRole } from "../lib/roles.js";
import { roomsOfRole, rolesInRoom, isGeneralRoom } from "../lib/rooms.js";

// TODO: Clean up and make these two messy commands DRYer
export const locate = {
  name: "locate",
  shortdesc: "Locate Team in Rooms",
  description:
    "If no teams specified, will locate all teams. Using the `--all-roles` flag will show all roles. Using the `--all-rooms` flag will show all rooms (not only game rooms).\nExample usage: `.locate @A1`\nExample usage: `.find @A1`",
  aliases: ["find", "where"],
  permLevel: 3,
  exec: async function execList({ message, flags }) {
    const allRoles = flags.allRoles || flags.all;
    const allRooms = flags.allRooms || flags.all;

    const roles = message.mentions.roles.size
      ? message.mentions.roles
      : roleSort(message.guild.roles.cache.filter(allRoles ? _ => true : isTeamRole));

    let messageBuffer = "";
    roles.each(role => {
      const rooms = channelSort(roomsOfRole(role, !allRooms));
      if (rooms.size) {
        // eslint-disable-next-line prettier/prettier
        messageBuffer += `Role ${role} is in room(s) \`${rooms.map(room => room.name).join("`, `")}\`.\n`;
      } else {
        messageBuffer += `Role ${role} is in no rooms.\n`;
      }
    });

    return message.channel.send({
      embed: {
        color: message.client.config.embedColor || "WHITE",
        title: "Locate",
        description: messageBuffer,
      },
    });
  },
};

export const list = {
  name: "list",
  shortdesc: "List Teams in Room(s)",
  description:
    "If no rooms specified, will list all game rooms. Using the `--all-roles` flag will show all roles. Using the `--all-rooms` flag will show all rooms (not only game rooms).\nExample bot-style usage: `.ls #room-1-text`\nExample NL-style usage: `.list-teams in #room-1-text`",
  aliases: ["ls", "list-teams"],
  permLevel: 3,
  minRooms: 0,
  exec: async function execList({ message, flags }) {
    const allRoles = flags.allRoles || flags.all;
    const allRooms = flags.allRooms || flags.all;

    const rooms = message.mentions.rooms.size
      ? message.mentions.rooms
      : channelSort(
          message.guild.channels.cache.filter(
            channel => channel.type === "category" && (allRooms || !isGeneralRoom(channel))
          )
        );

    let messageBuffer = "";
    rooms.forEach(room => {
      const roles = roleSort(rolesInRoom(room, !allRoles));

      if (roles.size) {
        // eslint-disable-next-line prettier/prettier
        messageBuffer += `Room \`${room.name}\` has ${allRoles ? "roles" : "teams"} ${roles
          .array()
          .join(", ")}.\n`;
      } else {
        messageBuffer += `Room \`${room.name}\` has no ${allRoles ? "roles" : "teams"}\n`;
      }
    });

    return message.channel.send({
      embed: {
        color: message.client.config.embedColor || "WHITE",
        title: "List",
        description: messageBuffer,
      },
    });
  },
};
