var crypto = require('crypto')

/**
 * Generates a random hex string using `crypto.randomBytes`
 *
 * @param len Length of the hex string
 * @return The hex string
 */
function randHex (len) {
  len = len | 0 // Ensure its a number
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
}

/**
 * Generates a random int within the bounds specified using `Math.random`
 *
 * @param lower The lower bound
 * @param higher The upper bound
 * @return The random int value
 */
function rand (lower, higher) {
  return Math.floor(Math.random() * higher + lower)
}

module.exports.randHex = randHex
module.exports.rand = rand
