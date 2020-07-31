import { BaseManager } from "discord.js";

export function test(conditions) {
  return function _test(obj) {
    if (conditions.name && conditions.name !== obj.name) return false;
    if (conditions.type && conditions.type !== obj.type) return false;

    if (conditions.parent) {
      const parent = this[conditions.parent];
      if (!parent || !obj.parentID || obj.parentID !== parent.id) return false;
    }

    return true;
  };
}

BaseManager.prototype.resolve = function resolve(resolvable) {
  if (resolvable instanceof this.holds) return resolvable;
  if (typeof resolvable === "string") return this.cache.get(resolvable) ?? this.resolveRegistered(resolvable);
  return null;
};

BaseManager.prototype.resolveID = function resolve(resolvable) {
  if (resolvable instanceof this.holds) return resolvable.id;
  if (typeof resolvable === "string") {
    if (this.cache.has(resolvable)) return resolvable;

    const registered = this.resolveRegistered(resolvable);
    if (registered) return registered.id;
  }
  return null;
};

BaseManager.prototype.resolveRegistered = function resolveRegistered(propName) {
  const tryDirect = this[propName];
  return tryDirect instanceof this.holds ? tryDirect : null;
};

export function register(manager, propName, condition) {
  const predicate = typeof condition === "function" ? condition : test(condition);

  Object.defineProperty(manager.prototype, propName, {
    get() {
      if (!this.registerCache) this.registerCache = {};
      const existing = this.cache.get(this.registerCache[propName]);
      if (existing && predicate.call(this, existing)) return existing;

      const newObj = this.cache.find(predicate.bind(this));
      this.registerCache[propName] = newObj;
      return newObj;
    },
  });
}

export function registerMany(manager, props) {
  Object.entries(props).forEach(([propName, condition]) => {
    register(manager, propName, condition);
  });
}
