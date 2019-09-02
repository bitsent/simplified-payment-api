var base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function to_b58 (uint8array) {
  var d = [];

    
var s = "";

    
var i; var j; var c; var n
  for (i in uint8array) {
  j = 0
    c = uint8array[i]
    s += c || s.length ^ i ? '' : A[0]
    while (j in d || c) {
    n = d[j]
      n = n ? n * 256 + c : c
      c = n / 58 | 0
      d[j] = n % 58
      j++
    }
  }
  while (j--)
  {s += base58Alphabet[d[j]];}
  return s
}

function from_b58 (base58string) {
  var d = [];

    
var b = [];

    
var i; var j; var c; var n
  for (i in base58string) {
  j = 0
    c = base58Alphabet.indexOf(base58string[i])
    if (c < 0)
    {return undefined;}
  c || b.length ^ i ? i : b.push(0)
    while (j in d || c) {
    n = d[j]
      n = n ? n * 58 + c : c
      c = n >> 8
      d[j] = n % 256
      j++
    }
  }
  while (j--)
  {b.push(d[j]);}
  return new Uint8Array(b)
}

function toHexString (byteArray) {
  return Array.from(byteArray, function (byte) {
  return ('0' + (byte & 0xFF).toString(16)).slice(-2)
  }).join('')
}

function hex2littleEndian (hexValue) {
  var hexParts = []
  for (var i = 0; i < hexValue.length; i += 2)
  {hexParts.push(hexValue.substr(i, 2));}
  return hexParts.reverse().join('')
}

var _2bytesLimit = Math.pow(16, 4)
var _4bytesLimit = Math.pow(16, 8)

function hexValueInScript (hexString) {
  if (hexString.length % 2 == 1)
  {hexString = "0" + hexString;}
  var len = (hexString.length / 2)
  if (hexString === '00') // OP_FALSE
  {return "00";}
  if (len < 76)
  {return ("0" + len.toString(16)).slice(-2) + hexString;}
  else if (len >= 76 && len < 256)
  {return "4c" + ("0" + len.toString(16)).slice(-2) + hexString;}
  else if (len >= 256 && len < _2bytesLimit)
  {return "4d" + hex2littleEndian(("000" + len.toString(16)).slice(-4)) + hexString;}
  else if (_2bytesLimit <= len && len < _4bytesLimit)
  {return "4e" + hex2littleEndian(("0000000" + len.toString(16)).slice(-8)) + hexString;}
}

function addressToPubKeyHash160 (address) {
  var pub = from_b58(address)
  var pubCheckSum = pub.slice(21)
  var pubMain = pub.slice(1, 21)
  var pubHash160 = toHexString(pubMain)
  return pubHash160
}

function p2pkh (address) {
  var pubHash160 = addressToPubKeyHash160(address)
  // TODO: Check the checksum and throw exception if address is invalid
  var resultScript = '76a9' + hexValueInScript(pubHash160) + '88ac';
  return resultScript
}

module.exports = {
  p2pkh,
  to_b58,
  from_b58
}
