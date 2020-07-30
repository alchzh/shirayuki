/* eslint-disable no-cond-assign */
/* eslint-disable no-underscore-dangle */
import { MessageMentions, Collection } from "discord.js";

const { EVERYONE_PATTERN, USERS_PATTERN, ROLES_PATTERN } = MessageMentions;

export default class MessageMentionsRegex extends MessageMentions {
  constructor(message) {
    const { content } = message;

    const everyone = EVERYONE_PATTERN.test(content);

    super(message, undefined, undefined, everyone);
  }

  get users() {
    if (this._users) return this._users;
    this._users = new Collection();
    let matches;
    while ((matches = USERS_PATTERN.exec(this._content)) !== null) {
      const u = this.client.users.cache.get(matches[1]);
      if (u) this._users.set(u.id, u);
    }
    return this._users;
  }

  // eslint-disable-next-line class-methods-use-this
  set users(value) {}

  get roles() {
    if (this._roles) return this._roles;
    if (!this.guild) return null;
    this._roles = new Collection();
    let matches;
    while ((matches = ROLES_PATTERN.exec(this._content)) !== null) {
      const r = this.guild.roles.cache.get(matches[1]);
      if (r) this._roles.set(r.id, r);
    }
    return this._roles;
  }

  // eslint-disable-next-line class-methods-use-this
  set roles(value) {}
}
