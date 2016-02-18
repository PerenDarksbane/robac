function User (name, sock) {
  this.name = name
  this.sock = sock
  this.friends = []
  this.cash = 0
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

User.prototype.transGp = function (user, amount) {
  if (amount > this.cash) return false
  user.cash += amount
  this.cash -= amount
  return true
}

module.exports.User = User
