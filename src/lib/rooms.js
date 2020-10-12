import { Collection } from "discord.js";
import { isTeamRole } from "./roles.js";

export async function lockPerms(channel) {
  // syncs channel's perms with its parent category
  await channel.lockPermissions();
  await channel.lockPermissions();
  //    await channel.lockPermissions();
  //    await channel.lockPermissions();
}

export function isGeneralRoom(room) {
  if (!room) return false;

  return !!room.guild.channels.resolveRegisterName(room) || room.name.endsWith(" Huddle");
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
      (!noDefault || !isGeneralRoom(channel)) &&
      channel.permissionsFor(team).has(["VIEW_CHANNEL", "CONNECT"])
    ) {
      rooms.set(id, channel);
    }
  });

  return rooms;
}

export async function addToRoom(room, ...roles) {
  await room.updateOverwrites(roles, {
    VIEW_CHANNEL: true,
    SEND_MESSAGES: true,
    CONNECT: true,
    ADD_REACTIONS: true,
    USE_EXTERNAL_EMOJIS: true,
    ATTACH_FILES: true,
    EMBED_LINKS: true,
  });

  await Promise.all(room.children.map(lockPerms));

  return room;
}

export async function removeFromRoom(room, ...roles) {
  await room.updateOverwrites(roles, {
    VIEW_CHANNEL: false,
    SEND_MESSAGES: false,
    CONNECT: false,
    ADD_REACTIONS: false,
    USE_EXTERNAL_EMOJIS: false,
    ATTACH_FILES: false,
    EMBED_LINKS: false,
  });

  await Promise.all(room.children.map(lockPerms));

  return room;
}

export async function emptyRoom(room) {
  await Promise.all(
    room.permissionOverwrites
      .filter(({ type }, id) => type === "role" && isTeamRole(room.guild.roles.cache.get(id)))
      .map(overwrite => overwrite.delete())
  );

  await Promise.all(room.children.map(lockPerms));

  return room;
}

export async function createRoom(guild, name, staffSpectatorInvisible = false) {
  const room = await guild.channels.create(name, { type: "category" });

  await room.updateOverwrite("everyone", {
    VIEW_CHANNEL: false,
  });

  if (!staffSpectatorInvisible) {
    await room.updateOverwrites(["staff", "spectator"], {
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

export async function renameRoom(room, newName) {
  const cleanNewName = newName.replace(/\s+/g, "-").toLowerCase();
  const textChannel = room.children.find(channel => channel.type === "text");
  const voiceChannel = room.children.find(channel => channel.type === "voice");

  await Promise.all([
    room.setName(newName),
    textChannel.setName(`${cleanNewName}-text`),
    voiceChannel.setName(`${cleanNewName}-voice`),
  ]);

  await room.guild.fetch();

  return room;
}
