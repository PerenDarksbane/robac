var utils = require('../utils')

/**
 * Creates a mob with its hp, atk, and def based on the user's difficulty and ID
 *
 * @param diff The user's difficulty. String in base16 (hex)
 * @param id The user's ID. String in base16 (hex)
 */
function Mob (diff, id) {
  this.hp = utils.rand(0, diff * parseInt(id, 16))
  this.atk = utils.rand(0, (diff * parseInt(id[0], 16) / 4))
  this.def = utils.rand(0, (diff * parseInt(id[0], 16) / 4))
}

/**
 * Tries to defend the hit.
 *
 * @param atkpts The hit's damage
 * @return `true` if the mob died. `false` otherwise
 */
Mob.prototype.tryDef = function (atkpts) {
  if (this.def <= atkpts) {
    this.hp -= atkpts
    if (this.hp <= 0) return true
  }
  return false
}

/**
 * Generates a hit damage value
 *
 * @return The damage value value
 */
Mob.prototype.tryHit = function () {
  return utils.rand(0, this.atk)
}

module.exports.Mob = Mob
