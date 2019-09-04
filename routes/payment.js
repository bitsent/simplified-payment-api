var express = require('express')
var scriptUtils = require('../utils/scriptUtils')
var paymailRosolverUtils = require('../utils/paymailRosolver')
var settings = require('../settings.json')
var request = require('request')
var bsv = require('@moneybutton/paymail-client/node_modules/bsv')

var router = express.Router()

var DAY = 24 * 60 * 60
var BSC_SATS = 100000000

var DONATION_ADDRESS = settings.receiveAddress
var DONATION_MEMO = 'Donation to ' + settings.serverPaymail
var DONATION_MERCHANT_DATA = 'donation'
var DONATION_AMOUNT = BSC_SATS * 0.01

var ADDRESS_REGEX = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
var HEX_REGEX = /^[0-9a-fA-F]+$/

var BITINDEX_TX_SEND = 'https://api.bitindex.network/api/v3/main/tx/send'

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
router.get('/donate', paymentRequestForDonation)
function paymentRequestForDonation (req, res, next) {
  console.log('/donate')
  var request = constructPaymentRequest(scriptUtils.p2pkh(DONATION_ADDRESS), DONATION_AMOUNT, DONATION_MEMO, DONATION_MERCHANT_DATA)
  request.outputs.push({ 'amount': 0, 'script': '006a1949206a75737420646f6e6174656420746f2042697453656e74' })
  res.status(200).json(request)
}

// GET a BIP-270 Payment Request for an address
router.get('/address/:addr/:amount', paymentRequestToAddress)
function paymentRequestToAddress (req, res, next) {
  var addr = req.params.addr
  var amount = parseInt(req.params.amount)

  if (!ADDRESS_REGEX.test(addr)) { res.status(400).json({ message: 'Invalid bitcoin address.' }) }
  if (isNaN(amount) || amount < 1000) { res.status(400).json({ message: 'Amount is invalid or too small.' }) }

  res.status(200).json(
    constructPaymentRequest(scriptUtils.p2pkh(addr), amount, 'Pay to ' + addr))
}

// GET a BIP-270 Payment Request for an Paymail
router.get('/paymail/:paymail/:amount', paymentRequestToPaymail)
function paymentRequestToPaymail (req, res, next) {
  var paymail = req.params.paymail
  var amount = parseInt(req.params.amount)
  paymailRosolverUtils.getOutputScript(paymail)
    .then(outputScript => {
      if (!HEX_REGEX.test(outputScript)) { res.status(400).json({ message: 'Invalid bitcoin outputScript.' }) }
      if (isNaN(amount) || amount < 1000) { res.status(400).json({ message: 'Amount is invalid or too small.' }) }

      res.status(200).json(
        constructPaymentRequest(outputScript, amount, 'Pay to ' + paymail))
    })
}

// POST a BIP-270 Patment
// TODO: Fully Implement this endpoint
router.post('/pay', bip270Payment)
function bip270Payment (req, res, next) {
  // Payment {
  //   merchantData // string. optional.
  //   transaction // a hex-formatted (and fully-signed and valid) transaction. required.
  //   refundTo // string. paymail to send a refund to. optional.
  //   memo // string. optional.
  // }

  // PaymentACK {
  //   payment // Payment. required. (Copy of the Payment message)
  //   memo // string. optional. (result or error message)
  //   error // number. optional. (0 or 1)
  // }

  if (!req.body.transaction) {
    res.status(400).json({ payment: req.body, error: 1, memo: "No 'transaction' parameter passed" })
  }
  if (typeof req.body.transaction !== 'string' || !HEX_REGEX.test(req.body.transaction)) {
    res.status(400).json({ payment: req.body, error: 1, memo: "'transaction' should be a Hex String" })
  }

  var txid = bsv.util.buffer.reverse(bsv.crypto.Hash.sha256sha256(Buffer.from(req.body.transaction, 'hex'))).toString('hex')

  request({
    method: 'POST',
    url: BITINDEX_TX_SEND,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ rawtx: req.body.transaction })
  }, (error, response, body) => {
    if (error) {
      res.status(400).json({ payment: req.body, error: 1, memo: JSON.stringify(error) })
    } else if (body.message && body.message.indexOf('transaction already in block chain') > 0) {
      res.status(200).json({ payment: req.body, error: 0, memo: 'transaction already in block chain: ' + body.txid })
    } else if (body.message) {
      res.status(400).json({ payment: req.body, error: 1, memo: body.message })
    } else if (body.txid) {
      res.status(200).json({ payment: req.body, error: 0, memo: 'Broadcasted: ' + body.txid })
    } else {
      res.status(200).json({ payment: req.body, error: 0, memo: 'Something unexpected happened' })
    }
  })
}

module.exports = router
