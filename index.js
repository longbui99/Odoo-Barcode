
// ==========================================
// CONFIGURATION
// ==========================================
const KEYBOARD_EVENTS = ["keypress", "keydown"];
const ENTER_KEY_CODES = [10, 13];
const NUMERIC_KEY_CODES = {
    NUMBERS: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57], // 0-9
    NUMPAD: [96, 97, 98, 99, 100, 101, 102, 103, 104, 105], // Numpad 0-9
    SPECIAL: [8, 9, 46, 37, 38, 39, 40] // Backspace, Tab, Delete, Arrow keys
};

// ==========================================
// DOM ELEMENTS
// ==========================================
let submitButton = document.getElementById("barcode-submit");
let inputText = document.getElementById("barcode-input");
let barcode = document.getElementById("barcode-input");
let selector = document.getElementById("element-input");
let delay = document.getElementById("element-input-timeout");
let imageSelector = document.getElementById("element-input-pasted");

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function isValidNumericKey(keyCode) {
    return NUMERIC_KEY_CODES.NUMBERS.includes(keyCode) ||
           NUMERIC_KEY_CODES.NUMPAD.includes(keyCode) ||
           NUMERIC_KEY_CODES.SPECIAL.includes(keyCode);
}

// ==========================================
// STORAGE FUNCTIONS
// ==========================================
if (chrome) {
    chrome.storage?.sync.get(["barcodeStorage"], function (res) {
        if (res?.barcodeStorage) {
            inputText.value = res.barcodeStorage;
        }
    });
}

function syncStorage() {
    if (chrome?.storage?.sync) {
        chrome.storage.sync.set({ barcodeStorage: inputText.value });
    }
}

// ==========================================
// MAIN EVENT FUNCTIONS
// ==========================================
async function sendEvent() {
    console.log('sendEvent called');
    console.log('Barcode value:', barcode.value);
    
    try {
        let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Active tab:', activeTab);
        
        await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: simulateBarcodeScan,
            args: [barcode.value, selector.value, delay.value]
        });
        
        console.log('Script executed successfully');
    } catch (error) {
        console.error('Error in sendEvent:', error);
    }
}

// Barcode simulation function (runs in the target page)
function simulateBarcodeScan(barcodeText, targetSelector, delayValue) {
    console.log('simulateBarcodeScan called with:', barcodeText);
    
    let maxTime = (delayValue === "" || !delayValue) ? 70 : parseInt(delayValue);
    let target = null;
    
    // Find target element
    if (targetSelector === "" || targetSelector === "body" || !(target = document.querySelector(targetSelector))) {
        target = document.querySelector("body");
        
        // For body target, dispatch keyboard events
        for (let eventKey of ["keypress", "keydown"]) {
            let barcodes = barcodeText.split("\n").filter(code => code.trim() !== "");
            let timeSleep = 0;
            setTimeout(() => {
            
                for (let i = 0; i < barcodes.length; i++) {
                    setTimeout(() => {
                        for (let charIndex = 0; charIndex < barcodes[i].length; charIndex++) {
                            let charCode = barcodes[i][charIndex].charCodeAt(0);
                            if (charCode !== undefined) {
                                target.dispatchEvent(new KeyboardEvent(eventKey, {
                                    keyCode: charCode,
                                    key: barcodes[i][charIndex]
                                }));
                            }
                        }
                    }, timeSleep);
                    timeSleep += maxTime;
                }
            }, 0); // 3s delay before starting
        }
    } else {
        // For input fields, set value directly
        target.value = barcodeText;
        // Trigger input events
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// ==========================================
// BARCODE PROCESSING FUNCTIONS
// ==========================================
function filterBarcodeRegex(barcodes) {
    let newBarcodes = [];
    for (let barcode of barcodes) {
        let match = barcode.code.match(/(.[^\?*]{3,})[\n\r\t]*/);
        if (match) {
            newBarcodes.push(barcode);
        }
    }
    return newBarcodes;
}

function pushToLoad(barcodeText) {
    inputText.value = (inputText.value + `\n${barcodeText}`).replace(/^\n/, '');
    syncStorage();
}

function copyBarcode(barcodeText) {
    navigator.clipboard.writeText(barcodeText);
}

function LoadFunction() {
    for (let e of document.querySelectorAll(".copy-barcode")) {
        e.addEventListener("click", (event) => {
            copyBarcode(event.currentTarget.getAttribute('barcode'));
        });
    }
    
    for (let e of document.querySelectorAll(".push-barcode")) {
        e.addEventListener("click", (event) => {
            pushToLoad(event.currentTarget.getAttribute('barcode'));
        });
    }
}

function InsertBarcode(barcodes) {
    let html = '';
    for (let barcode of barcodes) {
        html += `<div>
            <b>${barcode.name}</b>: 
            <span class="barcode" contenteditable="true">${barcode.code}</span> 
            <span class="copy-barcode" barcode="${barcode.code}">
                <svg width="12px" viewBox="0 0 512 512">
                    <path d="M502.6 70.63l-61.25-61.25C435.4 3.371 427.2 0 418.7 0H255.1c-35.35 0-64 28.66-64 64l.0195 256C192 355.4 220.7 384 256 384h192c35.2 0 64-28.8 64-64V93.25C512 84.77 508.6 76.63 502.6 70.63zM464 320c0 8.836-7.164 16-16 16H255.1c-8.838 0-16-7.164-16-16L239.1 64.13c0-8.836 7.164-16 16-16h128L384 96c0 17.67 14.33 32 32 32h47.1V320zM272 448c0 8.836-7.164 16-16 16H63.1c-8.838 0-16-7.164-16-16L47.98 192.1c0-8.836 7.164-16 16-16H160V128H63.99c-35.35 0-64 28.65-64 64l.0098 256C.002 483.3 28.66 512 64 512h192c35.2 0 64-28.8 64-64v-32h-47.1L272 448z"/>
                </svg>
            </span> 
            <span class="push-barcode" barcode="${barcode.code}">
                <svg width="10px" viewBox="0 0 320 512">
                    <path d="M285.1 145.7c-3.81 8.758-12.45 14.42-21.1 14.42L192 160.1V480c0 17.69-14.33 32-32 32s-32-14.31-32-32V160.1L55.1 160.1c-9.547 0-18.19-5.658-22-14.42c-3.811-8.758-2.076-18.95 4.408-25.94l104-112.1c9.498-10.24 25.69-10.24 35.19 0l104 112.1C288.1 126.7 289.8 136.9 285.1 145.7z"/>
                </svg>
            </span>
        </div>`;
    }
    imageSelector.innerHTML += html;
    
    if (barcodes.length > 0) {
        setTimeout(LoadFunction, 1);
    }
}

async function readBarcodeFromBase64Image(tag, imageTag, base64) {
    const callbacks = (barcode) => {
        if (barcode !== 'error decoding QR Code') {
            InsertBarcode([{
                name: "QR",
                code: barcode
            }]);
        }
    };
    
    loadQRBarcode(base64, callbacks);
    
    let LinearBarcodes = await loadLinearBarcode(imageTag);
    LinearBarcodes = filterBarcodeRegex(LinearBarcodes);
    InsertBarcode(LinearBarcodes);
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================
// Toggle buttons for element input
for (let e of document.querySelectorAll(".hdl-button")) {
    e.addEventListener("click", () => {
        let element = document.querySelector("#element-input");
        let newClass = element.classList.contains("hide") ? "show" : "hide";
        element.classList.remove("hide", "show");
        element.classList.add(newClass);
    });
}

// Toggle buttons for timeout input
for (let e of document.querySelectorAll(".hdl-button-timeout")) {
    e.addEventListener("click", () => {
        let element = document.querySelector("#element-input-timeout");
        let newClass = element.classList.contains("hide") ? "show" : "hide";
        element.classList.remove("hide", "show");
        element.classList.add(newClass);
    });
}

// Delay input validation - only allow numeric keys
delay.addEventListener('keydown', event => {
    if (!isValidNumericKey(event.keyCode)) {
        event.preventDefault();
    }
});

// Auto-save on input
inputText.addEventListener("keyup", syncStorage);

// Submit on Ctrl+Enter
inputText.addEventListener("keydown", (event) => {
    if (ENTER_KEY_CODES.includes(event.keyCode) && event.ctrlKey) {
        sendEvent();
    }
});

// Submit button click
submitButton.addEventListener("click", (event) => {
    console.log('Submit button clicked');
    event.preventDefault();
    sendEvent();
});

// Paste image handling
document.addEventListener("paste", function(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    for (const index in items) {
        const item = items[index];
        if (item.kind === 'file') {
            const blob = item.getAsFile();
            const reader = new FileReader();
            
            reader.onload = async function(event) {
                let image = document.createElement('img');
                image.src = event.target.result;
                imageSelector.innerHTML = '';
                await readBarcodeFromBase64Image(imageSelector, image, event.target.result);
            };
            
            reader.readAsDataURL(blob);
            break; // Only process first image
        }
    }
});
