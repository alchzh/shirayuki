import { BaseManager, Collection } from "discord.js";

export function test(conditions) {
  return function _test(thisArg, obj) {
    if (conditions.name && conditions.name !== obj.name) return false;
    if (conditions.type && conditions.type !== obj.type) return false;

    if (conditions.parent) {
      const parent = thisArg.resolve(conditions.parent);
      if (!parent || !obj.parentID || obj.parentID !== parent.id) return false;
    }

    return true;
  };
}

export function register(managerType, propName, condition) {
  const predicate = typeof condition === "function" ? condition : test(condition);

  if (!managerType.prototype.register) managerType.prototype.register = new Collection();
  managerType.prototype.register.set(propName, predicate);
}

BaseManager.prototype.resolveRegistered = function resolveRegistered(propName) {
  if (propName === "everyone") {
    return this.everyone;
  }

  if (!this.register) return null;
  if (!this.registerCache) this.registerCache = new Collection();

  const predicate = this.register.get(propName);
  if (!predicate) return null;

  const existing = this.cache.get(this.registerCache.get(propName));
  if (existing && !existing.deleted && predicate(this, existing)) return existing;

  const newObj = this.cache.find(s => predicate(this, s));
  if (newObj) {
    this.registerCache.set(propName, newObj.id);
  } else {
    this.registerCache.delete(propName);
  }

  return newObj;
};

BaseManager.prototype.resolveRegisteredID = function resolveRegisteredID(propName) {
  const registered = this.resolveRegistered(propName);
  return registered ? registered.id : null;
};

BaseManager.prototype.resolve = function resolve(resolvable) {
  if (resolvable instanceof this.holds) return resolvable;
  if (typeof resolvable === "string") return this.cache.get(resolvable) ?? this.resolveRegistered(resolvable);
  return null;
};

BaseManager.prototype.resolveID = function resolveID(resolvable) {
  if (resolvable instanceof this.holds) return resolvable.id;
  if (typeof resolvable === "string") {
    return this.cache.has(resolvable) ? resolvable : this.resolveRegisteredID(resolvable);
  }
  return null;
};

BaseManager.prototype.resolveRegisterName = function resolveRegisterName(resolvable) {
  if (!this.register) return null;
  if (this.register.has(resolvable)) return resolvable;

  const obj = this.resolve(resolvable);
  return this.register.findKey(predicate => predicate(this, obj));
};

export function registerMany(managerType, props) {
  Object.entries(props).forEach(([propName, condition]) => {
    register(managerType, propName, condition);
  });
}
