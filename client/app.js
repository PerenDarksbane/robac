var net = require('net')

var HOST = '127.0.0.1'
var PORT = 4000

var isRunning = false
var client = new net.Socket()

function ask (question, format, callback) {
  var stdin = process.stdin
  var stdout = process.stdout

  stdin.resume()
  stdout.write(question + ' ')

  stdin.once('data', function (data) {
    data = data.toString().trim()
    if (format.test(data)) callback(data)
    else {
      stdout.write('It should match: ' + format + '\n')
      ask(question, format, callback)
    }
  })
}

function inputPrompt () {
  if (isRunning) {
    ask('>>>', /(\w|[ \t])*/, function (text) {
      if (text === '/quit') {
        isRunning = false
        client.destroy()
      } else {
        client.write('{' +
          '"msg": "' + text + '"' +
        '}')
      }
      if (isRunning) inputPrompt()
    })
  }
}

client.connect(PORT, HOST, function () {
  console.log('Connected to ' + HOST + ':' + PORT)
  ask('Your name?', /[_$a-zA-Z]+/, function (prompt) {
    client.write('{' +
      '"name": "' + prompt + '"' +
    '}')
    isRunning = true
    inputPrompt()
  })
})

client.on('data', function (data) {
  data = JSON.parse(data)
  if (data.msg) console.log('SERV: ' + data.msg)
  else {
    isRunning = false
    client.destroy()
    console.error(data.err)
  }
})

client.on('close', function () {
  isRunning = false
  console.log('Connection closed')
})
