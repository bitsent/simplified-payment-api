var express = require('express')
var paymailRosolverUtils = require('../utils/paymailRosolver')

var router = express.Router()

/**
* @swagger
*    /paymail/{paymail}:
*      get:
*        summary: Returns an output script for sending to the specidied paymail.
*        parameters:
*          - name: paymail
*            in: path
*            required: true
*            description: The bitcoin paymail to pay to
*            default: aleks@simply.cash
*        responses:
*          '200':
*            description: An object with a valid Bitcoin output script (in hex form). Like { output:"<hex output script>" }
*            content:
*              application/json
*/
router.get('/:paymail', paymentRequestToPaymail)

function paymentRequestToPaymail (req, res, next) {
  var paymail = req.params.paymail
  paymailRosolverUtils.getOutputScript(paymail).then(outputScript => {
    res.status(200).json({
      output: outputScript
    })
  }).catch(err => {
      console.error(err)
      res.status(500).json({ message: err.message })
    })
}

module.exports = router
