function User (name, sock) {
  this.name = name
  this.sock = sock
  this.friends = []
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

User.prototype.write = function (msg) {
  this.sock.write(msg)
}

module.exports.User = User
