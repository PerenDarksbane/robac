const net = require('net')
const User = require('./user').User

var HOST = '127.0.0.1'
var PORT = 4000

const mainHub = []

function removeUser (sock) {
  var user
  var friend
  var index
  for (index in mainHub) {
    user = mainHub[index]
    if (user.matches(sock.remoteAddress, sock.remotePort)) {
      mainHub.splice(index, index + 1)
      console.log('User ' + user.name + ' has left')
      console.log("Unlinking user's friends")
      for (friend of user.friends) {
        friend.write(JSON.stringify({
          msg: 'Your friend ' + user.name + ' has disconnected'
        }))
        friend.removeFriend(user)
      }
      break
    }
  }
}

function doesUserExist (name) {
  return findUserByName(name) !== undefined
}

function findUserBySock (sock) {
  return mainHub.find(e => e.matches(sock.remoteAddress, sock.remotePort))
}

function findUserByName (name) {
  return mainHub.find(e => e.name === name)
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
  sock.on('data', function (data) {
    data = JSON.parse(data) // All data will be transmitted in JSON format
    if (data.name) validateUser(sock, data.name)
    else {
      var user = findUserBySock(sock)
      if (!user) {
        sock.write(JSON.stringify({
          err: 'You (somehow) do not exist in the server...'
        }))
        return
      }
      var friend
      if (data.friend) {
        console.log(data.msg)
        if (data.msg) { // Message a specific friend
          try {
            user.msgFriend(data.friend, JSON.stringify({
              msg: '[' + user.name + ']:' + data.msg
            }))
          } catch (e) {
            sock.write(JSON.stringify({
              msg: 'Failed to msg friend ' + data.friend + '. ' + e
            }))
            console.log('ERROR OCCURED: ' + e)
          }
          return
        }
        var failedAddCount = 0
        for (friend of data.friend) {
          friend = findUserByName(friend)
          if (friend) {
            friend.write(
            JSON.stringify({msg: 'You are now ' + user.name + "'s friend"}))
            friend.addFriend(user)
            user.addFriend(friend)
          } else failedAddCount++
        }
        sock.write(JSON.stringify({
          msg: failedAddCount // 0 means false in js
            ? 'Cannot find ' + failedAddCount + ' people / person'
            : 'Done adding friends'
        }))
      } else if (data.unfriend) {
        user.removeFriendsByName(data.unfriend, function (f) {
          f.write(JSON.stringify({
            msg: 'You have been unfriended by ' + user.name + '. ' +
              user.name + ' can still see your chats however'
          }))
        })
      } else {
        data.msg = user.name + ':' + data.msg
        for (friend of user.friends) friend.write(JSON.stringify(data))
      }
    }
  })
  sock.on('close', function (data) {
    removeUser(sock)
    console.log('Close: ' + sock.remoteAddress + ':' + sock.remotePort)
  })
  sock.on('error', function (err) {
    console.log('Error occured: ' + err)
  })
}).listen(PORT, HOST)

console.log('Server listening on ' + HOST + ':' + PORT)
