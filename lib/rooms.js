import { Collection } from "discord.js";
import { isTeamRole } from "./roles.js";

export async function updateOverwrites(guildChannel, roles, options, reason) {
  return Promise.all(roles.map(role => guildChannel.updateOverwrite(role, options, reason)));
}

export async function lockPerms(channel) {
  // syncs channel's perms with its parent category
  await channel.lockPermissions();
  await channel.lockPermissions();
  //    await channel.lockPermissions();
  //    await channel.lockPermissions();
}

export function isDefaultRoom(room) {
  if (!room) return false;

  return (
    room.name === "Control Room" ||
    room.name === "Hub" ||
    room.name === "Honor Pledge" ||
    room.name.endsWith(" Huddle")
  );
}

// TODO: Optimize
export function rolesInRoom(room, teamsOnly = true) {
  const teams = new Collection();

  room.guild.roles.cache.each(role => {
    if ((!teamsOnly || isTeamRole(role)) && room.permissionsFor(role).has(["VIEW_CHANNEL", "CONNECT"])) {
      teams.set(role.id, role);
    }
  });

  return teams;
}

export function roomsOfRole(team, noDefault = true) {
  const rooms = new Collection();

  team.guild.channels.cache.each((channel, id) => {
    if (
      channel.type === "category" &&
      (!noDefault || !isDefaultRoom(channel)) &&
      channel.permissionsFor(team).has(["VIEW_CHANNEL", "CONNECT"])
    ) {
      rooms.set(id, channel);
    }
  });

  return rooms;
}

export async function addToRoom(room, ...roles) {
  await updateOverwrites(room, roles, {
    VIEW_CHANNEL: true,
    SEND_MESSAGES: true,
    CONNECT: true,
    ADD_REACTIONS: true,
    USE_EXTERNAL_EMOJIS: true,
    ATTACH_FILES: true,
    EMBED_LINKS: true,
  });
  return Promise.all(room.children.map(lockPerms));
}

export async function removeFromRoom(room, ...roles) {
  await updateOverwrites(room, roles, {
    VIEW_CHANNEL: false,
    SEND_MESSAGES: false,
    CONNECT: false,
    ADD_REACTIONS: false,
    USE_EXTERNAL_EMOJIS: false,
    ATTACH_FILES: false,
    EMBED_LINKS: false,
  });
  return Promise.all(room.children.map(lockPerms));
}

export async function emptyRoom(room) {
  await Promise.all(
    room.permissionOverwrites
      .filter(({ type }, id) => type === "role" && isTeamRole(room.guild.roles.cache.get(id)))
      .map(overwrite => overwrite.delete())
  );

  return Promise.all(room.children.map(lockPerms));
}

export async function createRoom(guild, name, staffSpectatorInvisible = false) {
  const room = await guild.channels.create(name, { type: "category" });

  await room.updateOverwrite(guild.roles.everyone, {
    VIEW_CHANNEL: false,
  });

  if (!staffSpectatorInvisible) {
    await updateOverwrites(room, [guild.roles.staff, guild.roles.spectator], {
      VIEW_CHANNEL: true,
    });
  }

  const cleanName = name.replace(/\s+/g, "-").toLowerCase();

  await Promise.all([
    guild.channels.create(`${cleanName}-text`, {
      parent: room,
    }),
    guild.channels.create(`${cleanName}-voice`, {
      parent: room,
      type: "voice",
    }),
  ]);

  return room;
}

export async function deleteRoom(room) {
  const { name } = room;

  await Promise.all(room.children.map(channel => channel.delete()));
  await room.delete();

  return name;
}
