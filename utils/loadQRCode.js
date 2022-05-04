

function loadQRBarcode(base64Img, callback) {
    qrcode.decode(base64Img)
    qrcode.callback = callback
}