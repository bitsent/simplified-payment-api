var express = require('express');
var scriptUtils = require("../utils/scriptUtils");

var router = express.Router();

var DAY = 24 * 60 * 60;
var BASE_URL = "donation";
var PAYMENT_URL = BASE_URL + "/payment/pay";
var BSC_SATS = 100000000;

var DONATION_ADDRESS = "1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY";
var DONATION_MEMO = "Donation to BitSent";
var DONATION_MERCHANT_DATA = "donation";
var DONATION_AMOUNT = BSC_SATS * 0.01;

var ADDRESS_REGEX = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

function constructRequest(address, amount, memo, merchantData) {
  var request = {
    "network": "bitcoin",
    "outputs": {
      "amount": amount,
      "script": scriptUtils.p2pkh(address)
    },
    "creationTimestamp": Math.floor(+new Date() / 1000),
    "memo": memo,
    "paymentUrl": PAYMENT_URL
  };

  if (merchantData)
    request.merchantData = merchantData.toString();

  return request;
}

// GET a BIP-270 Payment Request for a donation to me
router.get('/donate', function (req, res, next) {
  console.log("/donate");
  res.status(200).json(
    constructPaymentRequest(DONATION_ADDRESS, DONATION_AMOUNT, DONATION_MEMO, DONATION_MERCHANT_DATA));
});

// GET a BIP-270 Payment Request for an address
// TODO: Make similar endpoint for paymails
router.get('/address/:addr/:amount', function (req, res, next) {
  console.log("/address", JSON.stringify(req.params));
  var addr = req.params.addr;
  var amount = parseInt(req.params.amount);

  if (!ADDRESS_REGEX.test(addr))
    res.status(400).json({message: "Invalid bitcoin address."});
  if (isNaN(amount) || amount < 1000)
    res.status(400).json({message: "Amount is invalid or too small."});

  res.status(200).json(
    constructPaymentRequest(addr, amount, "Pay to " + addr));
  });

// POST a BIP-270 Patment
// TODO: Implement this endpoint
router.post('/pay', function (req, res, next) {
  console.log(JSON.stringify(req.body));

  res.status(418).json({
    message: "Nothing to see here. Move along."
  });
});

module.exports = router;