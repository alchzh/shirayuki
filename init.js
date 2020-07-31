/* eslint-disable no-unused-vars */
import { isDefaultRole } from "./lib/roles.js";
import serverTemplate from "./serverTemplate.js";

export default async function init(guild) {
  // basic setup of the tournament server
  // todo clear all existing stuff in the server

  // Teardown
  await Promise.all([
    ...guild.roles.cache.filter(role => !isDefaultRole(role)).map(role => role.delete()),
    ...guild.channels.cache.map(channel => channel.delete()),
  ]);

  // Build roles from template
  for (const roleData of Object.values(serverTemplate.roles)) {
    await guild.roles.create({
      data: {
        hoist: true,
        mentionable: true,
        position: 1,
        ...roleData,
      },
    });
  }

  // Build channels from template
  for (const { name, parent, overwrites, ...channelData } of Object.values(serverTemplate.channels)) {
    const channel = await guild.channels.create(name, { parent: guild.channels[parent], ...channelData });
    if (overwrites) {
      await Promise.all(overwrites.map(([roles, overwrite]) => channel.updateOverwrites(roles, overwrite)));
    }
  }

  await Promise.all([
    guild.channels.announcementsText.send(
      `${guild.name} is committed to ensuring that quizbowl is safe, open, and welcoming for everyone. If anyone at this tournament makes you feel unsafe or unwelcome,` +
        `please do not hesitate to reach out to anyone with the ${guild.roles.controlRoom.toString()} or ${guild.roles.staff.toString()} roles. In addition, please feel` +
        `free to make use of the quizbowl misconduct form, a joint effort by PACE, NAQT, ACF, and IAC [https://tinyurl.com/qbmisconduct].`
    ),
    guild.owner.roles.add(guild.roles.controlRoom),
    guild.setDefaultMessageNotifications("MENTIONS"),
    guild.setSystemChannel(guild.channels.generalText),
  ]);
}
