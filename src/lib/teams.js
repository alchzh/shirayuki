import { createRoom, addToRoom, deleteRoom, renameRoom } from "./rooms.js";

// eslint-disable-next-line import/prefer-default-export
export async function createTeam(guild, name) {
  const color = guild.colorGenerator.next().value;

  const teamRole = await guild.roles.create({
    data: {
      name,
      color,
      hoist: true,
      mentionable: true,
      position: 2,
    },
  });

  const huddleRoom = await createRoom(guild, `${name} Huddle`, true);
  await addToRoom(huddleRoom, teamRole);

  return teamRole;
}

function huddleOf(team) {
  return team.guild.channels.cache.find(
    c =>
      c.type === "category" &&
      c.name.toLowerCase() === `${team.name.toLowerCase()} huddle` &&
      team.permissionsIn(c).has(["VIEW_CHANNEL", "CONNECT"])
  );
}

export async function deleteTeam(team) {
  const huddle = huddleOf(team);

  await team.delete();
  if (huddle) await deleteRoom(huddle);
}

export async function renameTeam(team, newName) {
  const huddle = huddleOf(team);

  await Promise.all([team.setName(newName), huddle ? renameRoom(huddle, `${newName} Huddle`) : null]);
  await team.guild.fetch();

  return team;
}
