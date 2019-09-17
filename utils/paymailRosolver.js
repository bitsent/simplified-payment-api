var paymail = require('@moneybutton/paymail-client')
var bsv = require('bsv')
var bsvMessage = require('bsv/message')

var fetch = require('isomorphic-fetch')
var dns = require('dns')
var settings = require('../settings.json')

var client = new paymail.PaymailClient(dns, fetch)

async function getOutputScript (paymailAddress) {
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
  var sig = bsvMessage.sign(hash, privateKey)
  return sig.toString('hex')
}

module.exports = {
  getOutputScript,
  sign
}
