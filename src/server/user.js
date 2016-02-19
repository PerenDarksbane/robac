/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Plankp T.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var utils = require('../utils')
var Mob = require('./mob').Mob

/**
 * Creates a new user. Sets cash to 0, difficulty to 2, atk and def to 10, and
 * generates a new ID
 *
 * @param name The user's display name
 * @param sock The socket of the connection
 */
function User (name, sock) {
  this.name = name
  this.sock = sock
  this.friends = []
  this.cash = 0
  this.difficulty = 2
  this.ID = utils.randHex(this.difficulty)
  this.mobcounter = 0
  this.atkPoints = 10
  this.defPoints = 10
  this.hp = 25
}

/**
 * YOU SHOULD NOT BE CALLING THIS FUNCTION:
 * Logic behind finding the mobs. (async)
 *
 * @param u The user who is finding mobs
 * @param onFind Callback for when the user does find a mob
 */
var inner = function (u, onFind) {
  if (u.mobcounter > 0 && u.mobcounter % Math.floor((u.difficulty / 2) + 1) === 0) {
    u.mobcounter--
  }
  if (u.ID === utils.randHex(u.difficulty)) {
    u.mobcounter++
    onFind()
  }
  setTimeout(function () {
    inner(u, onFind)
  }, 500)
}

/**
 * Starts the async task for finding mobs
 *
 * @param onFind Callback for when the user does find a mob
 */
User.prototype.findMobs = function (onFind) {
  if (typeof (onFind) !== 'function') {
    onFind = function () {}
  }
  inner(this, onFind)
}

/**
 * YOU SHOULD NOT BE CALLING THIS FUNCTION:
 * Logic behind killing the mobs. (async)
 *
 * @param user The user who is killing this mob
 * @param mob The mob the user is trying to kill
 * @param cb Called when someone dies. `true` when mob dies. `false` otherwise.
 */
var mobKillInner = function (user, mob, cb) {
  var atkpts
  if (!mob.tryDef(utils.rand(0, user.atkPoints))) {
    atkpts = mob.tryHit()
    if (user.def <= atkpts) {
      user.hp -= atkpts
      if (user.hp <= 5) {
        user.mobcounter++
        cb(false)
        return
      }
    }
    setTimeout(function () {
      mobKillInner(user, mob, cb)
    }, 100)
  } else cb(true)
}

/**
 * Starts the async task for killing mobs
 *
 * @param uponDeath Called when someone dies. `true` when mob dies. `false` otherwise.
 */
User.prototype.killMob = function (uponDeath) {
  if (this.mobcounter === 0) return
  if (typeof (uponDeath) !== 'function') {
    uponDeath = function (r) {}
  }
  this.mobcounter--
  mobKillInner(this, new Mob(this.difficulty, this.ID), uponDeath)
}

/**
 * Checks to see if the user comes from specified address and port
 *
 * @param remoteAddr The address that the user might come from
 * @param remotePort The port where the user might be connected to
 * @return `true` if the user does. `false` otherwise
 */
User.prototype.matches = function (remoteAddr, remotePort) {
  return this.sock.remoteAddress === remoteAddr &&
      this.sock.remotePort === remotePort
}

/**
 * Add multiple friends to a user
 *
 * @param friends A list of friends
 */
User.prototype.addFriends = function (friends) {
  for (var friend of friends) {
    this.addFriend(friend)
  }
}

/**
 * Adds a single friend to user. Adding will be ignored when the user is adding
 * him/herself or a friend who is added previously.
 *
 * @param friend A single friend
 */
User.prototype.addFriend = function (friend) {
  if (this !== friend && this.friends.indexOf(friend) < 0) {
    this.friends.push(friend)
  }
}

/**
 * Removes multiple friends by searching its name. Removes all occurrences (if
 * multiple exist)
 *
 * @param friends The list of friends getting removed
 * @param postRemove Callback when the friend is removed. The friend removed is passed as parameter.
 */
User.prototype.removeFriendsByName = function (friends, postRemove) {
  if (typeof (postRemove) !== 'function') {
    postRemove = function (f) {}
  }
  for (var i = 0; i < this.friends.length; i++) {
    if (friends.indexOf(this.friends[i].name) >= 0) {
      postRemove(this.friends.splice(i, i + 1)[0])
    }
  }
}

/**
 * Removes a friend by searching its name.
 *
 * @param friend The friend (datatype `User`)
 */
User.prototype.removeFriend = function (friend) {
  for (var i = 0; i < this.friends.length; i++) {
    if (this.friends[i] === friend) this.friends.splice(i, i + 1)
  }
}

/**
 * Returns the friend list as a string
 *
 * @return The user's friends. '<no friends>' is returned if user does not have any friends.
 */
User.prototype.listFriends = function () {
  if (this.friends.length === 0) return '<no friends>'
  if (this.friends.length === 1) return this.friends[0].name
  return this.friends.reduce((h, t) => h.name + ', ' + t.name)
}

/**
 * Delegate for user.sock.write(msg)
 *
 * @param msg Message transmitted to user
 */
User.prototype.write = function (msg) {
  this.sock.write(msg)
}

/**
 * Messages a friend
 *
 * @param name The name of the friend
 * @param msg The message sent
 */
User.prototype.msgFriend = function (name, msg) {
  this.friends.find(e => e.name === name).write(msg)
}

/**
 * Transfer gold pieces (a.k.a cash)
 *
 * @param friendName The friend who is receiving / giving the gold pieces
 * @param amount The transfer amount
 * @param postTrans Called after the transfer.
 *          First parameter  - Transfer result (true, false)
 *          Second parameter - Friend (datatype User)
 */
User.prototype.transGp = function (friendName, amount, postTrans) {
  if (typeof (postTrans) !== 'function') {
    postTrans = function (transferStatus, friend) {}
  }
  var friend = this.friends.find(e => e.name === friendName)
  if (typeof (friend) === 'undefined' || amount > this.cash) {
    postTrans(false, friend)
  } else {
    friend.cash += amount
    this.cash -= amount
    postTrans(true, friend)
  }
}

/**
 * Increases the difficulty for mobs' stats and their occurance
 *
 */
User.prototype.incrDifficulty = function () {
  this.difficulty += 1
  this.ID = utils.randHex(this.difficulty)
}

/**
 * Returns the status of the user
 *
 * @return Status of the user
 */
User.prototype.stats = function () {
  return '[HP:' + this.hp + ', ATK:' + this.atkPoints +
      ', DEF:' + this.defPoints + ', GP:' + this.cash + ']'
}

module.exports.User = User
