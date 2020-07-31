import { confirm } from "../lib/commands.js";

import init from "../init.js";

const initCommand = {
  name: "init",
  shortdesc: "Initalize Server",
  description:
    "This command __deletes every preexisting channel and role in the server__ and replaces them with a predetermined tournament server skeleton. The Tournament Bot role needs to be the highest in the server for this command to run properly. This command can only be run by the server owner.\nExample bot-style usage: `.i`\nExample NL-style usage: `.initialize-server`",
  aliases: ["i", "initialize", "initialize-server"],
  permLevel: 4,
  exec: async function execInit({ message, flags }) {
    await confirm(
      message,
      "Are you sure you want to initialize the server? Every channel and role currently in the server will be deleted.",
      flags.force
    );

    await init(message.guild);
  },
};

export { initCommand as init };
