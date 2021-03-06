var buildRouter = require('@moneybutton/express-paymail').buildRouter
var settings = require('../settings.json')
var bsv = require('@moneybutton/paymail-client/node_modules/bsv')

var pubkey = bsv.PublicKey.fromPrivateKey(bsv.PrivateKey.fromString(settings.privkey)).toHex()

var callbacks = {
  basePath: '/api/bsvalias',
  getIdentityKey: async (name, domain) => {
    return pubkey
  },
  getPaymentDestination: async (name, domain, body, helpers) => {
    return helpers.p2pkhFromAddress(settings.receiveAddress)
  },
  verifyPublicKeyOwner: async (name, domain, publicKeyToCheck) => {
    return publicKeyToCheck === pubkey
  }
}

var create = function (BASE_URL) {
  return buildRouter(BASE_URL, callbacks)
}

module.exports = { create }
