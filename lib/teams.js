import { createRoom, addToRoom, deleteRoom } from "./rooms.js";

// eslint-disable-next-line import/prefer-default-export
export async function createTeam(guild, name) {
  let color;
  do {
    color = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];
  } while (color[0] + color[1] + color[2] < 128 || color[0] + color[1] + color[2] > 576);

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

export async function deleteTeam(team) {
  const category = team.guild.channels.cache.find(
    c =>
      c.type === "category" &&
      c.name.toLowerCase() === `${team.name.toLowerCase()} huddle` &&
      team.permissionsIn(c).has(["VIEW_CHANNEL", "CONNECT"])
  );

  await team.delete();
  if (category) await deleteRoom(category);
}
