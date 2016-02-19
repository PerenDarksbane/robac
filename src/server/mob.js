var rand = function (lower, higher) {
  return Math.floor(Math.random() * higher + lower)
}

function Mob (diff, id) {
  this.hp = rand(0, diff * parseInt(id, 16))
  this.atk = rand(0, diff * parseInt(id, 16) / 4)
  this.def = rand(0, diff * parseInt(id, 16) / 4)
}

Mob.prototype.tryDef = function (atkpts) {
  if (this.def <= atkpts) {
    this.hp -= atkpts
    if (this.hp <= 0) return true
  }
  return false
}

Mob.prototype.tryHit = function () {
  return rand(0, this.atk)
}

module.exports.Mob = Mob
