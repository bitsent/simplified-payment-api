var createError = require('http-errors')
var express = require('express')
var path = require('path')
var logger = require('morgan')

var settings = require('./settings.json')
var paymentRouter = require('./routes/payment')
var paymailRouter = require('./routes/paymail')
var bsvaliasRouter = require('./routes/bsvalias').create(settings.baseUrl)
var swaggerDocRouter = require('./routes/swaggerDoc')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({
  extended: false
}))
app.use(express.static(path.join(__dirname, 'public')))

app.use(bsvaliasRouter)
app.use('/payment', paymentRouter)
app.use('/paymail', paymailRouter)

app.use('/', swaggerDocRouter.serve, swaggerDocRouter.setup)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  var devMode = req.app.get('env') === 'development'

  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = devMode ? err : {}

  // render the error page
  res.status(err.status || 500)
    .send(devMode
      ? res.locals.error
      : res.locals.message)
})

module.exports = app
