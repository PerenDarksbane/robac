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

function procDirectMsg (user, friend, tmsg) {
  try {
    user.msgFriend(friend, JSON.stringify({
      msg: '[' + user.name + ']:' + tmsg
    }))
  } catch (e) {
    user.write(JSON.stringify({
      msg: 'Failed to msg friend ' + friend + '. ' + e
    }))
    console.log('ERROR OCCURED: ' + e)
  }
}

function procAddFriend (user, reqFriend) {
  var failedAddCount = 0
  for (var friend of reqFriend) {
    friend = findUserByName(friend)
    if (friend) {
      friend.write(
      JSON.stringify({msg: 'You are now ' + user.name + "'s friend"}))
      friend.addFriend(user)
      user.addFriend(friend)
    } else failedAddCount++
  }
  user.write(JSON.stringify({
    msg: failedAddCount // 0 means false in js
      ? 'Cannot find ' + failedAddCount + ' people / person'
      : 'Done adding friends'
  }))
}

function procDelFriend (user, friends) {
  user.removeFriendsByName(friends, function (f) {
    f.write(JSON.stringify({
      msg: 'You have been unfriended by ' + user.name + '. ' +
        user.name + ' can still see your chats however'
    }))
  })
}

function procEcho (user, data) {
  data.msg = user.name + ':' + data.msg
  for (var friend of user.friends) friend.write(JSON.stringify(data))
}

function procQuery (user, query) {
  query = query.toLowerCase()
  switch (query) {
    case 'friend':
    case 'friends':
      user.write(JSON.stringify({
        msg: user.listFriends()
      }))
      break
    case 'gp':
    case 'cash':
      user.write(JSON.stringify({
        msg: 'GP: ' + user.cash
      }))
      break
    default:
      break
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
      if (data.friend) {
        if (data.msg) procDirectMsg(user, data.friend, data.msg)
        else procAddFriend(user, data.friend)
      } else if (data.unfriend) procDelFriend(user, data.unfriend)
      else if (data.query) procQuery(user, data.query)
      else procEcho(user, data)
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
