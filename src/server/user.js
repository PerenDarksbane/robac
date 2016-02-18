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

const crypto = require('crypto')

function randHex (len) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
}

function User (name, sock) {
  this.name = name
  this.sock = sock
  this.friends = []
  this.cash = 0
  this.difficulty = 2
  this.ID = randHex(this.difficulty)
  this.mobcounter = 0
}

User.prototype.findMobs = function (onFind) {
  if (typeof (onFind) !== 'function') {
    onFind = function () {}
  }
  (function () {
    if (this.mobcounter > 0 && this.mobcounter % Math.floor((this.difficulty / 2) + 1) === 0) {
      this.mobcounter--
    }
    if (this.ID === randHex(this.difficulty)) {
      onFind()
      this.mobcounter++
    }
    setTimeout(this.findMobs(), 3500)
  })()
}

User.prototype.matches = function (remoteAddr, remotePort) {
  return this.sock.remoteAddress === remoteAddr &&
      this.sock.remotePort === remotePort
}

User.prototype.addFriends = function (friends) {
  for (var friend of friends) {
    this.addFriend(friend)
  }
}

User.prototype.addFriend = function (friend) {
  if (this !== friend && this.friends.indexOf(friend) < 0) {
    this.friends.push(friend)
  }
}

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

User.prototype.removeFriend = function (friend) {
  for (var i = 0; i < this.friends.length; i++) {
    if (this.friends[i] === friend) this.friends.splice(i, i + 1)
  }
}

User.prototype.listFriends = function () {
  if (this.friends.length === 0) return '<no friends>'
  if (this.friends.length === 1) return this.friends[0].name
  return this.friends.reduce((h, t) => h.name + ', ' + t.name)
}

User.prototype.write = function (msg) {
  this.sock.write(msg)
}

User.prototype.msgFriend = function (name, msg) {
  this.friends.find(e => e.name === name).write(msg)
}

User.prototype.transGp = function (user, amount, postTrans) {
  if (typeof (postTrans) !== 'function') {
    postTrans = function (transferStatus, friend) {}
  }
  var friend = this.friends.find(e => e.name === user)
  if (typeof (friend) === 'undefined' || amount > this.cash) {
    postTrans(false, friend)
  } else {
    friend.cash += amount
    this.cash -= amount
    postTrans(true, friend)
  }
}

User.prototype.incrDifficulty = function () {
  this.difficulty += 2
}

module.exports.User = User
