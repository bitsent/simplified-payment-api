# Simplified Payment API

## A simple and lighweight NodeJS Express API, for BIP-0270 payments and for resolving BSV PayMail handles.
It is technically a PayMail server too, but it only manages 1 single paymail.

## Git
https://github.com/bitsent/simplified-payment-api/

## Api Endpoints
(see https://api.bitsent.net/)

#### GET /paymail/{paymail}
Returns an output script for sending to the specidied paymail.

#### GET /payment/address/{addr}/{amount}
Returns a bip270 payment request object, for sending the specified amount to the specified bitcoin address.

#### GET /payment/paymail/{paymail}/{amount}
Returns a bip270 payment request object, for sending the specified amount to the specified paymail.

#### POST /payment/pay
Endpoint for receiving payment messages.
