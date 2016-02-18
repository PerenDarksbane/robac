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
    var newUser = new User(name, sock)
    newUser.cash = 150
    newUser.findMobs(function () {
      sock.write(JSON.stringify({
        msg: 'Mob detected...'
      }))
    })
    mainHub.push(newUser)
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
      user.write(JSON.stringify({
        msg: '' + (user.friends.length > 0)
      }))
      break
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
    case 'mob':
      user.write(JSON.stringify({
        msg: '' + (user.mobcounter > 0)
      }))
      break
    case 'mobs':
      user.write(JSON.stringify({
        msg: '' + user.mobcounter
      }))
      break
    default:
      break
  }
}

function procTransfer (user, friend, amount) {
  if (amount < 0) {
    user.write(JSON.stringify({
      msg: 'Transfer failed: Negative transfer amount'
    }))
  } else if (amount > 0) {
    user.transGp(friend, amount, function (tstat, dest) {
      if (tstat) {
        dest.write(JSON.stringify({
          msg: 'Received ' + amount + (amount === 1 ? ' GP' : 'GPs') +
            ' from ' + user.name
        }))
        user.write(JSON.stringify({msg: 'Transfer completed'}))
      } else {
        if (!isDef(dest)) {
          user.write(JSON.stringify({
            msg: friend + ' is not present in friend list'
          }))
          return
        }
        dest.write(JSON.stringify({
          msg: 'Transfer by ' + user.name + ' has failed'
        }))
        user.write(JSON.stringify({
          msg: 'Transfer failed: Insufficient GP in reserve'
        }))
      }
    })
  }
}

function isDef (v) {
  return typeof (v) !== 'undefined' && v !== null
}

net.createServer(function (sock) {
  console.log('Connected: ' + sock.remoteAddress + ':' + sock.remotePort)
  sock.on('data', function (data) {
    data = JSON.parse(data) // All data will be transmitted in JSON format
    if (isDef(data.name)) validateUser(sock, data.name)
    else {
      var user = findUserBySock(sock)
      if (!isDef(user)) {
        sock.write(JSON.stringify({
          err: 'You (somehow) do not exist in the server...'
        }))
        return
      }
      if (isDef(data.friend)) {
        if (isDef(data.msg)) procDirectMsg(user, data.friend, data.msg)
        else if (isDef(data.amount)) procTransfer(user, data.friend, data.amount)
        else procAddFriend(user, data.friend)
      } else if (isDef(data.unfriend)) procDelFriend(user, data.unfriend)
      else if (isDef(data.query)) procQuery(user, data.query)
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
