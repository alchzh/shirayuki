import { ArgumentsError, confirm, ConfirmationError } from "../lib/commands.js";
import { findRoleByName } from "../lib/roles.js";
import {
  createType2Room, findRoomByName
} from "../lib/rooms.js";
import { createTeam } from "../lib/teams.js";

const CODE_BLOCK_REGEX = /```(.*)```/s;

export const schedule = {
  name: "schedule",
  shortdesc: "Build game rooms off of schedule",
  description: "This is a hack made for ARCADIA at Columbia 2022",
  aliases: ["s"],
  permLevel: 4,
  exec: async function execSchedule({ message, flags }) {
    const scheduleTableRaw = message.content.match(CODE_BLOCK_REGEX)?.[1];
    console.log(message.content);
    if (scheduleTableRaw == null) {
      throw new ArgumentsError(`Schedule must be put in a code block.`);
    }

    const [scheduleRooms, ...scheduleRounds] = scheduleTableRaw.split("\n").map(line => line.split("    "));

    const rooms = {};
    const newRooms = [];
    const hasRoundNames = scheduleRooms[0].length === 0;
    for (let i = +hasRoundNames; i < scheduleRooms.length; i++) {
      const name = scheduleRooms[i]
      const room = findRoomByName(message.channel.guild, name);
      if (room) {
        rooms[name] = room;
      } else {
        newRooms.push(name);
      }
    }

    if (newRooms.length > 0) {
      await confirm(
        message,
        `Are you sure you want to create the room(s) \`${newRooms.join("`, `")}\`?`,
        flags.force
      );

      for (const name of newRooms) {
        rooms[name] = await createType2Room(message.channel.guild, name);
      }
    }

    const teams = {};

    const getTeam = async name => {
      if (!name || name.length === 0) {
        return null
      }

      const team = findRoleByName(message.channel.guild, name);
      if (team) {
        return team;
      }

      try {
        await confirm(
          message,
          `Do you want to create the team \`${name}\`?`,
          flags.force
        );
      } catch (e) {
        if (e instanceof ConfirmationError) {
          return null;
        } else {
          throw e;
        }
      }

      return await createTeam(message.channel.guild, name);
    }

    for (let i = 0; i < scheduleRounds.length; i += 2) {
      const roundName = hasRoundNames ? scheduleRounds[i][0] : "Round " + (i / 2 + 1);

      const promises = [];
      for (let j = +hasRoundNames; j < scheduleRooms.length; j++) {
        const roomName = scheduleRooms[j];
        const room = rooms[roomName];

        const permissionOverwrites = [
          {
            id: 'everyone',
            deny: ['VIEW_CHANNEL'],
          },
          {
            id: 'playerCoach',
            deny: ['VIEW_CHANNEL'],
          },
          {
            id: 'staff',
            allow: ['VIEW_CHANNEL'],
          }
        ]

        const team1Name = scheduleRounds[i][j];
        const team1 = teams[team1Name] ?? (teams[team1Name] = await getTeam(team1Name));
        if (team1) {
          permissionOverwrites.push({
            id: team1.id,
            allow: ['VIEW_CHANNEL']
          })
        }
        const team2Name = scheduleRounds[i+1][j];
        const team2 = teams[team2Name] ?? (teams[team2Name] = await getTeam(team2Name));
        if (team2) {
          permissionOverwrites.push({
            id: team2.id,
            allow: ['VIEW_CHANNEL']
          })
        }

        const cleanName = `${roomName}-${roundName}`.replace(/\s+/g, "-").toLowerCase();

        promises.push(
          message.channel.guild.channels.create(cleanName, {
            parent: room,
            permissionOverwrites
          })
        )
      }

      await Promise.all(promises);
    }

    // await confirm(
    //   message,
    //   `Are you sure you want to add team(s) ${roles.array().join(", ")} to room \`${room.name}\`?`,
    //   flags.force
    // );

    // await addToRoom(room, ...roles.array());
  },
};
