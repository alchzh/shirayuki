/* eslint-disable no-unused-vars */
import { isDefaultRole, updateOverwrites, reloadRoles } from "./lib/roles.js";

export default async function init(guild) {
  // basic setup of the tournament server
  // todo clear all existing stuff in the server
  await guild.setDefaultMessageNotifications("MENTIONS");

  await Promise.all(guild.roles.cache.filter(role => !isDefaultRole(role)).map(role => role.delete()));
  await Promise.all(guild.channels.cache.map(channel => channel.delete()));

  guild.roles.controlRoom = await guild.roles.create({
    data: {
      name: "Control Room",
      color: "PURPLE",
      hoist: true,
      permissions: "ADMINISTRATOR",
      mentionable: true,
      position: 1,
    },
  });
  guild.roles.staff = await guild.roles.create({
    data: {
      name: "Staff",
      color: "BLUE",
      hoist: true,
      mentionable: true,
      position: 1,
    },
  });
  guild.roles.spectator = await guild.roles.create({
    data: {
      name: "Spectator",
      color: "AQUA",
      hoist: true,
      mentionable: true,
      position: 1,
    },
  });
  guild.roles.playerCoach = await guild.roles.create({
    data: {
      name: "Player/Coach",
      color: "RED",
      hoist: true,
      mentionable: true,
      position: 1,
    },
  });

  const controlRoomCategory = await guild.channels.create("Control Room", {
    type: "category",
  });
  await controlRoomCategory.updateOverwrite(guild.roles.everyone, {
    VIEW_CHANNEL: false,
  });
  await controlRoomCategory.updateOverwrite(guild.roles.staff, {
    VIEW_CHANNEL: true,
  });

  const linksChannel = await guild.channels.create("announcements-and-links", {
    parent: controlRoomCategory,
  });
  await linksChannel.updateOverwrite(guild.roles.staff, {
    SEND_MESSAGES: false,
  });
  /*
		var packetsChannel = await guild.channels.create('packets', {parent: controlRoomCategory});
		await packetsScoresheetsChannel.updateOverwrite(staffRole, {
		'SEND_MESSAGES': false
		});
	  */
  const protestsChannel = await guild.channels.create("protests", {
    parent: controlRoomCategory,
  });
  const botCommandsChannel = await guild.channels.create("bot-commands", {
    parent: controlRoomCategory,
  });
  const controlRoomChannel = await guild.channels.create("control-room", {
    parent: controlRoomCategory,
  });
  const controlRoomVoiceChannel = await guild.channels.create("control-room-voice", {
    parent: controlRoomCategory,
    type: "voice",
  });

  const hubCategory = await guild.channels.create("Hub", { type: "category" });
  /*
	  await updateOverwrites(
      hubCategory,
      [guild.roles.everyone, guild.roles.staff. guild.roles.spectator, guild.roles.playerCoach],
      {'VIEW_CHANNEL': false});
  */
  // control room has implicit permissions
  const announcementsChannel = await guild.channels.create("announcements", {
    parent: hubCategory,
  });
  await announcementsChannel.updateOverwrite(guild.roles.everyone, {
    SEND_MESSAGES: false,
  });
  announcementsChannel.send(
    `${
      guild.name
    } is committed to ensuring that quizbowl is safe, open, and welcoming for everyone. If anyone at this tournament makes you feel unsafe or unwelcome, please do not hesitate to reach out to anyone with the ${guild.roles.controlRoom.toString()} or ${guild.roles.staff.toString()} roles. In addition, please feel free to make use of the quizbowl misconduct form, a joint effort by PACE, NAQT, ACF, and IAC [https://tinyurl.com/qbmisconduct].`
  );
  const generalChannel = await guild.channels.create("general", {
    parent: hubCategory,
  });
  const hallwayVoiceChannel = await guild.channels.create("hallway-voice", {
    parent: hubCategory,
    type: "voice",
  });
  // todo set hub permissions

  const honorPledgeCategory = await guild.channels.create("Honor Pledge", {
    type: "category",
  });
  await updateOverwrites(
    honorPledgeCategory,
    [guild.roles.staff, guild.roles.spectator, guild.roles.playerCoach],
    { SEND_MESSAGES: false }
  );
  const honorPledgeChannel = guild.channels.create("honor-pledge", {
    parent: honorPledgeCategory,
  });

  await guild.owner.roles.add(guild.roles.controlRoom);
  await guild.setDefaultMessageNotifications("MENTIONS");
  await guild.setSystemChannel(generalChannel);
  await reloadRoles(guild);
}
