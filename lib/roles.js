export async function updateOverwrites(guildChannel, roles, options, reason) {
  return Promise.all(roles.map(role => guildChannel.updateOverwrite(role, options, reason)));
}

export function findRoleByName(guild, roleName) {
  return guild.roles.cache.find(role => role.name === roleName);
}

export function getPermissionLevel(member) {
  if (member === member.guild.owner || member.hasPermission("ADMINISTRATOR")) {
    return 5;
  }

  if (member.roles.cache.has(member.guild.roles.controlRoom.id)) {
    return 4;
  }

  if (member.roles.cache.has(member.guild.roles.staff.id)) {
    return 3;
  }

  if (member.roles.cache.has(member.guild.roles.playerCoach.id)) {
    return 2;
  }

  if (member.roles.cache.has(member.guild.roles.spectator.id)) {
    return 2;
  }

  return 0;
}

export async function reloadRoles(guild) {
  await guild.roles.fetch();

  guild.roles.controlRoom = findRoleByName(guild, "Control Room");
  guild.roles.staff = findRoleByName(guild, "Staff");
  guild.roles.spectator = findRoleByName(guild, "Spectator");
  guild.roles.playerCoach = findRoleByName(guild, "Player/Coach");
}

export function isGeneralRole(role) {
  if (!role) return false;

  return (
    role === role.guild.roles.controlRoom ||
    role === role.guild.roles.staff ||
    role === role.guild.roles.spectator ||
    role === role.guild.roles.playerCoach
  );
}

export function isDefaultRole(role) {
  if (!role) return false;

  return (
    role === role.guild.roles.everyone ||
    role.name === "Tournament Bot" ||
    role.name === "Shirayuki" ||
    role.name === "Yuki" ||
    role.name === "Server Booster"
  );
}

export function isTeamRole(role) {
  if (!role) return false;

  return !isGeneralRole(role) && !isDefaultRole(role);
}
