var paymail = require('@moneybutton/paymail-client')
var bsv = require('bsv')
var fetch = require('isomorphic-fetch')
var dns = require('dns')
var settings = require('../settings.json')

var client = new paymail.PaymailClient(dns, fetch)

async function getOutputScript (paymailAddress) {
  var privkey = bsv.PrivateKey.fromString(settings.privkey)
  var pubkey = bsv.PublicKey.fromPrivateKey(privkey)
  var out = await client.getOutputFor(paymailAddress, {
    senderName: 'BitSent API',
    senderHandle: paymailAddress,
    dt: new Date().toISOString(),
    amount: 0,
    purpose: '.',
    pubkey: pubkey.toHex()
  }, privkey.toHex())
  return out
}

module.exports = { getOutputScript }