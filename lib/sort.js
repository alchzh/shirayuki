import { Util } from "discord.js";

export const channelSort = Util.discordSort;

export function roleSort(roles) {
  return roles.sorted(
    (a, b) =>
      b.rawPosition - a.rawPosition ||
      Number(a.id.slice(0, -10)) - Number(b.id.slice(0, -10)) ||
      Number(a.id.slice(10)) - Number(b.id.slice(10))
  );
}
