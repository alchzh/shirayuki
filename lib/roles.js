export function findRoleByName(guild, roleName) {
  return guild.roles.cache.find(role => role.name === roleName);
}

export function getPermissionLevel(member) {
  if (member === member.guild.owner || member.hasPermission("ADMINISTRATOR")) {
    return 5;
  }

  if (member.roles.cache.has(member.guild.roles.resolveID("controlRoom"))) {
    return 4;
  }

  if (member.roles.cache.has(member.guild.roles.resolveID("staff"))) {
    return 3;
  }

  if (member.roles.cache.has(member.guild.roles.resolveID("playerCoach"))) {
    return 2;
  }

  if (member.roles.cache.has(member.guild.roles.resolveID("spectator"))) {
    return 1;
  }

  return 0;
}

export function isGeneralRole(role) {
  if (!role) return false;

  return !!role.guild.roles.resolveRegisterName(role);
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
