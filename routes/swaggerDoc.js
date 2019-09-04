var swaggerJsdoc = require('swagger-jsdoc')
var swaggerUi = require('swagger-ui-express')

var options = {
  swaggerDefinition: {
    // Like the one described here: https://swagger.io/specification/#infoObject
    info: {
      title: "BitSent's Simplified Payment API (beta version)",
      version: '0.1.0',
      description: 'An API for BIP0270 payments.' +
      '\nGit: https://github.com/bitsent/simplified-payment-api' +
      '\nThis API is a bridge between the way payments have been done until now and BIP-270' +
      '\nThis API will be the default BIP270 payment server for BitBtn.'
    }
  },
  // List of files to be processes. You can also set globs './routes/*.js'
  apis: ['./routes/payment.js']
}

var specs = swaggerJsdoc(options)

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs)
}
