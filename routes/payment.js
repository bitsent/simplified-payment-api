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

/**
 * @swagger
 *    /payment/address/{addr}/{amount}:
 *      get:
 *        summary: Returns a bip270 payment request object, for sending the specified amount to the specified bitcoin address.
 *        description: The specified amount must be in satoshies and not smaller than 1000. The bitcoin address must be a valid address.
 *        parameters:
 *          - name: addr
 *            in: path
 *            required: true
 *            description: The bitcoin address to pay to
 *            default: 1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY
 *          - name: amount
 *            in: path
 *            required: true
 *            description: The amount to pay in satoshies
 *            default: 500000
 *        responses:
 *          '200':
 *            description: A bup270 payment request object.
 *            content:
 *              application/json
 */
router.get('/address/:addr/:amount', paymentRequestToAddress)
function paymentRequestToAddress (req, res, next) {
  var addr = req.params.addr
  var amount = parseInt(req.params.amount)

  if (!ADDRESS_REGEX.test(addr)) { res.status(400).json({ message: 'Invalid bitcoin address.' }) }
  if (isNaN(amount) || amount < 1000) { res.status(400).json({ message: 'Amount is invalid or too small.' }) }

  res.status(200).json(
    constructPaymentRequest(scriptUtils.p2pkh(addr), amount, 'Pay to ' + addr))
}

/**
 * @swagger
 *    /payment/paymail/{paymail}/{amount}:
 *      get:
 *        summary: Returns a bip270 payment request object, for sending the specified amount to the specified paymail.
 *        description: The specified amount must be in satoshies and not smaller than 1000. The paymail must be a valid paymail.
 *        parameters:
 *          - name: paymail
 *            in: path
 *            required: true
 *            description: The bitcoin paymail to pay to
 *            default: aleks@simply.cash
 *          - name: amount
 *            in: path
 *            required: true
 *            description: The amount to pay in satoshies
 *            default: 500000
 *        responses:
 *          '200':
 *            description: A bup270 payment request object.
 *            content:
 *              application/json
 */
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
    }).catch(err => {
      console.error(err)
      res.status(500).json({ message: err.message })
    })

}

/**
 * @swagger
 *    /payment/pay:
 *      post:
 *        summary: Endpoint for receiving payment messages.
 *        description: Accepts a Payment Object body (transaction = "{tx hex}") and returns a PaymentACK Object JSON, as described in BIP-0270.
 *        requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  transaction:
 *                    type: string
 *                    description: hexadecimal transaction string
 *                  merchantData:
 *                    type: string
 *                    description: helps the accepting server recognize the specific payment. (not used in this implementation)
 *                  refundTo:
 *                    type: string
 *                    description: refund address in case refunding is needed. (not used in this implementation)
 *                  memo:
 *                    type: string
 *                    description: A plain text note from the customer to the payment server. (not used in this implementation)
 *                  required:
 *                    - transaction
 *        responses:
 *          '200':
 *            description: If the payment was succesfully broadcasted, or it is already present in the blockchain, a PaymentACK object is returned (as described in BIP-0270)
 *          '400':
 *            description: If the payment invalid, or there was a different error, a PaymentACK object with an error is returned (as described in BIP-0270)
 */
router.post('/pay', bip270Payment)
function bip270Payment (req, res, next) {
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
