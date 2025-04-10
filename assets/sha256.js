/*
 * Javascript code for the sha256.htm page.
 * 
 * 2025-03-07
 * 2025-03-14 toggle the Expected box placeholer.
 * 2025-03-20 process the Expected url parameter.
 * 2025-04-10 some fixes and improvements.
 */

/**
 * Initialization, event handlers etc.
 * @param {*} options some options {wasmUrl, fileDropElement, inputElement, expectedElement, expectedPlaceholder,
 *                                  resultElement, compareElement, statElement, progressElement, messageElement,
 *                                  dropReadyCss, dropDisabledCss, dropZoneText, resultCss, flashCss, compareMatchCss, compareNoMatchCss,
 *                                  textMatch, textNoMatch}
 */
async function sha256page (options) {

  'use strict';

  const WASM_MEM_START = 2048; // starting address for the input (size of the file chunk) and output (64 + 1 bytes)
  const CHUNK_SIZE = 5 * 1024 * 1024;         // bytes
  const LARGE_FILE_BYTES = 100 * 1024 * 1024; // for estimating the time left
  const STAT_THRESHOLD_MS = 300; // when processing time is longer than statistics is shown
  const numberFormat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true});

  const INPUTS_STATE = {
    Enabled: true,
    Disabled: false
  };

  const reExpected = /^[a-f0-9]+$/i;

  let wasmUrl = options.wasmUrl;
  let fileDropElement = document.getElementById(options.fileDropElement);
  let fileInputElement = document.getElementById(options.fileElement);
  let expectedInputElement = document.getElementById(options.expectedElement);
  let expectedPlaceholderElement = document.getElementById(options.expectedPlaceholder);
  let resultElement = document.getElementById (options.resultElement);
  let compareElement = document.getElementById (options.compareElement);
  let progressElement = document.getElementById (options.progressElement);
  let statElement = document.getElementById (options.statElement);
  let messageElement = document.getElementById (options.messageElement);

  let dropZoneText = options.dropZoneText;
  let dropReadyCss = options.dropReadyCss;
  let dropDisabledCss = options.dropDisabledCss;
  let resultCss = options.resultCss; // adds border and background
  let flashCss = options.flashCss    // flashes results after process complete
  let compareMatchCss = options.compareMatchCss;
  let compareNoMatchCss = options.compareNoMatchCss;

  let TEXT = {
    match: options.textMatch,
    noMatch: options.textNoMatch
  };

  const statusHandler = StatusHandler ();

  let wm;
  let wasmParams = {
    env: {
        memory_base: 0,
        table_base: 0,
        memory : new WebAssembly.Memory({ initial: 256, maximum: 256}), // as in the wasm file
        table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
        emscripten_memcpy_big: function (dest, src, num) {
          // simple memcpy function requested in WAMS module, dnw
          const memory = new Uint8Array(wm.memory.buffer);
          memory.set(memory.subarray(src, src + num), dest);
        }
    }          
  };

  // Process the url parameters
  (function(){

    let urlParameters = T.getUrlParameters();

    if (typeof urlParameters.expected !== 'undefined' &&
        urlParameters.expected !== '') {

      // if there are several parameters with the name "expected" then array is returned, use it's first element
      let expectedValue = (typeof urlParameters.expected === 'string')? urlParameters.expected : urlParameters.expected[0];

      // validate
      if (reExpected.test (expectedValue)) {
        expectedInputElement.value = expectedValue;
      }

    }

  })()

  setExpectedPlaceholderState (); // visible when the box is empty

  wm = await loadWasm (wasmUrl, wasmParams);

  if (wm === null) {
    resultElement.innerText = 'Something went wrong: the WASM module was not loaded.';
    return;
  }

  fileDropElement.innerHTML = dropZoneText;
  fileInputElement.disabled = false;


  /**
   * Handles the file selected event
   */
  fileInputElement.addEventListener("change", function(e) {
    computeSha256 (e.target.files, statusHandler);
  });

  fileInputElement.addEventListener('keypress', function(e) { 
    if (e.key === 'Enter') {
      computeSha256 (e.target.files, statusHandler);
    }
  });

    // drag-and-drop events
  fileDropElement.addEventListener ('dragenter', function(e){
    e.stopPropagation();
    e.preventDefault();
    fileDropElement.classList.add(dropReadyCss);
  });

  fileDropElement.addEventListener ('dragleave', function(e){
    e.stopPropagation();
    e.preventDefault();
    fileDropElement.classList.remove(dropReadyCss);
  });

  fileDropElement.addEventListener ('dragover', function(e){
    e.stopPropagation();
    e.preventDefault();
  });
      
  fileDropElement.addEventListener ('drop', function(e){

    var dt = e.dataTransfer;

    e.stopPropagation();
    e.preventDefault();

    fileDropElement.classList.remove(dropReadyCss);

    computeSha256(dt.files, statusHandler);

  });

  /**
   * Handles input into the expected value
   */
  expectedInputElement.addEventListener ('input', function(e){

    // hide or show the placeholder
    setExpectedPlaceholderState ();

    compareSha256Values();
  });

  /**
   * Computes SHA-256 checksum of the file
   * @param {*} files selected files to process.
   * @param {*} handlers the progress status handlers {start(file), progress(bytesProcessed), finish(sha256value), error(text)}
   */
  async function computeSha256 (files, handlers) {

    let oneFileWarning = false;

    if (files.length === 0) {
      handlers.error ('Please, select a file.');
      return;
    }

    if (files.length > 1) {
      oneFileWarning = true;
    }

    let file = files[0];

    handlers.start (file);

    try {

      wm.sha256init();
  
      let offset = 0;
      let progressTotalBytes = file.size; // bytes
  
      // process the file sequentially
      await wasmProcessChunks (file, CHUNK_SIZE, handlers);
      
      // Prepare output buffer for the digest
      const outputHexPtr = WASM_MEM_START + CHUNK_SIZE + 1; // Assuming output starts after input and null terminator
      const outputHexBuffer = new Uint8Array(wm.memory.buffer, outputHexPtr, 65); // 64 characters + null terminator
      
      // Ensure the output buffer is within the allocated memory
      if (outputHexPtr + outputHexBuffer.length > wm.memory.buffer.byteLength) {
        handlers.error ('Something went wrong. Computing SHA256: not enough memory allocated for output buffer.');
        T.log ('WASM Memory');
        return;
      }
      
      // Call the digest function
      wm.sha256digest (outputHexPtr);
  
      // Read the output from WASM memory
      const hexString = String.fromCharCode.apply(null, outputHexBuffer.subarray(0, 64));

      handlers.finish (hexString, oneFileWarning);

    } catch (err) {
        handlers.error ('Something went wrong. An error occurred while calculating the checksum of the file.');
        T.log ('Compute error');
    }
      
  }

  /**
   * Processes the file in chunks and call Wasm function on each chunk.
   */
  async function wasmProcessChunks (file, chunkSize, handlers) {

    let offset = 0;
    let codeLine = 0;


    while (offset < file.size) {

      const end = Math.min(offset + chunkSize, file.size); // Calculate the end position of the current chunk
      const chunk = file.slice(offset, end); // Get a blob slice for the current chunk

      try {
        // Await the reading of the chunk as an ArrayBuffer
        codeLine = 1;
        const arrayBuffer = await readBlob(chunk);
        const chunkLength = arrayBuffer.byteLength;

        // Create a Uint8Array view for the wasm memory buffer at the allocated position.
        // 0 - the input data always in the buffer beginning
        codeLine = 2;
        const wasmMemoryArray = new Uint8Array(wm.memory.buffer, WASM_MEM_START, chunkLength);

        // Copy chunk data from the ArrayBuffer into wasmMemoryArray
        codeLine = 3;
        wasmMemoryArray.set(new Uint8Array(arrayBuffer));

        // Call the update function
        codeLine = 4;
        wm.sha256update(WASM_MEM_START, chunkLength);
        handlers.progress (offset);

      } catch (error) {
        handlers.error ('Something went wrong. Error processing the file chunk.');
        T.log (`WASM Chunk (${codeLine})`);
        break;
      }

      // Advance the offset by the chunk size read
      offset += chunkSize;
    }
  }

  /** Calculates and shows the progress of processing a file */
  function getProgress (done, total, timerStart) {

    let progressPercent = (done / total) * 100;
  
    let estimatedTime = function(bytesDone, totalBytes){
      // returns string, estimated time left for large files
      if (totalBytes < LARGE_FILE_BYTES) { return ''; }
      var bytesLeft = totalBytes - done;
      var duration = performance.now() - timerStart; // ms
      if (duration < 1) { return ''; }
      var bytesPerMs = bytesDone / duration; // done part performance, bytes per ms
      if (bytesPerMs < 1) { return ''; }
      return `, approximate wait time: ${(0.001 * bytesLeft / bytesPerMs ).toFixed(1)} sec.`;
    }
  
    return `${progressPercent.toFixed (2)}%${estimatedTime (done, total)}`;
  }
  
  /**
   * Utility function to read a Blob as ArrayBuffer
   */
  function readBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
    * Returns string with the file size.
    * @param {number} size
    * @returns {String}
    */
  function formatFileSize(size) {

    var FMT = {minimumFractionDigits: 0, maximumFractionDigits: 1};
    var bytesFormat = new Intl.NumberFormat ({minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true});
    var KB = 1024;       // 2^10
    var MB = 1048576;    // 2^20
    var GB = 1073741824; // 2^30
    var t = '';

    if (size >= GB) {
      t = T.formatNumber(size/GB, 'en-US', FMT) + ' GB, ';
    }
    else if (size >= MB) {
      t = T.formatNumber(size/MB, 'en-US', FMT) + ' MB, ';
    }
    else if (size >= KB) {
      t = T.formatNumber(size/KB, 'en-US', FMT) + ' KB, ';
    }

    t += bytesFormat.format (size) + ' byte(s)';

    return t;
  }

  /**
   * Sets the Expected box placeholder visibility depending on the box value.
   */
  function setExpectedPlaceholderState () {

    if (expectedInputElement.value) {
      expectedPlaceholderElement.style.display = 'none';
    } else {
      expectedPlaceholderElement.style.display = 'block';
    }

  }

  /**
   * Enables or disables input elements.
   * @param {boolean} isEnabled
   */
  function setInputsState (isEnabled) {

    fileInputElement.disabled = !isEnabled;
    expectedInputElement.disabled = !isEnabled;

    if (isEnabled) {
      fileDropElement.classList.remove (dropDisabledCss);
    }
    else {
      fileDropElement.classList.add (dropDisabledCss);
    }

  }

  /**
   * The page interface - the process status handlers, the state variables, etc.
   * @returns { {start, progress, finish, error} }
   */
  function StatusHandler () {

    let fileName = '';
    let totalBytes = 0;
    let sha256value = '';
    let timerStart = undefined;

    return {
      start: onStart,
      progress: onProgress,
      finish: onDone,
      error: onError
    };

    /** Called on the process start */
    function onStart(file) {

      fileName = file.name;
      totalBytes = file.size;
      sha256value = '';

      resultElement.innerText = '';
      compareElement.innerText = '';
      compareElement.innerText = '';
      progressElement.innerText = '0%';
      statElement.innerText = '';

      messageElement.innerText = '';
      messageElement.style.display = 'none';

      setInputsState (INPUTS_STATE.Disabled);

      timerStart = performance.now();
    }
  
    /**
     * Called in the middle of processing once or several times.
     * @param {Number} bytesProcessed
     */
    function onProgress(bytesProcessed) {
        progressElement.innerHTML = getProgress (bytesProcessed, totalBytes, timerStart);
    }
  
    /**
     * Called when the process is finished
     * @param {String} computedSha256value the computed value.
     */
    function onDone(computedSha256value, oneFileWarning) {

      let warning = oneFileWarning? 'Only one file was processed<br>' : '';

      sha256value = computedSha256value;

      const duration = performance.now() - timerStart;

      setInputsState (INPUTS_STATE.Enabled);
      progressElement.innerText = '';
      resultElement.dataset.sha256 = computedSha256value;
      resultElement.innerHTML =
        '<div><b>SHA-256</b></div>' +
        `<div class="${resultCss} ${flashCss}">${sha256value}</div>`;

      statElement.innerHTML =
        warning +
        `<span>File:</span> ${fileName}<br>` +
        `<span>Size:</span> ${formatFileSize (totalBytes)}<br>`;

      if (duration > STAT_THRESHOLD_MS) {
        statElement.innerHTML +=
        `<span>Elapsed time:</span> ${(duration / 1000).toFixed(2)} s<br>` +
        `<span>Performance:</span> ${numberFormat.format(totalBytes / duration)} bytes per ms`;
      }

      compareSha256Values ();

      T.log (`Computed in ${(duration / 1000).toFixed(2)}`);
    }
  
    /**
     * Called on error.
     * @param {String} text the error text
     */
    function onError(text) {
      var element = document.createElement('div');
      element.textContent = 'Something went wrong. ' + text;
      element.classList.add('page-message');
      element.classList.add('page-message--error');
      messageElement.textContent = '';
      messageElement.appendChild (element);
      messageElement.style.display = 'block';
      setInputsState (INPUTS_STATE.Enabled);
    }

  }

  /**
   * Compares actual and expected (if present) values of SHA-256
   * and shows the mark.
   */
  function compareSha256Values () {

    const expected = expectedInputElement.value.replace(/[\s\-]+/g, '');
    let text = '';
    let actual = (resultElement.dataset.sha256 || '').trim();

    compareElement.classList.remove (compareMatchCss);
    compareElement.classList.remove (compareNoMatchCss);

    if (actual !== undefined && actual !== '' && expected !== '') {

      if (expected.toLowerCase() === actual.toLowerCase()) {
        text = TEXT.match;
        compareElement.classList.add (compareMatchCss);
      }
      else {
        text = TEXT.noMatch;
        compareElement.classList.add (compareNoMatchCss);
      }

    }

    compareElement.innerText = text;
  }

  /**
   * Loads the WASM file and instantiates it.
   * @param {String} url the url of the WASM file
   * @param {*} params the instance parameters
   * @returns {*} the WASM instance or null.
   */
  async function loadWasm (url, params) {

    let wasmInstance;

    try {
      if ('instantiateStreaming' in WebAssembly) {
        // Fetch and instantiate the Wasm module in one step
        const response = await fetch(url);
        wasmInstance = await WebAssembly.instantiateStreaming(response, params);
      } else {
        // Fallback for environments that don't support instantiateStreaming
        const response = await fetch(url);
        const bytes = await response.arrayBuffer();
        wasmInstance = await WebAssembly.instantiate(bytes, params);
      }

      // Return the instance for further use
      return {
        instance: wasmInstance,
        memory: wasmInstance.instance.exports.memory,
        sha256init: wasmInstance.instance.exports.init_sha256,
        sha256update: wasmInstance.instance.exports.update_sha256,
        sha256digest: wasmInstance.instance.exports.digest_sha256,
      };

    }
    catch (err) {
      statusHandler.error('Wasm module was not loaded.');
      T.log ('WASM not loaded');
      return null;
    }

  }

}

