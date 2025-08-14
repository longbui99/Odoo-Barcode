
// DOM Elements
const elements = {
    submitButton: document.getElementById("barcode-submit"),
    inputText: document.getElementById("barcode-input"),
    selector: document.getElementById("element-input"),
    delay: document.getElementById("element-input-timeout"),
    imageSelector: document.getElementById("element-input-pasted")
};

// Constants
const DEFAULT_DELAY = 70;
const LINE_DELAY = 500;
const KEYBOARD_EVENTS = ["keypress", "keydown"];
const ENTER_KEY_CODES = [10, 13];

// Utility Functions
function isNumericKey(keyCode) {
    return (keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105);
}

function toggleElementVisibility(elementId) {
    const element = document.querySelector(elementId);
    const newClass = element.classList.contains("hide") ? "show" : "hide";
    element.classList.remove("hide", "show");
    element.classList.add(newClass);
}

// Storage Functions
function syncStorage() {
    if (chrome?.storage?.sync) {
        chrome.storage.sync.set({ barcodeStorage: elements.inputText.value });
    }
}

function loadStoredBarcode() {
    if (chrome?.storage?.sync) {
        chrome.storage.sync.get(["barcodeStorage"], (result) => {
            if (result?.barcodeStorage) {
                elements.inputText.value = result.barcodeStorage;
            }
        });
    }
}

// Barcode Processing Functions
function filterBarcodeRegex(barcodes) {
    return barcodes.filter(barcode => {
        const match = barcode.code.match(/(.[^\?*]{3,})[\n\r\t]*/);
        return match !== null;
    });
}

function copyBarcode(barcodeText) {
    navigator.clipboard.writeText(barcodeText);
}

function pushToLoad(barcodeText) {
    elements.inputText.value = (elements.inputText.value + `\n${barcodeText}`).replace(/^\n/, '');
    syncStorage();
}

// Multi-line Barcode Simulation (runs in separate event loop)
async function simulateBarcodeSequence(barcodes, target, maxTime) {
    return new Promise((resolve) => {
        let timeSleep = 0;
        
        // Use setTimeout to run in a separate event loop
        setTimeout(() => {
            for (const eventKey of KEYBOARD_EVENTS) {
                barcodes.forEach((barcode, barcodeIndex) => {
                    setTimeout(() => {
                        for (let charIndex = 0; charIndex < barcode.length; charIndex++) {
                            const charCode = barcode[charIndex].charCodeAt(0);
                            if (charCode !== undefined) {
                                target.dispatchEvent(new KeyboardEvent(eventKey, { 
                                    keyCode: charCode, 
                                    key: barcode[charIndex] 
                                }));
                            }
                        }
                        
                        // Resolve when last barcode is processed
                        if (barcodeIndex === barcodes.length - 1) {
                            resolve();
                        }
                    }, timeSleep);
                    
                    timeSleep += maxTime;
                });
            }
        }, LINE_DELAY); // Run in next event loop
    });
}

// Single Barcode Simulation
function simulateSingleBarcode(barcodeText, target) {
    target.value = barcodeText;
}

// Main Barcode Simulation Function
async function simulateBarcodeScan(barcodeText, targetSelector, delayValue) {
    console.log('Simulating barcode scan:', barcodeText);
    
    const maxTime = delayValue === "" ? DEFAULT_DELAY : parseInt(delayValue);
    let target = document.querySelector(targetSelector);
    
    // Default to body if no valid target found
    if (!targetSelector || targetSelector === "body" || !target) {
        target = document.querySelector("body");
    }
    
    const barcodes = barcodeText.split("\n").filter(code => code.trim() !== "");
    
    // Handle multi-line barcodes in separate event loop
    if (barcodes.length > 1 && target === document.querySelector("body")) {
        await simulateBarcodeSequence(barcodes, target, maxTime);
    } else {
        // Single barcode or input field target
        simulateSingleBarcode(barcodeText, target);
    }
}

// Chrome Extension Functions
async function sendBarcodeEvent() {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: simulateBarcodeScan,
            args: [elements.inputText.value, elements.selector.value, elements.delay.value]
        });
    } catch (error) {
        console.error('Error sending barcode event:', error);
    }
}

// UI Functions
function createBarcodeHTML(barcode) {
    return `
        <div>
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

function insertBarcodes(barcodes) {
    const html = barcodes.map(createBarcodeHTML).join('');
    elements.imageSelector.innerHTML += html;
    
    if (barcodes.length > 0) {
        // Use setTimeout to ensure DOM is updated before attaching listeners
        setTimeout(attachBarcodeEventListeners, 1);
    }
}

function attachBarcodeEventListeners() {
    // Copy barcode functionality
    document.querySelectorAll(".copy-barcode").forEach(element => {
        element.addEventListener("click", (event) => {
            const barcodeText = event.currentTarget.getAttribute('barcode');
            copyBarcode(barcodeText);
        });
    });
    
    // Push barcode functionality
    document.querySelectorAll(".push-barcode").forEach(element => {
        element.addEventListener("click", (event) => {
            const barcodeText = event.currentTarget.getAttribute('barcode');
            pushToLoad(barcodeText);
        });
    });
}

// Image Processing Functions
async function readBarcodeFromBase64Image(imageTag, base64) {
    // QR Code processing
    const qrCallback = (barcode) => {
        if (barcode !== 'error decoding QR Code') {
            insertBarcodes([{
                name: "QR",
                code: barcode
            }]);
        }
    };
    
    loadQRBarcode(base64, qrCallback);
    
    // Linear barcode processing
    try {
        let linearBarcodes = await loadLinearBarcode(imageTag);
        linearBarcodes = filterBarcodeRegex(linearBarcodes);
        insertBarcodes(linearBarcodes);
    } catch (error) {
        console.error('Error processing linear barcodes:', error);
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Toggle buttons for element input
    document.querySelectorAll(".hdl-button").forEach(button => {
        button.addEventListener("click", () => {
            toggleElementVisibility("#element-input");
        });
    });
    
    // Toggle buttons for timeout input
    document.querySelectorAll(".hdl-button-timeout").forEach(button => {
        button.addEventListener("click", () => {
            toggleElementVisibility("#element-input-timeout");
        });
    });
    
    // Numeric input validation for delay
    elements.delay.addEventListener('keydown', (event) => {
        if (!isNumericKey(event.keyCode)) {
            event.preventDefault();
        }
    });
    
    // Auto-save on input
    elements.inputText.addEventListener("keyup", syncStorage);
    
    // Submit on Ctrl+Enter
    elements.inputText.addEventListener("keydown", (event) => {
        if (ENTER_KEY_CODES.includes(event.keyCode) && event.ctrlKey) {
            sendBarcodeEvent();
        }
    });
    
    // Submit button click
    elements.submitButton.addEventListener("click", sendBarcodeEvent);
    
    // Paste image handling
    document.addEventListener("paste", (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (const item of items) {
            if (item.kind === 'file') {
                const blob = item.getAsFile();
                const reader = new FileReader();
                
                reader.onload = async (readerEvent) => {
                    const image = document.createElement('img');
                    image.src = readerEvent.target.result;
                    elements.imageSelector.innerHTML = '';
                    
                    await readBarcodeFromBase64Image(image, readerEvent.target.result);
                };
                
                reader.readAsDataURL(blob);
                break; // Process only the first image
            }
        }
    });
}

// Initialization
function init() {
    loadStoredBarcode();
    setupEventListeners();
}

// Start the application
init();
