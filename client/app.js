var net = require('net')
var S = require('strings.js')

var HOST = '127.0.0.1'
var PORT = 4000

var isRunning = false
var client = new net.Socket()

function ask (question, format, callback) {
  var stdin = process.stdin
  var stdout = process.stdout

  stdin.resume()
  stdout.write(question)

  stdin.once('data', function (data) {
    data = new S(data.toString()).trimRight().string
    if (format.test(data)) callback(data)
    else {
      stdout.write('It should match: ' + format + '\n')
      ask(question, format, callback)
    }
  })
}

function quitSession () {
  isRunning = false
  client.destroy()
  process.exit(0)
}

function inputPrompt () {
  if (isRunning) {
    ask('', /^(\w|[.()+ \t/-?!#><'])*$/, function (text) {
      if (text[0] === '/') {
        text = text.substring(1).split(/\s+/g)
        switch (text[0]) {
          case 'quit':
            quitSession()
            break
          case 'help':
            console.log('If this is non-intentional, prefix a space / tab character')
            console.log('/quit')
            console.log('/help')
            console.log('/friend name1 name2...')
            console.log('/unfriend name1 name2...')
            break
          case 'friend':
            client.write(JSON.stringify({
              friend: text.slice(1)
            }))
            break
          case 'unfriend':
            client.write(JSON.stringify({
              unfriend: text.slice(1)
            }))
            break
          default:
            console.log('[[ Command not supported ]]')
            break
        }
      } else {
        client.write(JSON.stringify({
          msg: text
        }))
      }
      if (isRunning) inputPrompt()
    })
  }
}

client.connect(PORT, HOST, function () {
  console.log('Connected to ' + HOST + ':' + PORT)
  ask('Your name? ', /^(\w|[($)])+$/, function (prompt) {
    client.write(JSON.stringify({
      name: prompt
    }))
    isRunning = true
    inputPrompt()
  })
})

client.on('data', function (data) {
  data = JSON.parse(data)
  if (data.msg) {
    console.log(data.msg)
  } else if (data.err) {
    console.error(data.err)
    quitSession()
  } else {
    console.log('The client or server you are running is outdated!')
    console.log('DATA: ' + data)
  }
})

client.on('close', function () {
  console.log('Connection closed')
  quitSession()
})

client.on('error', function () {
  console.log('Cannot connect to server')
  quitSession()
})
