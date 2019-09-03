var express = require('express')
var scriptUtils = require('../utils/scriptUtils')
var paymailRosolverUtils = require('../utils/paymailRosolver')
var settings = require('../settings.json')

var router = express.Router()

var DAY = 24 * 60 * 60
var BSC_SATS = 100000000

var DONATION_ADDRESS = settings.receiveAddress
var DONATION_MEMO = 'Donation to ' + settings.serverPaymail
var DONATION_MERCHANT_DATA = 'donation'
var DONATION_AMOUNT = BSC_SATS * 0.01

var ADDRESS_REGEX = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
var HEX_REGEX = /^[0-9a-fA-F]+$/

function constructPaymentRequest (script, amount, memo, merchantData) {
  var request = {
    'network': 'bitcoin',
    'outputs': [
      {
        'amount': amount,
        'script': script
      }
    ],
    'creationTimestamp': Math.floor(+new Date() / 1000),
    'memo': memo,
    'paymentUrl': settings.baseUrl + 'payment/pay'
  }

  if (merchantData) { request.merchantData = merchantData.toString() }

  return request
}

// GET a BIP-270 Payment Request for a donation to me
router.get('/donate', function (req, res, next) {
  console.log('/donate')
  var request = constructPaymentRequest(scriptUtils.p2pkh(DONATION_ADDRESS), DONATION_AMOUNT, DONATION_MEMO, DONATION_MERCHANT_DATA)
  request.outputs.push({ 'amount': 0, 'script': '006a1949206a75737420646f6e6174656420746f2042697453656e74' })
  res.status(200).json(request)
})

// GET a BIP-270 Payment Request for an address
router.get('/address/:addr/:amount', function (req, res, next) {
  var addr = req.params.addr
  var amount = parseInt(req.params.amount)

  if (!ADDRESS_REGEX.test(addr)) { res.status(400).json({ message: 'Invalid bitcoin address.' }) }
  if (isNaN(amount) || amount < 1000) { res.status(400).json({ message: 'Amount is invalid or too small.' }) }

  res.status(200).json(
    constructPaymentRequest(scriptUtils.p2pkh(addr), amount, 'Pay to ' + addr))
})

// GET a BIP-270 Payment Request for an Paymail
router.get('/paymail/:paymail/:amount', function (req, res, next) {
  var paymail = req.params.paymail
  var amount = parseInt(req.params.amount)
  paymailRosolverUtils.getOutputScript(paymail)
    .then(outputScript => {
      if (!HEX_REGEX.test(outputScript)) { res.status(400).json({ message: 'Invalid bitcoin outputScript.' }) }
      if (isNaN(amount) || amount < 1000) { res.status(400).json({ message: 'Amount is invalid or too small.' }) }

      res.status(200).json(
        constructPaymentRequest(outputScript, amount, 'Pay to ' + paymail))
    })
})

// POST a BIP-270 Patment
// TODO: Implement this endpoint
router.post('/pay', function (req, res, next) {
  console.log(JSON.stringify(req.body))

  res.status(418).json({
    message: 'Nothing to see here. Move along. Your request body was : ' + req.body
  })
})

module.exports = router
