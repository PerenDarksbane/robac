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

var net = require('net')
var S = require('string')

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
    data = new S(data.toString()).trimRight().s
    if (format.test(data)) {
      callback(data)
      return
    }
    stdout.write('It should match: ' + format + '\n')
    ask(question, format, callback)
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
        var oldText = text.substring(1)
        text = oldText.split(/\s+/g)
        switch (text[0]) {
          case 'quit':
            quitSession()
            break
          case '?':
          case 'help':
            console.log('If this is non-intentional, prefix a space / tab character')
            console.log('/quit')
            console.log('/help')
            console.log('/?')
            console.log('/friend name1 name2...')
            console.log('/unfriend name1 name2...')
            console.log('/msg name msg')
            console.log('/query field')
            console.log('/trans name amount')
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
          case 'msg':
            client.write(JSON.stringify({
              friend: text[1],
              msg: new S(oldText).between(text[1]).trimLeft().s
            }))
            break
          case 'query':
            client.write(JSON.stringify({
              query: text[1]
            }))
            break
          case 'trans':
            client.write(JSON.stringify({
              friend: text[1],
              amount: text[2] | 0 // Javascript hack to turn stuff into numbers
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
