const TYPE = ['ean-13', 'ean-8', 'code-39', 'code-93', 'code-2of5', 'codabar', 'code-128']

async function loadLinearBarcode(imageTag) {
    let type = '', index = 0, barcodes = [];
    for (; index < TYPE.length; index++) {
        type = TYPE[index];
        try {
            code = await javascriptBarcodeReader({
                image: imageTag,
                barcode: type,
            })
            barcodes.push(code)
        }
        catch (err){
            continue
        }
    }
    return barcodes
}