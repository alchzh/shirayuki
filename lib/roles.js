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

export function isGeneralRole(role) {
  if (!role) return false;

  return (
    role.id === role.guild.roles.controlRoom.id ||
    role.id === role.guild.roles.staff.id ||
    role.id === role.guild.roles.spectator.id ||
    role.id === role.guild.roles.playerCoach.id
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
