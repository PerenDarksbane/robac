function User (name, remoteAddr, remotePort) {
  this.name = name
  this.remoteAddr = remoteAddr
  this.remotePort = remotePort
  this.friends = []
}

User.prototype.matches = function (remoteAddr, remotePort) {
  return this.remoteAddr === remoteAddr && this.remotePort === remotePort
}

User.prototype.addFriends = function (friends) {
  for (var index in friends) {
    this.friends.push(index)
  }
}

module.exports.User = User
