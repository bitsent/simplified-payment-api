var paymail = require('@moneybutton/paymail-client')
var bsv = require('bsv')
var fetch = require('isomorphic-fetch')
var dns = require('dns')
var settings = require('../settings.json')

var client = new paymail.PaymailClient(dns, fetch)

var privkey = bsv.PrivateKey.fromString(settings.privkey)
var pubkey = bsv.PublicKey.fromPrivateKey(privkey)

async function getOutputScript (paymailAddress) {
  console.log('resolving : ' + paymailAddress)
  
  var senderInfo = {
    senderName: 'BitSent API',
    senderHandle: settings.serverPaymail,
    amount: 100000,
    dt: new Date().toISOString(),
    purpose: 'Request from a BitSent API user',
  }
  
  senderInfo.signature = VerifiableMessage
    .forBasicAddressResolution(senderInfo).sign(privkey.toHex())
  
  var out = await client.getOutputFor(paymailAddress, senderInfo)
  return out
}

module.exports = { getOutputScript }
