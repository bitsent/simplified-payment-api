var base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function to_b58(
    B, //Uint8Array raw byte input
    A //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
) {
    var d = [],
        s = "",
        i, j, c, n;
    for (i in B) {
        j = 0;
        c = B[i];
        s += c || s.length ^ i ? "" : A[0];
        while (j in d || c) {
            n = d[j];
            n = n ? n * 256 + c : c;
            c = n / 58 | 0;
            d[j] = n % 58;
            j++;
        }
    }
    while (j--)
        s += A[d[j]];
    return s;
}

function from_b58(
    S, //Base58 string
    A //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
) {
    var d = [],
        b = [],
        i, j, c, n;
    for (i in S) {
        j = 0;
        c = A.indexOf(S[i]);
        if (c < 0)
            return undefined;
        c || b.length ^ i ? i : b.push(0);
        while (j in d || c) {
            n = d[j];
            n = n ? n * 58 + c : c;
            c = n >> 8;
            d[j] = n % 256;
            j++;
        }
    }
    while (j--)
        b.push(d[j]);
    return new Uint8Array(b);
}

function toHexString(byteArray) {
    return Array.from(byteArray, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

function hex2littleEndian(hexValue) {
    var hexParts = [];
    for (var i = 0; i < hexValue.length; i += 2)
        hexParts.push(hexValue.substr(i, 2));
    return hexParts.reverse().join("");
}
var _2bytesLimit = Math.pow(16, 4);
var _4bytesLimit = Math.pow(16, 8);

function hexValueInScript(hexString) {
    if (hexString.length % 2 == 1)
        hexString = "0" + hexString;
    var len = (hexString.length / 2);
    if (hexString === "00") // OP_FALSE
        return "00";
    if (len < 76)
        return ("0" + len.toString(16)).slice(-2) + hexString;
    else if (76 <= len && len < 256)
        return "4c" + ("0" + len.toString(16)).slice(-2) + hexString;
    else if (256 <= len && len < _2bytesLimit)
        return "4d" + hex2littleEndian(("000" + len.toString(16)).slice(-4)) + hexString;
    else if (_2bytesLimit <= len && len < _4bytesLimit)
        return "4e" + hex2littleEndian(("0000000" + len.toString(16)).slice(-8)) + hexString;
}

function p2pkh(address) {
    var pub = from_b58(address, base58Alphabet);
    var pubCheckSum = pub.slice(21);
    var pubMain = pub.slice(1, 21);
    var pubHash160 = toHexString(pubMain);
    // TODO: Check the checksum and throw exception if address is invalid
    var resultScript = "76a9" + hexValueInScript(pubHash160) + "88ac";
    return resultScript;
}

function str2hex(str) {
    if (Array.isArray(str))
        return str.map(function (part) {
            return str2hex(part);
        });
    var result = "";
    for (var i = 0; i < str.length; i++) {
        var hex = str.charCodeAt(i).toString(16);
        result += ("0" + hex).slice(-2);
    }
    return result;
}

function op_return(hexValues, use_op_false) {
    if (use_op_false === undefined)
        use_op_false = true;
    if (typeof (hexValues) == "string")
        hexValues = [hexValues];
    if (!Array.isArray(hexValues))
        throw new Error("op_return method expects an array of hexadecimal strings");
    var resultScript = use_op_false ? "006a" : "6a";
    for (var i = 0; i < hexValues.length; i++) {
        resultScript = resultScript + hexValueInScript(hexValues[i]);
    }
    return resultScript;
}
module.exports = {
    p2pkh: p2pkh,
    op_return: op_return,
    str2hex: str2hex,
};