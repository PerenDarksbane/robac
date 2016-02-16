const net = require('net')
const User = require('./user').User

var HOST = '127.0.0.1'
var PORT = 4000

const mainHub = []

function removeUser (sock) {
  var user
  for (var index in mainHub) {
    user = mainHub[index]
    if (user.matches(sock.remoteAddress, sock.remotePort)) {
      console.log('User ' + user.name + ' has left')
      mainHub.splice(index, index + 1)
      break
    }
  }
}

function doesUserExist (name) {
  for (var user of mainHub)
    if (user.name === name) return true
  return false
}

function findUserBySock (sock) {
  for (var user of mainHub)
    if (user.matches(sock.remoteAddress, sock.remotePort)) return user
  return undefined
}

function findUserByName (name) {
  for (var user of mainHub)
    if (user.name === name) return user
  return undefined
}

function validateUser (sock, name) {
  if (doesUserExist(name)) {
    sock.write(JSON.stringify({
      err: 'Choose a new logon name. ' + name + ' is already used.'
    }))
  } else {
    mainHub.push(new User(name, sock))
    sock.write(JSON.stringify({
      msg: 'Welcome ' + name + '!'
    }))
  }
}

net.createServer(function (sock) {
  console.log('Connected: ' + sock.remoteAddress + ':' + sock.remotePort)
  var data
  sock.on('data', function (oldData) {
    data = JSON.parse(oldData) // All data will be transmitted in JSON format
    if (data.name) validateUser(sock, data.name)
    else if (data.friend) {
      var user = findUserBySock(sock)
      if (!user) {
        sock.write(
            JSON.stringify({err: 'You (somehow) do not exist. That is odd!'}))
        return
      }
      var failedAddCount = 0
      for (var friend of data.friend) {
        friend = findUserByName(friend)
        if (friend) {
          friend.write(
              JSON.stringify({msg: 'You are now ' + user.name + "'s friend"}))
          user.addFriend(friend)
        } else failedAddCount++
      }
      sock.write(JSON.stringify({
        msg: failedAddCount // 0 means false in js
            ? 'Cannot find ' + failedAddCount + ' people / person'
            : 'Done adding friends'
      }))
    } else sock.write(oldData)
  })
  sock.on('close', function (data) {
    removeUser(sock)
    console.log('Close: ' + sock.remoteAddress + ':' + sock.remotePort)
  })
  sock.on('error', function (err) {
    console.log('User lost connection to socket')
    // sock.on('close') is called right after which disconnects the user
  })
}).listen(PORT, HOST)

console.log('Server listening on ' + HOST + ':' + PORT)
