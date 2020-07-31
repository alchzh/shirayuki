import { GuildChannel } from "discord.js";

GuildChannel.prototype.updateOverwrites = function updateOverwrites(roles, options, reason) {
  if (roles && typeof roles.map === "function") {
    return Promise.all(roles.map(role => this.updateOverwrite(role, options, reason)));
  }

  return this.updateOverwrite(roles, options, reason);
};
