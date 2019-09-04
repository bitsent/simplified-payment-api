var swaggerJsdoc = require('swagger-jsdoc')
var swaggerUi = require('swagger-ui-express')

var options = {
  swaggerDefinition: {
    // Like the one described here: https://swagger.io/specification/#infoObject
    info: {
      title: 'Simplified Payment API - BitSent',
      version: '0.1.0',
      description: 'An API for BIP0270 payments'
    },
  },
  // List of files to be processes. You can also set globs './routes/*.js'
  apis: ['./routes/payment.js']
}

var specs = swaggerJsdoc(options)

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs)
}
