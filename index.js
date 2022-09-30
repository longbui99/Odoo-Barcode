let submitButton = document.getElementById("barcode-submit"),
    inputText = document.getElementById("barcode-input"),
    barcode = document.getElementById("barcode-input"),
    selector = document.getElementById("element-input"),
    delay = document.getElementById("element-input-timeout"),
    imageSelector = document.getElementById("element-input-pasted");
for (let e of document.querySelectorAll(".hdl-button"))
    e.addEventListener("click", () => {
        let e = document.querySelector("#element-input"),
            t = e.classList.contains("hide") ? "show" : "hide";
        e.classList.remove("hide", "show"), e.classList.add(t);
    });
for (let e of document.querySelectorAll(".hdl-button-timeout"))
    e.addEventListener("click", () => {
        let e = document.querySelector("#element-input-timeout"),
            t = e.classList.contains("hide") ? "show" : "hide";
        e.classList.remove("hide", "show"), e.classList.add(t);
    });
delay.addEventListener('keydown', event => {
    if ((event.keyCode < 48 && event.keykeyCode > 57) && (event.keyCode < 96 && event.keyCode > 105)) {
        event.stopPropagation()
    }
})
if (chrome) {
    chrome.storage?.sync.get(["barcodeStorage"], function (res) {
        if (res) {
            if (res?.barcodeStorage) {
                inputText.value = res.barcodeStorage;
            }
        }
    });
}
function syncStorage(){
    chrome.storage.sync.set({ barcodeStorage: inputText.value });
}
inputText.addEventListener("keyup", (evt) => {
    syncStorage()
});
async function sendEvent() {
    let [e] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
    chrome.scripting.executeScript({ target: { tabId: e.id }, function: simulateBarcodeScan, args: [barcode.value, selector.value, delay.value] });
}
function simulateBarcodeScan(e, t, delay) {
    console.log(delay, "" === delay)
    let maxTime = ("" === delay) ? 70 : parseInt(delay)
    console.log(maxTime)
    let timeSleep = 0;
    if ("" === t || "body" === t || null === (t = document.querySelector(t))) {
        t = document.querySelector("body");
        for (let eventKey of ["keypress", "keydown"]){
            let barcodes = e.split("\n");
            for (let i = 0; i < barcodes.length; i++) {
                setTimeout(() => {
                    for (let n = 0; n < barcodes[i].length; n++) {
                        let d = barcodes[i][n].charCodeAt(0);
                        void 0 !== d && t.dispatchEvent(new KeyboardEvent(eventKey, { keyCode: d, key:n}));
                    }
                }, timeSleep)
                timeSleep += maxTime
            }
        }
    } else t.value = e;
}
inputText.addEventListener("keydown", (e) => {
    (10 != e.keyCode && 13 != e.keyCode) || !e.ctrlKey || sendEvent();
}),
    submitButton.addEventListener("click", sendEvent);

function filterBarcodeRegex(barcodes) {
    let newBarcodes = [];
    for (let barcode of barcodes) {
        let match = barcode.code.match(/(.[^\?*]{3,})[\n\r\t]*/)
        if (match) {
            newBarcodes.push(barcode)
        }
    }
    return newBarcodes
}
function pushToLoad(barcode) {
    inputText.value = (inputText.value + `\n${barcode}`).trimStart('\n');
    syncStorage();
}

function copyBarcode(barcode) {
    navigator.clipboard.writeText(barcode);
}

function LoadFunction(element) {
    for (let e of document.querySelectorAll(".copy-barcode"))
        e.addEventListener("click", (event) => {
            copyBarcode(event.currentTarget.getAttribute('barcode'))
        });
    for (let e of document.querySelectorAll(".push-barcode"))
        e.addEventListener("click", (event) => {
            pushToLoad(event.currentTarget.getAttribute('barcode'))
        });
}

function InsertBarcode(barcodes) {
    let html = ''
    for (let barcode of barcodes) {
        html += `<div>
        <b>${barcode.name}</b>: 
        <span class="barcode" contenteditable="true">${barcode.code}</span> 
        <span class="copy-barcode" barcode="${barcode.code}"><svg width="12px" viewBox="0 0 512 512"><path d="M502.6 70.63l-61.25-61.25C435.4 3.371 427.2 0 418.7 0H255.1c-35.35 0-64 28.66-64 64l.0195 256C192 355.4 220.7 384 256 384h192c35.2 0 64-28.8 64-64V93.25C512 84.77 508.6 76.63 502.6 70.63zM464 320c0 8.836-7.164 16-16 16H255.1c-8.838 0-16-7.164-16-16L239.1 64.13c0-8.836 7.164-16 16-16h128L384 96c0 17.67 14.33 32 32 32h47.1V320zM272 448c0 8.836-7.164 16-16 16H63.1c-8.838 0-16-7.164-16-16L47.98 192.1c0-8.836 7.164-16 16-16H160V128H63.99c-35.35 0-64 28.65-64 64l.0098 256C.002 483.3 28.66 512 64 512h192c35.2 0 64-28.8 64-64v-32h-47.1L272 448z"/></svg></span>
        <span class="push-barcode" barcode="${barcode.code}"><svg  width="10px" viewBox="0 0 320 512"><path d="M285.1 145.7c-3.81 8.758-12.45 14.42-21.1 14.42L192 160.1V480c0 17.69-14.33 32-32 32s-32-14.31-32-32V160.1L55.1 160.1c-9.547 0-18.19-5.658-22-14.42c-3.811-8.758-2.076-18.95 4.408-25.94l104-112.1c9.498-10.24 25.69-10.24 35.19 0l104 112.1C288.1 126.7 289.8 136.9 285.1 145.7z"/></svg></span>
        </div>`
    }
    imageSelector.innerHTML += html
    if (barcodes.length > 0){
        setTimeout(() => {
            LoadFunction()
        }, 1)
    }
}

async function readBarcodeFromBase64Image(tag, imageTag, base64) {
    callbacks = (barcode) => {
        if (barcode !== 'error decoding QR Code') {
            InsertBarcode([{
                name: "QR",
                code: barcode
            }])
        }
    }
    loadQRBarcode(base64, callbacks)
    let LinearBarcodes = await loadLinearBarcode(imageTag)
    LinearBarcodes = filterBarcodeRegex(LinearBarcodes)
    InsertBarcode(LinearBarcodes)
}
document.onpaste = function (event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
            var blob = item.getAsFile();
            var reader = new FileReader();
            reader.onload = async function (event) {
                let image = document.createElement('img');
                image.src = event.target.result;
                imageSelector.innerHTML = '';
                readBarcodeFromBase64Image(imageSelector, image, event.target.result);
            };
            reader.readAsDataURL(blob);
        }
    }
}
