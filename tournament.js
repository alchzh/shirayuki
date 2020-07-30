const Discord = require("discord.js");
// const {GoogleSpreadsheet}  = require('google-spreadsheet');
const parseUrl = require("parse-url");

const client = new Discord.Client();
const config = require("./config.json");


async function finalsRoom(guild, team1, team2) {
  await guild.roles.fetch();
  const staffRole = findRoleByName("Staff");
  const spectatorRole = findRoleByName("Spectator");
  const playerCoachRole = findRoleByName("Player/Coach");

  const teamRoles = guild.roles.cache.filter(
    (role) =>
      !isGeneralRole(role) && !isDefaultRole(role) && role.members.size > 0
  );

  const category = await guild.channels.create("Finals", {
    type: "category",
    position: 3,
  });
  /*
	  await category.updateOverwrite(guild.roles.everyone, {
	  'VIEW_CHANNEL': false
	  });
	  await category.updateOverwrite(staffRole, {
	  'VIEW_CHANNEL':	true
	  });
	  await category.updateOverwrite(spectatorRole, {
	  'VIEW_CHANNEL':	true
	  });
	  await category.updateOverwrite(playerCoachRole, {
	  'VIEW_CHANNEL':	true
	  });
	  */
  const gameText = await guild.channels.create("finals-text", {
    parent: category,
  });
  await gameText.updateOverwrite(spectatorRole, {
    SEND_MESSAGES: false,
  });
  await gameText.updateOverwrite(playerCoachRole, {
    SEND_MESSAGES: false,
  });
  await gameText.updateOverwrite(team1, {
    SEND_MESSAGES: true,
  });
  await gameText.updateOverwrite(team2, {
    SEND_MESSAGES: true,
  });
  const audienceText = await guild.channels.create("finals-audience", {
    parent: category,
  });
  // ideally the team1 and team2 overwrites would override the category playerCoach overwrite, meaning that team1/team2  would be unable to see #finals-audience
  // however, it doesn't seem discord permissions works that way? even if team1/team2 are set to VIEW_CHANNEL: false and playerCoach is set to true, team1/team2 can still see
  // this solution is somewhat hackish
  // it gives every non-team1/team2 team permissions to view and takes away view permissions from the general player/coach role
  // this solution assumes every player is given a team; if that's not the case, it won't work perfectly
  // it's better than letting the teams see the audience chat though; allowing that might result in some form of cheating
  await audienceText.updateOverwrite(team1, {
    VIEW_CHANNEL: false,
  });
  await audienceText.updateOverwrite(team2, {
    VIEW_CHANNEL: false,
  });
  /*
	  await audienceText.updateOverwrite(playerCoachRole, {
	  'VIEW_CHANNEL': false
	  });
	  for (var team of teamRoles) {
	  if (team !== team1 && team !== team2) {
		  await audienceText.updateOverwrite(team, {
		  'VIEW_CHANNEL': true
		  });
	  }
	  }
	  */
  const voice = await guild.channels.create("finals-voice", {
    parent: category,
    type: "voice",
  });
  /*
	  await voice.updateOverwrite(spectatorRole, {
		  'SPEAK': false
	  });
	  await voice.updateOverwrite(playerCoachRole, {
		  'SPEAK': false
	  });
	  */
  return gameText;
} // todo

async function init(guild) {
  // basic setup of the tournament server
  // todo clear all existing stuff in the server
  await guild.setDefaultMessageNotifications("MENTIONS");

  await Promise.all(
    guild.roles.cache
      .filter((role) => !isDefaultRole(role))
      .map((role) => role.delete())
  );
  await Promise.all(guild.channels.cache.map((channel) => channel.delete()));

  const controlRoomRole = await guild.roles.create({
    data: {
      name: "Control Room",
      color: "PURPLE",
      hoist: true,
      permissions: "ADMINISTRATOR",
      mentionable: true,
      position: 1,
    },
  });
  const staffRole = await guild.roles.create({
    data: {
      name: "Staff",
      color: "BLUE",
      hoist: true,
      mentionable: true,
      position: 1,
    },
  });
  const spectatorRole = await guild.roles.create({
    data: {
      name: "Spectator",
      color: "AQUA",
      hoist: true,
      mentionable: true,
      position: 1,
    },
  });
  const playerCoachRole = await guild.roles.create({
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
  await controlRoomCategory.updateOverwrite(staffRole, {
    VIEW_CHANNEL: true,
  });
  const linksChannel = await guild.channels.create("announcements-and-links", {
    parent: controlRoomCategory,
  });
  await linksChannel.updateOverwrite(staffRole, {
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
  const controlRoomVoiceChannel = await guild.channels.create(
    "control-room-voice",
    { parent: controlRoomCategory, type: "voice" }
  );
  const hubCategory = await guild.channels.create("Hub", { type: "category" });
  /*
	  await hubCategory.updateOverwrite(guild.roles.everyone, {
	  'VIEW_CHANNEL': false
	  });
	  await hubCategory.updateOverwrite(staffRole, {
	  'VIEW_CHANNEL': true
	  });
	  await hubCategory.updateOverwrite(spectatorRole, {
	  'VIEW_CHANNEL': true
	  });
	  await hubCategory.updateOverwrite(playerCoachRole, {
	  'VIEW_CHANNEL': true
	  });
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
    } is committed to ensuring that quizbowl is safe, open, and welcoming for everyone. If anyone at this tournament makes you feel unsafe or unwelcome, please do not hesitate to reach out to anyone with the ${controlRoomRole.toString()} or ${staffRole.toString()} roles. In addition, please feel free to make use of the quizbowl misconduct form, a joint effort by PACE, NAQT, ACF, and IAC [https://tinyurl.com/qbmisconduct].`
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
  await honorPledgeCategory.updateOverwrite(staffRole, {
    SEND_MESSAGES: false,
  });
  await honorPledgeCategory.updateOverwrite(spectatorRole, {
    SEND_MESSAGES: false,
  });
  await honorPledgeCategory.updateOverwrite(playerCoachRole, {
    SEND_MESSAGES: false,
  });
  const honorPledgeChannel = guild.channels.create("honor-pledge", {
    parent: honorPledgeCategory,
  });
  await guild.owner.roles.add(controlRoomRole);
  await guild.setDefaultMessageNotifications("MENTIONS");
  await guild.setSystemChannel(generalChannel);
}

function help(channel, sections) {
  sections = sections || [
    "i",
    "c",
    "f",
    "d",
    "n",
    "m",
    "a",
    "r",
    "t",
    "e",
    "h",
  ];
  const helpMessage = {
    color: "#29bb9c", // same as discord aqua
    title: "Tournament Bot Help",
    description:
      "This bot is able to perform initial server setup, create and delete rooms, and add, remove, or transfer teams to and from rooms. It supports both conventional bot-style syntax and natural language-style [NL-style] syntax. Commands acting on existing teams or rooms require you to tag the role of the team you are operating on and/or the text channels representing the rooms you are operating on. Unless otherwise stated, commands can only be run by users with the Control Room or Staff roles. Add --force to the end of your command to override having to confirm.",
    fields: [],
  };
  for (const section of sections) {
    helpMessage.fields.push(helpSections[section]);
  }
  if (sections.length < 9) {
    helpMessage.description = "";
  }
  channel.send({ embed: helpMessage });
}

const schedule = async function (guild, docID, sheetIndex) {
  const doc = new GoogleSpreadsheet(docID);
  await doc.useApiKey(config.apiKey);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[sheetIndex];
  await sheet.loadCells("a1:z26"); // up to 12 rooms and 24 rounds
  const rooms = {}; // key is column index from 0, value is room name
  for (var i = 1; i < 26; i++) {
    // cols B to Z
    const val = sheet.getCell(0, i).value;
    if (val) {
      rooms[i] = {};
      rooms[i].name = val;
      rooms[i].teamsByRound = {};
    }
  }
  const rounds = { inOrder: [] };
  const teams = {};
  for (var i = 1; i < 26; i++) {
    roundName = sheet.getCell(i, 0).value;
    if (!roundName) {
      continue;
    } else {
      rounds[i] = roundName;
      rounds.inOrder.push(i);
    }
    for (let j = 1; j < 26; j++) {
      const roomName = sheet.getCell(0, j).value;
      if (!roomName) {
        continue;
      }
      const val1 = sheet.getCell(i, j).value;
      const val2 = sheet.getCell(i, j + 1).value;
      if (rooms[j] && val1 && val2) {
        rooms[j].teamsByRound[i] = [val1, val2];
      } else if (rooms[j] && val1) {
        rooms[j].teamsByRound[i] = [val1];
      } else {
        break;
      }
      if (teams[val1]) {
        teams[val1].roomsByRound[i] = j;
      } else {
        teams[val1] = {
          roomsByRound: {},
        };
        teams[val1].roomsByRound[i] = j;
      }
      if (teams[val2] && val2) {
        teams[val2].roomsByRound[i] = j;
      } else if (val2) {
        teams[val2] = {
          roomsByRound: {},
        };
        teams[val2].roomsByRound[i] = j;
      } // check if val2 exists because there may be byes
    }
  }
  console.log(rounds);
  for (const team in teams) {
    for (const role of guild.roles.cache.values()) {
      if (team === role.name) {
        teams[team].role = role;
        break;
      }
    }
  }
  for (var room in rooms) {
    for (const channel of guild.channels.cache.values()) {
      if (channel.name === rooms[room].name && channel.type === "category") {
        for (const child of channel.children.values()) {
          if (child.type === "text") {
            rooms[room].channel = child;
            break;
          }
        }
        break;
      }
    }
  }
  for (var room in rooms) {
    if (!rooms[room].channel) {
      continue;
    }
    const roomSchedule = {
      color: "#29bb9c", // same as discord aqua
      title: `Schedule for Room "${rooms[room].name}"`,
      description:
        "Run the commands listed here before/after each round to move teams to the correct room. You can simply copy/paste the commands from this schedule.",
      fields: [],
    };
    var i = 0;
    for (const round in rooms[room].teamsByRound) {
      const t1 = teams[rooms[room].teamsByRound[round][0]];
      const t2 = teams[rooms[room].teamsByRound[round][1]];
      if (!t2) {
        break;
      }
      if (i === 0) {
        roomSchedule.fields.push({
          name: `Before ${rounds[round]}`,
          value: `.a ${t1.role.toString()} ${rooms[
            room
          ].channel.toString()}\n.a ${t2.role.toString()} ${rooms[
            room
          ].channel.toString()}`,
        });
      }
      var nextRound = String(Number(round) + 1);
      try {
        var nextRound =
          rounds.inOrder[rounds.inOrder.indexOf(Number(round)) + 1];
      } catch (e) {} // last round
      const nextRoom1 = Number(t1.roomsByRound[nextRound]);
      const nextRoom2 = Number(t2.roomsByRound[nextRound]);
      let fieldValue = "";
      if (nextRoom1 && rooms[nextRoom1].channel) {
        fieldValue += `.t ${t1.role.toString()} ${rooms[
          room
        ].channel.toString()} ${rooms[nextRoom1].channel.toString()}`;
      } else {
        fieldValue += `.r ${t1.role.toString()} ${rooms[
          room
        ].channel.toString()}`;
      }
      if (nextRoom2 && rooms[nextRoom2].channel) {
        fieldValue += `\n.t ${t2.role.toString()} ${rooms[
          room
        ].channel.toString()} ${rooms[nextRoom2].channel.toString()}`;
      } else {
        fieldValue += `\n.r ${t2.role.toString()} ${rooms[
          room
        ].channel.toString()}`;
      }
      roomSchedule.fields.push({
        name: `After ${rounds[round]}`,
        value: fieldValue,
      });
      i++;
    }
    rooms[room].channel.send({ embed: roomSchedule }).then((message) => {
      message.pin();
    });
  }
};

async function massCreateTeams(guild, prefix, startIndex, endIndex) {
  for (let i = startIndex; i <= endIndex; i++) {
    const name = prefix + String(i);
    let color = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];
    while (color[0] + color[1] + color[2] < 64) {
      color = [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
      ];
    }
    //	console.log(name + ' ' + color[0] + ' ' + color[1] + ' ' + color[2]);
    const teamRole = await guild.roles.create({
      data: {
        name: prefix + String(i),
        color,
        hoist: true,
        mentionable: true,
        position: 2,
      },
    });
    const huddleText = await createRoom(guild, `${name} Huddle`, true);
    await add(teamRole, huddleText.parent);
  }
}

async function setGuildBitrate(bitrate, guild) {
  return Promise.all([
    guild.channels.cache
      .filter((channel) => channel.type === "voice")
      .map((channel) => channel.setBitrate(bitrate * 1000)),
  ]);
}

async function confirm(message, prompt, force, failCallback, successCallback) {
  if (force) {
    message.react("👍");
    successCallback();
    return;
  }

  message.channel.send(prompt).then((msg) => {
    msg.react("👍");
    msg
      .awaitReactions(
        (reaction, user) =>
          reaction.emoji.name === "👍" && user.id === message.author.id,
        { time: 6000 }
      )
      .then((collected) => {
        if (collected.size === 0) {
          failCallback();
        } else {
          successCallback();
        }
      })
      .catch(console.error);
  });
}

async function processCommand(command, message) {
  // var force = command.indexOf('--force') >= 0 ? 1 : 0;
  } else if (
    command.indexOf(".i") === 0 &&
    message.member === message.channel.guild.owner
  ) {
    confirm(
      message,
      "Are you sure you want to initialize the server? Every channel and role currently in the server will be deleted. Confirm by reacting with :thumbsup:.",
      force,
      () => {
        message.channel.send(
          "No confirmation was received. The initialization is cancelled."
        );
      },
      () => {
        init(message.channel.guild, message.channel).catch((e) => {
          console.error(e);
          help(message.channel, ["i"]);
        });
      }
    );
  } else if (
    command.indexOf(".c") === 0 &&
    hasRole(message.member, "Control Room")
  ) {
    try {
      var content = command.substr(command.indexOf(" ") + 1).trim();
      const names = content.split(/["“”]/g);
      if (names.length < 2) {
        help(message.channel, ["c"]);
        return;
      }
      confirm(
        message,
        `Are you sure you want to create the room[s] ${content}? Confirm by reacting with \:thumbsup:.`,
        force,
        () => {
          message.channel.send(
            "No confirmation was received. The creation is cancelled."
          );
        },
        () => {
          for (let i = 1; i < names.length; i += 2) {
            var name = names[i];
            createRoom(message.channel.guild, name)
              .then((textChannel) => {
                // message.channel.send('Room "' + name + '" has been created.');
                message.channel.send(
                  `Room "${textChannel.parent.name}" has been created.`
                );
              })
              .catch((error) => {
                console.error(error);
                message.channel.send(
                  `Room "${name}" could not be created. Please try using a different name.`
                );
                help(message.channel, ["c"]);
              });
          }
        }
      );
    } catch (e) {
      console.error(e);
      help(message.channel, ["c"]);
    }
    /*
		  } else if (command.indexOf('.c') === 0 && hasRole(message.member, 'Control Room')) {
		  // todo add the ability to create multiple rooms at once
		  try {
		  var name = command.substr(command.indexOf(' ') + 1).trim();
		  if (name.length < 90) {
		  confirm(message, 'Are you sure you want to create room "' + name + '"? Confirm by reacting with \:thumbsup:.', function () {
		  message.channel.send('No confirmation was received. The creation is cancelled.');
		  }, function () {
		  createRoom(message.channel.guild, name).then(function (textChannel) {
		  // message.channel.send('Room "' + name + '" has been created.');
		  message.channel.send('Room "' + name + '" has been created.');
		  }).catch(function (error) {
		  console.error(error);
		  message.channel.send('Room "' + name + '" could not be created. Please try using a different name.');
		  help(message.channel, ['c']);
		  });
		  });
		  } else {
		  message.channel.send('The room name must be less than 90 characters.');
		  }
		  } catch (e) {
		  console.error(e);
		  help(message.channel, ['c']);
		  }
		*/
  } else if (
    command.indexOf(".d") === 0 &&
    hasRole(message.member, "Control Room")
  ) {
    try {
      var { channels } = mentions;
      // if (parent.children.length === 2) {
      confirm(
        message,
        "Are you sure you want to delete the specified room[s]? Confirm by reacting with :thumbsup:.",
        force,
        () => {
          message.channel.send(
            "No confirmation was received. The deletion is cancelled."
          );
        },
        () => {
          for (var text of channels) {
            deleteRoom(text)
              .then((name) => {
                message.channel.send(`Room "${name}" has been deleted.`);
              })
              .catch((error) => {
                console.error(error);
                message.channel.send(
                  `Room "${text}" could not be deleted. Please delete it manually.`
                );
                help(message.channel, ["d"]);
              });
          }
        }
      );
      /*
			  } else {
			  help(message.channel);
			  }
			*/
    } catch (e) {
      console.error(e);
      help(message.channel, ["d"]);
    }
  } else if (
    command.indexOf(".f") === 0 &&
    hasRole(message.member, "Control Room")
  ) {
    try {
      const teams = mentions.roles;
      confirm(
        message,
        `Are you sure you want to create a finals room with teams ${teams[0].toString()} and ${teams[1].toString()}? Confirm by reacting with \:thumbsup:.`,
        force,
        () => {
          message.channel.send(
            "No confirmation was received. The creation is cancelled."
          );
        },
        () => {
          finalsRoom(message.channel.guild, teams[0], teams[1])
            .then((textChannel) => {
              // message.channel.send('A finals room has been created');
              message.channel.send("A finals room has been created.");
            })
            .catch((error) => {
              console.error(error);
              message.channel.send(
                "A finals room could not be created. Please create it manually."
              );
              help(message.channel, ["f"]);
            });
        }
      );
    } catch (e) {
      console.error(e);
      help(message.channel, ["f"]);
    }
  } else if (
    command.indexOf(".s") === 0 &&
    hasRole(message.member, "Control Room")
  ) {
    try {
      var content = command.split(/\s+/g);
      const url = parseUrl(content[1]);
      const docID = url.pathname.split("/")[3];
      let sheetIndex = content[2] || Infinity;
      if (sheetIndex === Infinity) {
        sheetIndex = 0;
      }
      confirm(
        message,
        "Are you sure you want to generate room schedules from the specified spreadsheet? Confirm by reacting with :thumbsup:.",
        force,
        () => {
          message.channel.send(
            "No confirmation was received. The schedule generation is cancelled."
          );
        },
        () => {
          schedule(message.channel.guild, docID, sheetIndex)
            .then(() => {
              message.channel.send("A schedule was generated.");
            })
            .catch((error) => {
              console.error(error);
              message.channel.send("The schedule could not be generated.");
              help(message.channel, ["s"]);
            });
        }
      );
    } catch (e) {
      console.error(e);
      help(message.channel, ["s"]);
    }
  } else if (
    command.indexOf(".m") === 0 &&
    hasRole(message.member, "Control Room")
  ) {
    try {
      /*
			  var spaceIndex = command.trim().indexOf(' ');
			  if (spaceIndex === -1) {
			  throw 'No range provided to .m, sending help dialog to channel.';
			  }
			  var range = command.substr(spaceIndex + 1).trim();
			*/
      const range = command.split(/\s+/g)[1];
      confirm(
        message,
        `Are you sure you want to mass create teams from the range ${range}? Confirm by reacting with \:thumbsup:.`,
        force,
        () => {
          message.channel.send(
            "No confirmation was received. The creation is cancelled."
          );
        },
        () => {
          const splitByBracket = range.split("[");
          const prefix = splitByBracket[0];
          const splitByEllipsis = splitByBracket[1].split("...");
          const startIndex = Number(splitByEllipsis[0]);
          const endIndex = Number(
            splitByEllipsis[1].substr(0, splitByEllipsis[1].length - 1)
          );
          massCreateTeams(message.channel.guild, prefix, startIndex, endIndex)
            .then(() => {
              message.channel.send("The teams were created.");
            })
            .catch((error) => {
              console.error(error);
              message.channel.send("The teams could not be created.");
              help(message.channel, ["n", "m"]);
            });
        }
      );
    } catch (e) {
      console.error(e);
      help(message.channel, ["n", "m"]);
    }
  } else if (
    command.indexOf(".b") === 0 &&
    hasRole(message.member, "Control Room")
  ) {
    var bitrate = NaN;
    try {
      var bitrate = Number(command.substring(command.indexOf(" ")));
    } catch (e) {}
    if (!bitrate || bitrate < 8) {
      message.channel.send(
        "An invalid bitrate was specified. Please try again."
      );
    } else {
      confirm(
        message,
        `Are you sure you want to set the bitrate of every voice channel in the server to ${bitrate} kbps? Confirm by reacting with \:thumbsup:.`,
        force,
        () => {
          message.channel.send(
            "No confirmation was received. The server bitrate remains unchanged."
          );
        },
        () => {
          setGuildBitrate(bitrate, message.channel.guild)
            .then(() => {
              message.channel.send(
                `Every voice channel in the server now has a bitrate of ${bitrate} kbps.`
              );
            })
            .catch((error) => {
              console.error(error);
              message.channel.send("The server bitrate could not be changed.");
              help(message.channel, ["b"]);
            });
        }
      );
    }
  } else if (
    command.indexOf(".h") === 0 &&
    (hasRole(message.member, "Control Room") ||
      hasRole(message.member, "Staff"))
  ) {
    help(message.channel);
  } else if (
    command.indexOf(".") === 0 &&
    (hasRole(message.member, "Control Room") ||
      hasRole(message.member, "Staff"))
  ) {
    message.channel.send("Use the `.help` command to get started!");
  }
}

client.on("message", async (message) => {
  const content = message.content.split("\n");
  for (const str of content) {
    await processCommand(str, message);
  }
});

client.login(config.token);
client.on("ready", () => {
  for (const [id, guild] of client.guilds.cache) {
    console.log(`${guild.name} ${guild.owner.user.tag}`);
  }
  client.user
    .setActivity(".help", { type: "LISTENING" })
    .then(() => {
      console.log("up and running!");
    })
    .catch(console.error);
});
