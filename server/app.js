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
  for (var index in mainHub)
    if (mainHub[index].name === name) return true
  return false
}

function validateUser (sock, name) {
  if (doesUserExist(name)) {
    sock.write('{"err": "Chose a new logon name. ' + name + ' is already used."}')
  } else {
    mainHub.push(new User(name, sock.remoteAddress, sock.remotePort))
    sock.write('{"msg":"Welcome ' + name + '!"}')
  }
}

net.createServer(function (sock) {
  console.log('Connected: ' + sock.remoteAddress + ':' + sock.remotePort)
  var data
  sock.on('data', function (oldData) {
    data = JSON.parse(oldData) // All data will be transmitted in JSON format
    if (data.name) validateUser(sock, data.name)
    else sock.write(oldData)
  })
  sock.on('close', function (data) {
    removeUser(sock)
    console.log('Close: ' + sock.remoteAddress + ':' + sock.remotePort)
  })
}).listen(PORT, HOST)

console.log('Server listening on ' + HOST + ':' + PORT)
