let submitButton = document.getElementById("barcode-submit"),
    inputText = document.getElementById("barcode-input"),
    barcode = document.getElementById("barcode-input"),
    selector = document.getElementById("element-input"),
    delay = document.getElementById("element-input-timeout");
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
delay.addEventListener('keydown', event=>{
    if ((event.keyCode < 48 && event.keykeyCode > 57) && (event.keyCode < 96 && event.keyCode > 105)) {
        event.stopPropagation() 
    }
})
chrome.storage.sync.get(["barcodeStorage"], function (res) {
    if (res) {
        if (res?.barcodeStorage) {
            inputText.value = res.barcodeStorage;
        }
    }
});
inputText.addEventListener("keyup", (evt) => {
    chrome.storage.sync.set({ barcodeStorage: inputText.value });
});
async function sendEvent() {
    let [e] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
    chrome.scripting.executeScript({ target: { tabId: e.id }, function: simulateBarcodeScan, args: [barcode.value, selector.value, delay.value] });
}
function simulateBarcodeScan(e, t, delay) {
    console.log(delay, ""===delay)
    let maxTime = ("" === delay)? 70 : parseInt(delay)
    console.log(maxTime)
    let timeSleep = 0;
    if ("" === t || "body" === t || null === (t = document.querySelector(t))) {
        t = document.querySelector("body");
        let barcodes = e.split("\n");
        for (let i = 0; i < barcodes.length; i++){
            setTimeout(()=>{
                for (let n = 0; n < barcodes[i].length; n++) {
                    let d = barcodes[i][n].charCodeAt(0);
                    void 0 !== d && t.dispatchEvent(new KeyboardEvent("keypress", { keyCode: d }));
                }
            }, timeSleep)
            timeSleep += maxTime
        }
    } else t.value = e;
}
inputText.addEventListener("keydown", (e) => {
    (10 != e.keyCode && 13 != e.keyCode) || !e.ctrlKey || sendEvent();
}),
    submitButton.addEventListener("click", sendEvent);
