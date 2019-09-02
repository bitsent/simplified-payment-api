var paymail = require('@moneybutton/paymail-client')
var bsv = require('@moneybutton/paymail-client/node_modules/bsv')

var fetch = require('isomorphic-fetch')
var dns = require('dns')
var settings = require('../settings.json')

var client = new paymail.PaymailClient(dns, fetch)

async function getAddress (paymailAddress) {
  var sender = {
    senderHandle: paymailAddress,
    dt: new Date().toISOString()
  }
  sender.signature = sign(sender.senderHandle + sender.dt + '0')

  var out = await client.getOutputFor(paymailAddress, sender)
  return out
}

function sign (data) {
  var privateKey = bsv.PrivateKey.fromString(settings.privkey)
  var hash = bsv.crypto.Hash.sha256(Buffer.from(data))
  var sig1 = bsv.crypto.ECDSA.sign(hash, privateKey)
  return sig1.toString('hex')
}

module.exports = {
  getAddress,
  sign
}
