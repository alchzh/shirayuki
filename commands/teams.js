import { ArgumentsError, confirm } from "../lib/commands.js";
import { createTeam, deleteTeam } from "../lib/teams.js";
import { isTeamRole } from "../lib/roles.js";

const rangePattern = /^(\w+)\[([0-9]+)\.\.\.([0-9]+)\]$/;

export const massCreateTeams = {
  name: "mass-create-teams",
  shortdesc: "Mass Create Teams",
  description:
    "Specify a prefix and a range of numbers using this notation: `Prefix[Start...End]`. The bot will automatically create roles for each number in the specified ranges and randomly assign colors.\nExample bot-style usage: `.m A[1...8] B[1...8]`\nExample NL-style usage: `.mass-create-teams A[1...8] B[1...8]`",
  aliases: ["m"],
  permLevel: 4,
  minArgs: 1,
  exec: async function execMassCreateTeams({ message, args, flags }) {
    const ranges = args.map(RegExp.prototype.exec, rangePattern);

    let totalTeams = 0;

    for (const range of ranges) {
      if (range === null) {
        throw new ArgumentsError(`invalid range format ${range}`);
      }

      totalTeams += Number(range[3]) - Number(range[2]) + 1;
    }

    const possibleChannels = 500 - message.guild.channels.cache.size;
    if (totalTeams * 3 > possibleChannels) {
      throw new ArgumentsError(
        `cannot create ${totalTeams} teams because of Discord's 500 channel limit. ` +
          // eslint-disable-next-line radix
          `${parseInt(possibleChannels / 3)} teams are possible`
      );
    }

    await confirm(
      message,
      `Are you sure you want to mass create teams from the ranges \`${args.join("`, `")}\`?`,
      flags.force
    );

    for (const range of ranges) {
      const start = Number(range[2]);
      const end = Number(range[3]);

      for (let i = start; i <= end; i++) {
        await createTeam(message.guild, `${range[1]}${i}`);
      }
    }
  },
};

const createTeamCommand = {
  name: "create-team",
  shortdesc: "Create team(s) by name",
  description:
    'Creates team(s) with the specified name(s).\nExample bot-style usage: `.ct "A1" "A2"`\nExample NL-style usage: `.create-team "A1" A2"`',
  aliases: ["ct", "create-teams", "nt", "new-team", "new-teams"],
  permLevel: 4,
  minArgs: 1,
  exec: async function execCreateTeam({ message, args, flags }) {
    await confirm(
      message,
      `Are you sure you want to create the team(s) \`${args.join("`, `")}\`?`,
      flags.force
    );
    for (const name of args) {
      await createTeam(message.channel.guild, name);
    }
  },
};
export { createTeamCommand as createTeam };

const deleteTeamCommand = {
  name: "delete-team",
  shortdesc: "Delete team(s) by name",
  description: "Example bot-style usage: `.dt @A1 @A2`\nExample NL-style usage: `.delete-teams @A1 @A2`",
  aliases: ["dt", "delete-teams"],
  permLevel: 4,
  minTeams: 1,
  exec: async function execCreateTeam({ message, flags }) {
    const teams = message.mentions.roles.filter(team => isTeamRole(team));
    await confirm(
      message,
      `Are you sure you want to delete team(s) ${teams.array().join(", ")}?`,
      flags.force
    );

    await Promise.all(teams.map(team => deleteTeam(team)));
  },
};
export { deleteTeamCommand as deleteTeam };
