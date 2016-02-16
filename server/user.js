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
    this.friends.push(friend)
  }
}

User.prototype.addFriend = function (friend) {
  this.friends.push(friend)
}

User.prototype.write = function (msg) {
  this.sock.write(msg)
}

module.exports.User = User
