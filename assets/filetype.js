/*
 * Javascript code for the file.htm page.
 * 
 * 2022-08-12
 * 2022-08-13 isTextFile() added, fix for empty files.
 * 2022-08-14 code corrections, wasm function parameter added.
 * 2022-08-15 code corrections.
 * 2022-08-26 logging added, some corrections.
 * 2022-08-31 link added to CRD type description
 * 2023-10-02 JXR description added.
 * 2024-08-20 JXL description added.
 * 2024-10-23 HEIC description added.
 * 2024-10-24 HDF4 and HDF5 descriptions added.
 * 2025-04-05 LNK added.
 * 2025-06-20 DSF, DFF (DSD) added.
 * 2025-06-22 separate detection of the JPEG JFIF.
 * 2025-07-04 Apple M4V, M4A added; reading first bytes of a file.
 * 2025-07-08 Apple AAC in ADTS and MP2 added.
 * 2025-08-17 ICS, VCF (vCard), VCF (Variant Call) text formats added.
 * 2025-08-25 TIFF(be/le) descriptions modified
 * 2025-09-01 SQLite v3 description updated
 * 2025-09-06 DNG added
 * 2025-12-12 global keyboard handling, press F to select a file.
 * 2025-12-14 prints "unknown" the the file MIME type is not defined.
 * 2026-01-04 image thumbnail added.
 * 2026-01-12 AC3 added.
 * 2026-01-14 parsing the AC3 header.
 * 2026-02-11, 2026-02-16 parsing the AC3 header, fixes.
 * 2026-04-15 parsing mkv, extracting the title, duration and tracks.
 */

/**
 * Initialization, event handlers and all functions.
 * @param {*} options
 */
function fileTypePage(options) {

  'use strict';

  // Number of bytes to read from the start of the file.
  // NOTES:
  // * longest signature is 39 bytes
  // * the TAR signatue is 7 bytes at offset 257
  var HEAD_BYTES = 1024;

  var UNKNOWN = ''; // value returned by the WASM function if the type was not determined.

  var fileDropZone = document.getElementById ('file-target');
  var fileElement = document.getElementById ('input-file');
  var resultElement = document.getElementsByClassName('file-signature')[0];
  var fileInfoElement = document.getElementsByClassName('file-info')[0];
  var loader = new Loader(options.loaderCss);

  var wasmUrl = options.wasmUrl;
  var dropReadyCss = options.dropReadyCss;
  var flashCss = options.flashCss;

  var LNK_SIZE_MIN = 500; // bytes
  var LNK_SIZE_MAX = 100 * 1024; // bytes
  var LNK_SIZE_MESSAGE = options.textLnkSize;

  var _wasmModule = {};

  // TODO: process file list

  /** Definitions */
  /*
   * When the list changed uncomment the listAllDescriptions function and use this code to generate html code:
   * 
   * <div class="list-all"></div>
   * var listAll = document.getElementsByClassName('list-all')[0].innerHTML = listAllDescriptions(SIGNATURES);
   */
  
  var SIGNATURES = {

    // graphics
    'JPEG': {description: 'JPEG, lossy compressed image file'},
    'JPEG2000': {description: 'JPEG 2000 file'},
    'JXR': {description: 'JPEG XR (extended range) file'},
    'JXL': {description: 'JPEG XL file, jxl - supports both lossy and lossless compressions, as well as alpha channels and HDR'},
    'PNG': {description: 'png, Image encoded in the Portable Network Graphics format'},
    'webp': {description: 'Google WebP image file'},
    'ani':  {description: 'Animated cursor'},
    'CanonRAW': {description: 'Canon RAW Format Version 2'},
    'xcf': {description: 'XCF file, GIMP native'},
    'GIF87a': {description: 'gif, Image file encoded in the Graphics Interchange Format (GIF87a)'},
    'GIF89a': {description: 'gif, Image file encoded in the Graphics Interchange Format (GIF89a)'},
    'ttf': {description: 'TrueType font'},
    'ICO': {description: 'A computer icon encoded in the ICO file format'},
    'PSD': {description: 'Adobe Photoshop\'s native file'},
    'AppleIcon': {description: 'Apple Icon Image format'},
    'TIFF(le)': {description: 'TIFF, Tagged Image File Format, Intel/little-endian'},
    'TIFF(be)': {description: 'TIFF, Tagged Image File Format, Motorola/big-endian'},
    'DNG': {description: 'DNG, Digital Negative: a raw image format from cameras and phones for enhanced editing'},
    'bmp': {description: 'BMP file, a bitmap format used mostly in the Windows world'},
    'wmf': {description: 'wmf, Windows Metafile, image file'},
    'OpenEXR': {description: 'OpenEXR image'},
    'BPG': {description: 'Better Portable Graphics format'},
    'Cineon': {description: 'Kodak Cineon image'},
    'FLIF': {description: 'Free Lossless Image Format'},
    'FH8': {description: 'FreeHand 8 document'},
    'FH9': {description: 'FreeHand 9 document'},
    'EPS3.0': {description: 'Encapsulated PostScript file version 3.0'},
    'EPS3.1': {description: 'Encapsulated PostScript file version 3.1'},
    'PostScript': {description: 'PostScript document'},
    'TOX': {description: 'Open source portable voxel file'},
    'otf': {description: 'OpenType font'},
    'woff': {description: 'WOFF File Format 1.0'},
    'woff2': {description: 'WOFF File Format 2.0'},
    'icm': {description: 'icm, ICC profile, color correction'},
    'SWF': {description: 'swf, Adobe Flash'},

    // audio
    'mp3ID3v2': {description: 'MP3 file with an ID3v2 container'},
    'mp3': {description: 'MP3, MPEG-1 Layer 3 file without an ID3 tag or with an ID3v1 tag'},
    'FLAC': {description: 'FLAC, Free Lossless Audio Codec'},
    'AIFF': {description: 'AIFF, Audio Interchange File Format'},
    'wav':  {description: 'WAV, Waveform Audio File Format'},
    'OGGS': {description: 'Ogg, an open source media container format'},
    'm4a': { description: 'M4A, Apple Lossless Audio Codec (ALAC) or AAC audio file, ISO media' },
    'AAC-ADTS': { description: 'An audio file containing AAC (Advanced Audio Coding) in ADTS (Audio Data Transport Stream) format, optimized for streaming and broadcasting'},
    'MP2': { description: 'An audio file using MPEG-1 Layer 2 (MP2) format, designed for broadcasting and digital radio transmission'},
    'MIDI': {description: 'MID, MIDI, a Musical Instrument Digital Interface file, sound file'},
    'DSF': {description: '<b>DSF</b> (DSD Storage Facility) is a high-resolution audio file format that stores Direct Stream Digital (DSD) audio data, commonly used for high-fidelity music playback.'},
    'DFF': {description: '<b>DFF</b> (DSD Interchange File Format) is a high-resolution audio file format that stores Direct Stream Digital (DSD) audio data, commonly used for high-fidelity music playback.'},
    'AC3': {description: 'AC3, compressed surround sound, AC-3 aka ATSC A/52 aka Dolby Digital stream, typically for DVDs.'},

    // video
    'avi':  {description: 'avi, Audio Video Interleave video format'},
    'ebml-matroska': {description: 'Matroska (MKV/MKA/MKS/MK3D) is a multimedia container format for video, audio, and subtitles'},
    'ebml-webm': {description: 'WebM is a web-optimized version of Matroska for media streaming'},
    'ebml-unknown': {description: 'EBML (Extensible Binary Meta Language) is a binary markup format for structured data storage'},
    'ASF-WMA-WMV': {description: 'asf, wma, wmv - Advanced Systems Format'},
    'mp4': {description: 'mp4 - ISO Base Media file (MPEG-4)'},
    'av1': {description: 'AV1 - video file encoded using the AV1 codec with efficient compression'},
    'avif': {description: 'AVIF - image file that uses AV1 video codec for image compression'},
    'heic': {description: 'HEIC/HEIF - High Efficiency Image Container (or Format) for images, image sequences, other media streams.'},
    'ftyp3g': {description: '3rd Generation Partnership Project 3GPP and 3GPP2 multimedia files'},
    'MLV': {description: 'Canon Magic Lantern Video file'},
    'MPEG-Stream': {description: 'MPEG Program Stream'},
    'MPEG-Video': {description: 'MPEG-1 video and MPEG-2 video'},
    'MPEG-Transport': {description: 'ts, tsv, tsa, mpg, mpeg - MPEG Transport Stream (MPEG-2 Part 1)'},
    'MOV': {description: 'Apple QuickTime MOV, a video container'},
    'm4v': {description: 'M4V, Apple iTunes Video, ISO media'},
    'FLV': {description: 'flv, Flash Video file'},
    'PIC-PIF-SEA-OCR': {description: 'PIC (IBM Storyboard bitmap file) or PIF (Windows Program Information File)' +
                        ' or SEA (Mac Stuffit Self-Extracting Archive) or YTR (IRIS OCR data file)'},

    //other
    'PDF': {description: 'PDF document'},
    'DJVU': {description: 'DjVu document'},
    'OfficeOld': {description: 'Compound File Binary Format, a container format defined by Microsoft COM.' +
              ' It can contain the equivalent of files and directories.' +
              ' It is used by <b>Windows Installer</b> and for documents in <b>older versions of Microsoft Office</b>.'},
    'MDB': {description: 'Microsoft Access MDB, Jet DB'},
    'AppleWorks5': {description: 'AppleWorks 5 document'},
    'AppleWorks6': {description: 'AppleWorks 6 document'},
    'CRD-RRG': {description: 'crd, Microsoft Windows Cardfile Database Format, the file signature is RRG. The <a href="crd-reader.htm"><b>CRD Reader</b></a> command line application can read this kind of files.'},
    'CRD-MGC': {description: 'crd, Microsoft Windows Cardfile Database Format, the file signature is MGC. The <a href="crd-reader.htm"><b>CRD Reader</b></a> command line application can read this kind of files.'},

    'SQLite3': {description: 'SQLite version 3 database'},
    'HDF4': {description: 'HDF4 -  Hierarchical Data Format version 4, scientific data in a hierarchical organization'},
    'HDF5': {description: 'HDF5 -  Hierarchical Data Format version 5, for large and complex scientific data in a hierarchical organization, also commonly used in machine learning'},
    'dcr':  {description: 'Adobe Shockwave file'},
    'dir':  {description: 'Macromedia Director file'},
    'WinHtmlHelp': {description: 'chm, Microsoft Windows HtmlHelp file'},
    'OracleVMDisk': {description: 'VirtualBox Virtual Hard Disk'},
    'vhd':  {description: 'Windows Virtual PC Virtual Hard Disk'},
    'vhdx': {description: 'Windows Virtual PC Windows 8 Virtual Hard Disk file'},
    'evtx': {description: 'Windows Event Viewer XML file'},
    'PuTTY-key2': {description: 'PuTTY private key file version 2'},
    'PuTTY-key3': {description: 'PuTTY private key file version 3'},
    'pem-crt': {description: 'PEM encoded X.509 certificate'},
    'pem-csr': {description: 'PEM encoded X.509 Certificate Signing Request'},
    'pem-key': {description: 'PEM encoded X.509 PKCS#8 private key'},
    'pem-DSAkey': {description: 'PEM encoded X.509 PKCS#1 DSA private key'},
    'pem-RSAkey': {description: 'PEM encoded X.509 PKCS#1 RSA private key'},

    'arj': {description: 'ARJ compressed file'},
    'ZIP': {description: 'zip file format and formats based on it, such as EPUB, JAR, ODF, OOXML'},
    'LZIP': {description: 'lzip compressed file'},
    '7z': {description: '7-Zip File Format'},
    'gz': {description: 'GZIP compressed file'},
    'RAR1.5': {description: 'rar, Roshal ARchive compressed archive v1.50 onwards'},
    'RAR5':   {description: 'rar, Roshal ARchive compressed archive v5.00 onwards'},
    'xz': {description: 'xz, tar.xz - XZ compressed file, LZMA2 compression'},
    'LZ4': {description: 'LZ4 compressed file'},
    'XAR': {description: 'xar, eXtensible ARchive format'},
    'TAR': {description: 'tar archive'},
    'tar-LZW': {description: 'Compressed file (often tar zip) using Lempel-Ziv-Welch algorithm'},
    'tar-LZH': {description: 'Compressed file (often tar zip) using LZH algorithm'},

    'deb': {description: 'Linux deb file'},
    'rpm': {description: 'RedHat Package Manager (RPM) package'},
    'MS-SDI': {description: 'SDI, System Deployment Image, a disk image format used by Microsoft'},
    'WinUpdDelta': {description: 'Windows Update Binary Delta Compression file'},
    'iso-sdi': {description: 'cdi, CD-i CD image file'},
    'elf': {description: 'Executable and Linkable Format'},
    'DosMZ': {description: 'DOS MZ executable and its descendants (including NE and PE)'},
    'DosZM': {description: 'DOS ZM executable and its descendants (rare)'},
    'CPM3': {description: 'com, executable file, CP/M 3 and higher with overlays'},
    'Shebang': {description: 'Script or data to be passed to the program following the shebang (#!)'},
    'Mach-O32': {description: 'Mach-O binary, 32-bit'},
    'Mach-O64': {description: 'Mach-O binary, 64-bit'},
    'Mach-O32rev': {description: 'Mach-O binary, reverse byte ordering scheme, 32-bit'},
    'Mach-O64rev': {description: 'Mach-O binary, reverse byte ordering scheme, 64-bit'},
    'TDF': {description: 'Telegram Desktop File'},
    'TDEF': {description: 'Telegram Desktop Encrypted File'},

    'JavaClass': {description: 'Java class file, Mach-O Fat Binary'},
    'CRX': {description: 'Google Chrome extension or packaged app'},
    'NES-ROM': {description: 'Nintendo Entertainment System ROM file'},
    'CAB': {description: 'cab, Microsoft Cabinet file'},
    'luac': {description: 'Lua bytecode'},
    'wasm': {description: 'WebAssembly binary format'},
    'PGP': {description: 'PGP file'},
    'cab': {description: 'cab, InstallShield CAB Archive File'},
    'evt': {description: 'evt, Windows Event Viewer file'},
    'dat-reg': {description: 'dat, a Windows Registry file'},
    'LNK': {description: 'lnk, a Windows shortcut file'},

    // text
    'UTF8': {description: 'UTF-8 byte order mark, commonly seen in text files'},
    'UTF16LE': {description: 'Text file with UTF-16LE byte order mark'},
    'UTF16BE': {description: 'Text file with UTF-16BE byte order mark'},
    'HTML': {description: 'HTML file'},
    'XML': {description: 'XML file'},
    'ICS': {description: 'ICS (iCalendar) is a file format for sharing calendar events, allowing users to exchange scheduling information across different applications.'},
    'VCARD': {description: 'VCF (vCard) is a file format for electronic business cards, storing contact information like names, phone numbers, and addresses'},
    'VCF-GEN': {description: 'VCF (Variant Call Format) is a text file format for storing genetic variation data, including SNPs and INDELs, in bioinformatics.'}

  };

  //console.log ('Total signatures', Object.keys (SIGNATURES).length);


  // Image types which will show additional info and the img thumbnail
  var IMG_TYPES = new Set(['JPEG', 'PNG', 'GIF87a', 'GIF89a', 'webp', 'bmp', 'ICO']);

  // load WASM module, synchronous
  (async function(){
    _wasmModule = await loadWasmModule (wasmUrl);

    if (_wasmModule.memory !== undefined) {
      // the module was loaded
      fileElement.disabled = false;
      showFileProperties(fileElement.files, resultElement); // from prev session if any
    }
    else {
      // the module was not loaded
      resultElement.innerHTML += '<div class="page-message page-message--error">' + _wasmModule.error + "</div>";
    }

  })();

  // event listeners
  fileElement.addEventListener('keypress', function(e) { 
    if (e.key === 'Enter') {
      showFileProperties(fileElement.files, resultElement);
    }
  });

  fileElement.addEventListener('change', function(e) {
    showFileProperties(fileElement.files, resultElement);
  });

  // drag-and-drop events
  fileDropZone.addEventListener ('dragenter', function(e){
    e.stopPropagation();
    e.preventDefault();
    fileDropZone.classList.add(dropReadyCss);
  });

  fileDropZone.addEventListener ('dragleave', function(e){
    e.stopPropagation();
    e.preventDefault();
    fileDropZone.classList.remove(dropReadyCss);
  });

  fileDropZone.addEventListener ('dragover', function(e){
    e.stopPropagation();
    e.preventDefault();
  });
      
  fileDropZone.addEventListener ('drop', function(e){

    var dt = e.dataTransfer;

    e.stopPropagation();
    e.preventDefault();

    fileDropZone.classList.remove(dropReadyCss);

    showFileProperties(dt.files, resultElement);

  });

  // click on the file drop zone
  fileDropZone.addEventListener ('click', function(e) { document.getElementById('input-file').click(); });

  // handle keyboard, pressing a shortcut keys
  document.addEventListener ('keydown', function(e) {

    if (e.altKey || e.ctrlKey) {
      return; // leave to the browser
    }

    switch (e.key) {
      case 'f':
      case 'F':
        document.getElementById('input-file').click();
        e.preventDefault();
        break;
    }

  });

  /**
    * Loads WASM module
    * @param {string} url The WASM file url.
    */
  async function loadWasmModule (url) {

    var ret = {};
    var params = {
        env: {
            memory_base: 0,
            table_base: 0,
            memory : new WebAssembly.Memory({ initial: 1}), // initial - in units of WebAssembly pages, one page 65536 bytes.
            table: new WebAssembly.Table({
                initial: 0,
                element: 'anyfunc',
            })
        }          
      };

    try {
      var response = await fetch(url);
      var bytes = await response.arrayBuffer();
      var module = await WebAssembly.instantiate(bytes, params)
      var instance = module.instance;

      ret = {
        memory: instance.exports.memory,
        getFileSignature: instance.exports.getFileSignature
      };

    }
    catch (err) {
      ret.error = err.toString();
    }

    return ret;
  }

  /**
    * Appends the file properties to the result element.
    * @param {*} files list of selected files.
    * @param {*} resultElement
    */
  async function showFileProperties(files, resultElement) {

    var r = '';
    var file;
    var reader = new FileReader();

    fileInfoElement.innerHTML = '';

    if (files === undefined ||
        files.length === 0) {

      r = 'Please, select a file.';
    }
    else {

      file = files[0];

      loader.show();
      resultElement.classList.remove(flashCss);

      var f = async (file) => {

        r +=
          getResultProperty ('File name', file.name) +
          getResultProperty ('File size', formatFileSize (file.size)) +
          getResultProperty ('File MIME type', (file.type || 'unknown') + '<div style="font-style:normal; opacity:0.7;">* as reported by the browser</div>');

        var slice = file.slice(0, HEAD_BYTES);  // blob with the first bytes of the file
        await reader.readAsArrayBuffer (slice); // read this blob

        reader.onload = async function (e) {

          var rtype = await getSignatue (e.target.result, file, resultElement);
          loader.hide();
          T.log ('File processed' + (rtype? ' ' + rtype : ''));
        };

        reader.onerror = function (e) {
          T.log ('File error');
          loader.hide();
        }

      };

      await f (file);

    }

    resultElement.innerHTML = r;
  }

  /**
    * Processes the file bytes and appends the file description to the result element.
    * @param {ArrayBuffer} fileData the binary data of read portion on the file
    * @param {FILE} file
    * @param {*} resultElement
    */
  async function getSignatue(fileData, file, resultElement) {

    // create input and output arrays
    // input
    var FILE_ARRAY_SIZE = 300; // some signatures uses an offset
    var RESULT_ARRAY_SIZE = 45;
    var MAX_SHOWN_BYTES = 32;
    var DESCR_TITLE = '<b>Description</b>';
    var message = '';
    var offset = 0;
    var returnFileType = '';

    if (fileData.byteLength === 0) {
      resultElement.innerHTML += getResultProperty (DESCR_TITLE, 'Empty file');
      return;
    }

    var fileBytes = new Uint8Array (_wasmModule.memory.buffer, offset, FILE_ARRAY_SIZE);
    memAllZeroes (fileBytes);
    fileBytes.set(new Uint8Array (fileData, 0, Math.min(fileData.byteLength, FILE_ARRAY_SIZE)));

    // result
    offset += FILE_ARRAY_SIZE * Uint8Array.BYTES_PER_ELEMENT;
    var resultBytes = new Uint8Array (_wasmModule.memory.buffer, offset, RESULT_ARRAY_SIZE);
    memAllZeroes (resultBytes);

    // call WASM function
    _wasmModule.getFileSignature (fileBytes.byteOffset, resultBytes.byteOffset, fileData.byteLength);

    var resultText = getStringFromBuffer(resultBytes, RESULT_ARRAY_SIZE);
    var description = '';
    var parsedInfo = '';
    var info;
    var isText = true;

    if (resultText === UNKNOWN) {

      isText = isTextFile(fileData);

      if (isText) {
        description = 'A text file';
      }
      else {
        description = 'A binary file, type not detected';
      }
    }
    else {
      description = getDescription (resultText);

      // the resultText is a string returned by the wasm function, contains the file signature
      if (resultText === 'LNK' &&
          (fileData.byteLength < LNK_SIZE_MIN || fileData.byteLength > LNK_SIZE_MAX)) {
        // too small or too big for the LNK file, should be checked.
        message = '<div class="page-message page-message--error">' + LNK_SIZE_MESSAGE + fileData.byteLength.toString() + '</div>';
      }
      else if (resultText === 'AC3') {
        info = getInfo_AC3(fileBytes);

        if (info) {
          parsedInfo = getResultProperty ('Type', info.isEAC3? 'E-AC3 (Enhanced AC-3 or Dolby Digital Plus)' : 'Regular AC-3') +
            getResultProperty ('Rate', `${info.samplingRate/1000} kHz`) +
            getResultProperty ('Channels', info.numChannels) +
            getResultProperty ('LFE', info.hasLFE? 'present' : 'no') +
            getResultProperty ('Bit rate', `${info.bitRate/1000} kbps`);
          returnFileType = 'ac3';
        }

      }
      else if (resultText === 'ebml-matroska') {

        const MKV_HEADER_SIZE = 0x10000; // 64KiB
        parsedInfo = await getInfo_MKV (file, MKV_HEADER_SIZE);
        returnFileType = 'mkv';

      }
      else if (IMG_TYPES.has (resultText)) {
        // show thumbnail and additional info for images
        showAdditionalImageInfo (fileInfoElement, file);
      }

    }

    resultElement.classList.add(flashCss);

    resultElement.innerHTML += getResultProperty (DESCR_TITLE, description) + parsedInfo + message;

    if (resultText === UNKNOWN && isText === false) {
      // for unknown binary files show its first bytes
      resultElement.innerHTML += '<div style="margin: 8pt 0;">' +
        '<div>First bytes</div>' +
        getFirstBytesHex(fileBytes, Math.min(MAX_SHOWN_BYTES, file.size, FILE_ARRAY_SIZE)) +
        '</div>';
    }

    return returnFileType;

  }

  /**
    * Puts zeroes in the memory buffer.
    * @param {[*]} mem
    */
  function memAllZeroes (mem) {
    var i;
    for (i = 0; i < mem.length; i++) {
      mem[i] = 0;
    }
  };

  /**
    * Returns html formatted file property.
    * @param {string} name
    * @param {string} value
    * @param {string} unit
    */
  function getResultProperty(name, value) {

    return '<div class="file-prop">' +
        '<span class="file-prop-name">' + name + '</span>' +
        '<span class="file-prop-value">' + value + '</span>' +
        '</div>';
  }

  /**
    * Returns string with the file size.
    * @param {number} size
    */
  function formatFileSize(size) {

    var FMT = {minimumFractionDigits: 0, maximumFractionDigits: 1};
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

    t += size + ' byte(s)';

    return t;
  }

  /**
    * Returns the string from the buffer array.
    * @param {[]} buf the buffer
    * @param {number} the buffer size
    */
  function getStringFromBuffer (buf, bufferSize) {
    var s = '';
    var index = 0;
    while(index < bufferSize){
      if(buf[index] !== 0){
        s += String.fromCharCode(buf[index]);
        index++;
      }else{
        return s;
      }
    }

    return '';
  }

  /**
    * Returns the file description by the key.
    * @param {string} key
    */
  function getDescription(key) {

    if (key === '') {
      return 'signature not found';
    }

    if (SIGNATURES[key] === undefined) {
      return 'unknown signature ' + key;
    }

    return SIGNATURES[key].description;
  }

  /**
    * Returns the html list of all supported file descriptions.
    * @param list
    */
  /*
  function listAllDescriptions(list) {
        
    var keys = Object.keys (list);
    var i;
    var html = '';

    for (i = 0; i < keys.length; i++) {
      html += '<li>' + list[keys[i]].description + '</li>';
    }

    return '<p>Formats supported: <b>' + keys.length + '</b></p>' +
      '<ul>' + html + '</ul>';
  }
  */

  /**
    * Returns html code with the first bytes of the array.
    * @param fileBytes
    * @param size
    */
  function getFirstBytesHex(fileBytes, size) {

    var i;
    var eightBytes = '';
    var hex = '';
    var ascii = '';

    for (i = 0; i < size; i++) {

      eightBytes += '<span class="byte-hex">' + formatHex (fileBytes[i]) + '</span>';

      if (31 < fileBytes[i] && fileBytes[i] < 127) {
        // printable characters
        ascii += encodeChar (String.fromCharCode (fileBytes[i]));
      }
      else {
        ascii += '&middot;'
      }

      if (i > 0 && (i + 1) % 8 === 0 || i === size - 1) {

        hex += '<span class="eight-bytes">' + eightBytes + '</span>';

        if ((i + 1) % 16 === 0 && i !== size - 1) {
          hex += '<br />';
          ascii += '<br />';
        }
        eightBytes = '';
      }

    }

    return '<div class="code file-bytes">' +
      '<div>' +
      '<h4>Hex</h4>' + hex +
      '</div><div>' +
      '<h4>ASCII</h4>' + ascii +
      '</div>' +
      '</div>';
  }

  /**
    * Return html code.
    * @param char
    */
  function encodeChar(char) {

    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      default: return char;
    }
  }

  /**
    * Formats the hexademical value
    */
  function formatHex(n) {

    var hex = n.toString(16);

    if (n < 16) {
      return '0' + hex;
    }
    return hex;
  }

  /**
   * Return formatted time from seconds value
   * @param {number} seconds
   * @returns {string} as hh:mm:ss
   */
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Extracts bits from a byte using most significant bit first numbering (MSB).
   * 
   * @param {number} byte - The byte to extract bits from (0-255)
   * @param {number} startBit - Starting bit position (0 = MSB (leftmost), 7 = LSB (rightmost))
   * @param {number} numBits - Number of bits to extract (1-8)
   * @returns {number} The extracted bits as an integer
   * 
   * @example
   * // byte 0x16 (0001 0110):
   * // 2 bits 5-6: 11b = 3
   * // 4 bits 3-6: 1011b = 11
   */
  function readBitsMSBFirst(byte, startBit, numBits) {
      // Shift right to move desired bits to LSB position
      const shiftRight = 8 - (startBit + numBits);
      // Mask to keep only the desired bits
      const mask = (1 << numBits) - 1;
    
      return (byte >> shiftRight) & mask;
  }

  /**
   * Returns true if the bytes does not contains binary data
   * or false otherwise.
   * @param {ArrayBuffer} bytes
   */
  function isTextFile(bytes) {

    var MAX_SIZE = 10485760, // 10 MB
      chunkSize = Math.min (MAX_SIZE, bytes.byteLength),
      i,
      byte,
      view = new Uint8Array(bytes, 0, chunkSize);

    for (i = 0; i < chunkSize; i++) {

      byte = view[i];

      if (byte < 7 ||
          byte > 13 && byte < 27 ||
          byte > 27 && byte < 32 ||
          byte == 127) {
        // 128 and next can be extended ascii text files
        return false; // binary
      }
    }

    return true; // text

  }

  /**
   * Shows additional file info
   * @param {any} fileInfoElement
   * @param {any} file
   */
  function showAdditionalImageInfo (fileInfoElement, file) {

    // Read image dimensions without uploading: create object URL
    var url = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function () {

      if (image.naturalWidth && image.naturalHeight) {

        var imgInfoElement = document.createElement('div');
        var imgContainer = document.createElement('div');
        var imgElement = document.createElement('img');

        // styles: aspect-ratio, object-fit: cover
        imgElement.src = url;

        imgContainer.classList.add('img-thumbnail-container');
        imgContainer.appendChild (imgElement)

        // image info
        imgInfoElement.classList.add('img-info-data');
        imgInfoElement.innerHTML = `<div>Image size ${image.naturalWidth} x ${image.naturalHeight} px</div>`;
        fileInfoElement.appendChild (imgInfoElement);
        fileInfoElement.appendChild (imgContainer);
      }
      URL.revokeObjectURL(url); // cleanup
    };
    image.onerror = function () {
      fileInfoElement.innerHTML = '<p>Failed to load the image</p>';
      URL.revokeObjectURL(url);
    };
    image.src = url;

  }

  /**
   * Returns additional info parsed from the file data.
   * @param {Uint8Array} fb file bytes, the valid Uint8Array with AC3 data.
   * @returns {{isEAC3: boolean, samplingRate: number, numChannels: number, bitRate: number, hasLFE: boolean} | null} AC-3/E-AC3 frame information or null
   */
  function getInfo_AC3(fb) {
    
    // ref:
    // https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/ac3_parser.c
    // https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/ac3tab.c

    var bsid,
      srCode,
      srCode2,
      srShift,
      frameSizeCode,
      bitrateCode,
      bitrate,
      code,
      samplingRate,
      numChannels,
      LFEchannels,
      frameSize,
      numBlocks;

    var ac3FrameSizeTab = [
            [64,   69,   96   ],   // 0
            [64,   70,   96   ],   // 1
            [80,   87,   120  ],   // 2
            [80,   88,   120  ],   // 3
            [96,   104,  144  ],   // 4
            [96,   105,  144  ],   // 5
            [112,  121,  168  ],   // 6
            [112,  122,  168  ],   // 7
            [128,  139,  192  ],   // 8
            [128,  140,  192  ],   // 9
            [160,  174,  240  ],   // 10
            [160,  175,  240  ],   // 11
            [192,  208,  288  ],   // 12
            [192,  209,  288  ],   // 13
            [224,  243,  336  ],   // 14
            [224,  244,  336  ],   // 15
            [256,  278,  384  ],   // 16
            [256,  279,  384  ],   // 17
            [320,  348,  480  ],   // 18
            [320,  349,  480  ],   // 19
            [384,  417,  576  ],   // 20
            [384,  418,  576  ],   // 21
            [448,  487,  672  ],   // 22
            [448,  488,  672  ],   // 23
            [512,  557,  768  ],   // 24
            [512,  558,  768  ],   // 25
            [640,  696,  960  ],   // 26
            [640,  697,  960  ],   // 27
            [768,  835,  1152 ],   // 28
            [768,  836,  1152 ],   // 29
            [896,  975,  1344 ],   // 30
            [896,  976,  1344 ],   // 31
            [1024, 1114, 1536 ],   // 32
            [1024, 1115, 1536 ],   // 33
            [1152, 1253, 1728 ],   // 34
            [1152, 1254, 1728 ],   // 35
            [1280, 1393, 1920 ],   // 36
            [1280, 1394, 1920 ]    // 37
        ];

    var ac3BitrateTab = [
        32, 40, 48, 56, 64, 80, 96, 112, 128, 160,
        192, 224, 256, 320, 384, 448, 512, 576, 640
    ];

    var samplingRateTab = [48000, 44100, 32000, 0];

    if (!fb || fb.length === undefined || fb.length < 7) {
      return null;
    }

    // 1. Check sync word
    if (fb[0] !== 0x0B || fb[1] !== 0x77) {
        return null;
    }

    bsid = (fb[5] >> 3) & 0x1F; // bsid is 5 bits at 5th byte
    numBlocks = 6; // default

    // Check if E-AC3 (E-AC3 (Enhanced AC-3 or Dolby Digital Plus))
    if (bsid <= 10) {
      // Regular AC3
      srCode = readBitsMSBFirst(fb[4], 0, 2); // two bits
      samplingRate = [48000, 44100, 32000][srCode] || 0;

      code= (fb[6] >> 5) & 0x07;
      numChannels = [2, 1, 2, 3, 3, 4, 4, 5][code] || 0;
      LFEchannels = ((fb[6] >> 3) & 0x01)? 1 : 0;
        
      frameSizeCode = readBitsMSBFirst(fb[4], 2, 6);
      if (frameSizeCode > 37) { return null; }

      frameSize = ac3FrameSizeTab[frameSizeCode][srCode] || 0;

      bitrateCode = frameSizeCode >> 1;
      srShift = Math.max(bsid, 8) - 8;
      bitrate = (ac3BitrateTab[bitrateCode] * 1000) >> srShift;

      return {
        isEAC3: false,
        samplingRate: samplingRate,
        numChannels: numChannels + LFEchannels,
        hasLFE: LFEchannels,
        bitRate: bitrate
      };

    } else {
      // E-AC3
      // Read the first 3 bits (bits 5-7 of byte 4) and 8 bits (all of byte 5)
      // and calculate the frame size:
      frameSize = (((readBitsMSBFirst(fb[4], 5, 3) << 8) | readBitsMSBFirst(fb[5], 0, 8)) + 1) * 2;

      srCode = readBitsMSBFirst(fb[6], 6, 2); // rightmost two bits
      if (srCode === 3) {
        srCode2 = readBitsMSBFirst(fb[6], 4, 2);
        if (srCode2 === 3) { return null; }
        samplingRate = (samplingRateTab[srCode2] || 0) / 2;
      }
      else {
        numBlocks = [1, 2, 3, 6][readBitsMSBFirst(fb[6], 4, 2)];
        if (numBlocks === undefined) { return null; }
        samplingRate = samplingRateTab[srCode] || 0;
      }

      code = readBitsMSBFirst(fb[6], 1, 3);
      numChannels = [2, 1, 2, 3, 3, 4, 4, 5][code] || 0;
      LFEchannels = readBitsMSBFirst(fb[6], 0, 1);
      bitrate = 8 * frameSize * samplingRate / (numBlocks * 256);

      //console.log ({frameSize, srCode, srCode2, code});

      return {
        isEAC3: true,
        samplingRate: samplingRate,
        numChannels: numChannels + LFEchannels,
        hasLFE: LFEchannels,
        bitRate: bitrate
      };
    }
  }

  /**
   * Returns additional info parsed from the MKV file data.
   * @param {Uint8Array} bytes file bytes, the valid Uint8Array with MKV data.
   */
  async function getInfo_MKV(file, headerSize) {

    let html = '';

    let mkvf = async function(){

      // appends string s2 to string s1 with the delimiter
      const sapp = function (s1, s2, d) {
        if (s1 === '' && s2 === '') { return ''; }
        if (s1 === '') { return s2; }
        if (s2 === '') { return s1; }
        return s1 + d + s2;
      };

      const getLanguage = function (track) {
        let s = track.language? track.language : 'eng';
        if (track.name) {
          s += ` - ${track.name}`;
        }
        return s;
      };

      const getTrackInfo = function (track) {
        let r = track.codecid? track.codecid : '';
        r = sapp (r, track.audioSamplingFreq? `${track.audioSamplingFreq}kHz` : '', ', ');
        return sapp (r, track.audioChannels? `channels: ${track.audioChannels}` : '', ', ');
      };

      let slice;
      let arrayBuffer;
      let mkvBytes;
      let info;

      try {
        slice = file.slice(0, headerSize);
        arrayBuffer = await slice.arrayBuffer();
        mkvBytes = new Uint8Array(arrayBuffer);
        info = EBMLparser(mkvBytes); // parse
        console.log (info);
      }
      catch(e) {
        T.log('Caught MKV error');
        return '';
      }
      finally {
        slice = null;
        arrayBuffer = null;
        mkvBytes = null;
      }

      if (info.error) {
        T.log('MKV parsing error ' + info.error);
        return '';
      }

      if (info.title && info.title.length > 0) {
        html += getResultProperty ('Title', info.title);
      }

      if (info.duration) {
        html += getResultProperty ('Duration', formatTime (info.duration));
      }

      let videoInfo = '';
      let audioLanguages = [];
      let subtitleLanguages = [];

      if (info.Tracks) {
        for (let i = 0; i < info.Tracks.length; i++) {

          

          switch (info.Tracks[i].trackType) {
            case 'video':
              videoInfo = '';
              if (info.Tracks[i].width && info.Tracks[i].height) {
                videoInfo = sapp (`${info.Tracks[i].width} x ${info.Tracks[i].height}`,
                                  getTrackInfo (info.Tracks[i]), ' ');
              }
              break;
            case 'audio':
              audioLanguages.push (sapp (getLanguage (info.Tracks[i]), getTrackInfo (info.Tracks[i]), ' - '));
              break;
            case 'subtitle':
              subtitleLanguages.push (sapp (getLanguage (info.Tracks[i]), getTrackInfo (info.Tracks[i]), ' - '));
              break;
          }
        }
      }
      
      if (videoInfo.length > 0) {
        html += getResultProperty ('Video', videoInfo);
      }
      
      if (audioLanguages.length > 0) {
        html += getResultProperty ('Audio', audioLanguages.join ('<br>'));
      }
      
      if (subtitleLanguages.length > 0) {
        html += getResultProperty ('Subtitles', subtitleLanguages.join ('<br>'));
      }

    };

    await mkvf();

    return html;

  }

  /**
   * Constructor, shows and hides the loader (linear spinner) element.
   * @param {String} css The loader CSS class name.
   */
  function Loader(css) {

    var _loader = document.getElementsByClassName (css)[0];

    if (_loader) {
      return {
        show: function() { _loader.style.display = 'block'; },
        hide: function() { _loader.style.display = 'none'; }
        };
    }
    else {
      return {
        show: function(){},
        hide: function(){}
      };

    }
  }

}

/**
  * Parses the EBML document from the bytes and returns some of the data.
  * If the parsing succeed then the return value contains error = '',
  * or a string with the error code otherwise.
  * @param {Uint8Array} bytes file bytes, the valid Uint8Array with MKV data.
  * @returns {error: string, duration: string?, tracks: []?}
  */
function EBMLparser (bytes) {

  const EBML_SEGMENT = 0x18538067;
  const EBML_INFO = 0x1549A966;
  const EBML_INFO_TITLE = 0x7BA9;
  const EBML_SEEKHEAD =0x114D9B74;
  const EBML_SEEK = 0x4DBB;
  const EBML_SEEKID = 0x53AB;
  const EBML_SEEKPOSITION = 0x53AC;
  const EBML_TIMESTAMPSCALE = 0X2AD7B1; // Scale factor for timestamps (default 1,000,000 = 1ms)
  const EBML_DURATION = 0x4489; // Duration in scaled units
  const EBML_TRACKS = 0x1654AE6B;
  const EBML_TRACKENTRY = 0xAE;
  const EBML_TRACKNUMBER = 0xD7;
  const EBML_TRACKTYPE = 0x83;
  const EBML_TRACKCODECID = 0x86;
  const EBML_TRACKNAME = 0x536E;
  const EBML_TRACKLANGUAGE = 0x22b59c; // 3-letter code
  const EBML_AUDIO_SAMPLINGFREQ = 0xB5;
  const EBML_AUDIO_CHANNELS = 0x9F;
  const EBML_PIXELWIDTH = 0xB0;
  const EBML_PIXELHEIGHT = 0xBA;
  const EBML_CLUSTER = 0x1F43B675;
  const EBML_CUES = 0x1C53BB6B;

  const EBML_SCHEME = {
    // EBML elements
  0x4286: 'uinteger',  // EBMLVersion - unsigned integer
  0x42F7: 'uinteger',  // EBMLReadVersion - unsigned integer
  0x42F2: 'uinteger',  // EBMLMaxIDLength - unsigned integer
  0x42F3: 'uinteger',  // EBMLMaxSizeLength - unsigned integer
  0x4282: 'string',    // DocType - ASCII string (printable ASCII, zero-padded)
  0x4287: 'uinteger',  // DocTypeVersion - unsigned integer
  0x4285: 'uinteger',  // DocTypeReadVersion - unsigned integer

  0xEC: 'void',  // padding
  0xBF: 'crc32', // checksumm data

  0x1A45DFA3: 'master', // Matroska magic number

    // Matroska elements
  0x42F2: 'uinteger',  // EBMLMaxIDLength
  0x42F3: 'uinteger',  // EBMLMaxSizeLength
  0x18538067: 'master',  // Segment
  0x114D9B74: 'master',  // SeekHead
  0x4DBB: 'master',  // Seek
  0x53AB: 'binary',  // SeekID
  0x53AC: 'uinteger',  // SeekPosition
  0x1549A966: 'master',  // Info
  0x73A4: 'binary',  // SegmentUUID
  0x7384: 'utf-8',  // SegmentFilename
  0x3CB923: 'binary',  // PrevUUID
  0x3C83AB: 'utf-8',  // PrevFilename
  0x3EB923: 'binary',  // NextUUID
  0x3E83BB: 'utf-8',  // NextFilename
  0x4444: 'binary',  // SegmentFamily
  0x6924: 'master',  // ChapterTranslate
  0x69A5: 'binary',  // ChapterTranslateID
  0x69BF: 'uinteger',  // ChapterTranslateCodec
  0x69FC: 'uinteger',  // ChapterTranslateEditionUID
  0x2AD7B1: 'uinteger',  // TimestampScale
  0x4489: 'float',  // Duration
  0x4461: 'date',  // DateUTC
  0x7BA9: 'utf-8',  // Title
  0x4D80: 'utf-8',  // MuxingApp
  0x5741: 'utf-8',  // WritingApp
  0x1F43B675: 'master',  // Cluster
  0xE7: 'uinteger',  // Timestamp
  0x5854: 'master',  // SilentTracks
  0x58D7: 'uinteger',  // SilentTrackNumber
  0xA7: 'uinteger',  // Position
  0xAB: 'uinteger',  // PrevSize
  0xA3: 'binary',  // SimpleBlock
  0xA0: 'master',  // BlockGroup
  0xA1: 'binary',  // Block
  0xA2: 'binary',  // BlockVirtual
  0x75A1: 'master',  // BlockAdditions
  0xA6: 'master',  // BlockMore
  0xA5: 'binary',  // BlockAdditional
  0xEE: 'uinteger',  // BlockAddID
  0x9B: 'uinteger',  // BlockDuration
  0xFA: 'uinteger',  // ReferencePriority
  0xFB: 'integer',  // ReferenceBlock
  0xFD: 'integer',  // ReferenceVirtual
  0xA4: 'binary',  // CodecState
  0x75A2: 'integer',  // DiscardPadding
  0x8E: 'master',  // Slices
  0xE8: 'master',  // TimeSlice
  0xCC: 'uinteger',  // LaceNumber
  0xCD: 'uinteger',  // FrameNumber
  0xCB: 'uinteger',  // BlockAdditionID
  0xCE: 'uinteger',  // Delay
  0xCF: 'uinteger',  // SliceDuration
  0xC8: 'master',  // ReferenceFrame
  0xC9: 'uinteger',  // ReferenceOffset
  0xCA: 'uinteger',  // ReferenceTimestamp
  0xAF: 'binary',  // EncryptedBlock
  0x1654AE6B: 'master',  // Tracks
  0xAE: 'master',  // TrackEntry
  0xD7: 'uinteger',  // TrackNumber
  0x73C5: 'uinteger',  // TrackUID
  0x83: 'uinteger',  // TrackType
  0xB9: 'uinteger',  // FlagEnabled
  0x88: 'uinteger',  // FlagDefault
  0x55AA: 'uinteger',  // FlagForced
  0x55AB: 'uinteger',  // FlagHearingImpaired
  0x55AC: 'uinteger',  // FlagVisualImpaired
  0x55AD: 'uinteger',  // FlagTextDescriptions
  0x55AE: 'uinteger',  // FlagOriginal
  0x55AF: 'uinteger',  // FlagCommentary
  0x9C: 'uinteger',  // FlagLacing
  0x6DE7: 'uinteger',  // MinCache
  0x6DF8: 'uinteger',  // MaxCache
  0x23E383: 'uinteger',  // DefaultDuration
  0x234E7A: 'uinteger',  // DefaultDecodedFieldDuration
  0x23314F: 'float',  // TrackTimestampScale
  0x537F: 'integer',  // TrackOffset
  0x55EE: 'uinteger',  // MaxBlockAdditionID
  0x41E4: 'master',  // BlockAdditionMapping
  0x41F0: 'uinteger',  // BlockAddIDValue
  0x41A4: 'string',  // BlockAddIDName
  0x41E7: 'uinteger',  // BlockAddIDType
  0x41ED: 'binary',  // BlockAddIDExtraData
  0x536E: 'utf-8',  // Name
  0x22B59C: 'string',  // Language
  0x22B59D: 'string',  // LanguageBCP47
  0x86: 'string',  // CodecID
  0x63A2: 'binary',  // CodecPrivate
  0x258688: 'utf-8',  // CodecName
  0x7446: 'uinteger',  // AttachmentLink
  0x3A9697: 'utf-8',  // CodecSettings
  0x3B4040: 'string',  // CodecInfoURL
  0x26B240: 'string',  // CodecDownloadURL
  0xAA: 'uinteger',  // CodecDecodeAll
  0x6FAB: 'uinteger',  // TrackOverlay
  0x56AA: 'uinteger',  // CodecDelay
  0x56BB: 'uinteger',  // SeekPreRoll
  0x6624: 'master',  // TrackTranslate
  0x66A5: 'binary',  // TrackTranslateTrackID
  0x66BF: 'uinteger',  // TrackTranslateCodec
  0x66FC: 'uinteger',  // TrackTranslateEditionUID
  0xE0: 'master',  // Video
  0x9A: 'uinteger',  // FlagInterlaced
  0x9D: 'uinteger',  // FieldOrder
  0x53B8: 'uinteger',  // StereoMode
  0x53C0: 'uinteger',  // AlphaMode
  0x53B9: 'uinteger',  // OldStereoMode
  0xB0: 'uinteger',  // PixelWidth
  0xBA: 'uinteger',  // PixelHeight
  0x54AA: 'uinteger',  // PixelCropBottom
  0x54BB: 'uinteger',  // PixelCropTop
  0x54CC: 'uinteger',  // PixelCropLeft
  0x54DD: 'uinteger',  // PixelCropRight
  0x54B0: 'uinteger',  // DisplayWidth
  0x54BA: 'uinteger',  // DisplayHeight
  0x54B2: 'uinteger',  // DisplayUnit
  0x54B3: 'uinteger',  // AspectRatioType
  0x2EB524: 'binary',  // UncompressedFourCC
  0x2FB523: 'float',  // GammaValue
  0x2383E3: 'float',  // FrameRate
  0x55B0: 'master',  // Colour
  0x55B1: 'uinteger',  // MatrixCoefficients
  0x55B2: 'uinteger',  // BitsPerChannel
  0x55B3: 'uinteger',  // ChromaSubsamplingHorz
  0x55B4: 'uinteger',  // ChromaSubsamplingVert
  0x55B5: 'uinteger',  // CbSubsamplingHorz
  0x55B6: 'uinteger',  // CbSubsamplingVert
  0x55B7: 'uinteger',  // ChromaSitingHorz
  0x55B8: 'uinteger',  // ChromaSitingVert
  0x55B9: 'uinteger',  // Range
  0x55BA: 'uinteger',  // TransferCharacteristics
  0x55BB: 'uinteger',  // Primaries
  0x55BC: 'uinteger',  // MaxCLL
  0x55BD: 'uinteger',  // MaxFALL
  0x55D0: 'master',  // MasteringMetadata
  0x55D1: 'float',  // PrimaryRChromaticityX
  0x55D2: 'float',  // PrimaryRChromaticityY
  0x55D3: 'float',  // PrimaryGChromaticityX
  0x55D4: 'float',  // PrimaryGChromaticityY
  0x55D5: 'float',  // PrimaryBChromaticityX
  0x55D6: 'float',  // PrimaryBChromaticityY
  0x55D7: 'float',  // WhitePointChromaticityX
  0x55D8: 'float',  // WhitePointChromaticityY
  0x55D9: 'float',  // LuminanceMax
  0x55DA: 'float',  // LuminanceMin
  0x7670: 'master',  // Projection
  0x7671: 'uinteger',  // ProjectionType
  0x7672: 'binary',  // ProjectionPrivate
  0x7673: 'float',  // ProjectionPoseYaw
  0x7674: 'float',  // ProjectionPosePitch
  0x7675: 'float',  // ProjectionPoseRoll
  0xE1: 'master',  // Audio
  0xB5: 'float',  // SamplingFrequency
  0x78B5: 'float',  // OutputSamplingFrequency
  0x9F: 'uinteger',  // Channels
  0x7D7B: 'binary',  // ChannelPositions
  0x6264: 'uinteger',  // BitDepth
  0x52F1: 'uinteger',  // Emphasis
  0xE2: 'master',  // TrackOperation
  0xE3: 'master',  // TrackCombinePlanes
  0xE4: 'master',  // TrackPlane
  0xE5: 'uinteger',  // TrackPlaneUID
  0xE6: 'uinteger',  // TrackPlaneType
  0xE9: 'master',  // TrackJoinBlocks
  0xED: 'uinteger',  // TrackJoinUID
  0xC0: 'uinteger',  // TrickTrackUID
  0xC1: 'binary',  // TrickTrackSegmentUID
  0xC6: 'uinteger',  // TrickTrackFlag
  0xC7: 'uinteger',  // TrickMasterTrackUID
  0xC4: 'binary',  // TrickMasterTrackSegmentUID
  0x6D80: 'master',  // ContentEncodings
  0x6240: 'master',  // ContentEncoding
  0x5031: 'uinteger',  // ContentEncodingOrder
  0x5032: 'uinteger',  // ContentEncodingScope
  0x5033: 'uinteger',  // ContentEncodingType
  0x5034: 'master',  // ContentCompression
  0x4254: 'uinteger',  // ContentCompAlgo
  0x4255: 'binary',  // ContentCompSettings
  0x5035: 'master',  // ContentEncryption
  0x47E1: 'uinteger',  // ContentEncAlgo
  0x47E2: 'binary',  // ContentEncKeyID
  0x47E7: 'master',  // ContentEncAESSettings
  0x47E8: 'uinteger',  // AESSettingsCipherMode
  0x47E3: 'binary',  // ContentSignature
  0x47E4: 'binary',  // ContentSigKeyID
  0x47E5: 'uinteger',  // ContentSigAlgo
  0x47E6: 'uinteger',  // ContentSigHashAlgo
  0x1C53BB6B: 'master',  // Cues
  0xBB: 'master',  // CuePoint
  0xB3: 'uinteger',  // CueTime
  0xB7: 'master',  // CueTrackPositions
  0xF7: 'uinteger',  // CueTrack
  0xF1: 'uinteger',  // CueClusterPosition
  0xF0: 'uinteger',  // CueRelativePosition
  0xB2: 'uinteger',  // CueDuration
  0x5378: 'uinteger',  // CueBlockNumber
  0xEA: 'uinteger',  // CueCodecState
  0xDB: 'master',  // CueReference
  0x96: 'uinteger',  // CueRefTime
  0x97: 'uinteger',  // CueRefCluster
  0x535F: 'uinteger',  // CueRefNumber
  0xEB: 'uinteger',  // CueRefCodecState
  0x1941A469: 'master',  // Attachments
  0x61A7: 'master',  // AttachedFile
  0x467E: 'utf-8',  // FileDescription
  0x466E: 'utf-8',  // FileName
  0x4660: 'string',  // FileMediaType
  0x465C: 'binary',  // FileData
  0x46AE: 'uinteger',  // FileUID
  0x4675: 'binary',  // FileReferral
  0x4661: 'uinteger',  // FileUsedStartTime
  0x4662: 'uinteger',  // FileUsedEndTime
  0x1043A770: 'master',  // Chapters
  0x45B9: 'master',  // EditionEntry
  0x45BC: 'uinteger',  // EditionUID
  0x45BD: 'uinteger',  // EditionFlagHidden
  0x45DB: 'uinteger',  // EditionFlagDefault
  0x45DD: 'uinteger',  // EditionFlagOrdered
  0x4520: 'master',  // EditionDisplay
  0x4521: 'utf-8',  // EditionString
  0x45E4: 'string',  // EditionLanguageIETF
  0xB6: 'master',  // ChapterAtom
  0x73C4: 'uinteger',  // ChapterUID
  0x5654: 'utf-8',  // ChapterStringUID
  0x91: 'uinteger',  // ChapterTimeStart
  0x92: 'uinteger',  // ChapterTimeEnd
  0x98: 'uinteger',  // ChapterFlagHidden
  0x4598: 'uinteger',  // ChapterFlagEnabled
  0x6E67: 'binary',  // ChapterSegmentUUID
  0x4588: 'uinteger',  // ChapterSkipType
  0x6EBC: 'uinteger',  // ChapterSegmentEditionUID
  0x63C3: 'uinteger',  // ChapterPhysicalEquiv
  0x8F: 'master',  // ChapterTrack
  0x89: 'uinteger',  // ChapterTrackUID
  0x80: 'master',  // ChapterDisplay
  0x85: 'utf-8',  // ChapString
  0x437C: 'string',  // ChapLanguage
  0x437D: 'string',  // ChapLanguageBCP47
  0x437E: 'string',  // ChapCountry
  0x6944: 'master',  // ChapProcess
  0x6955: 'uinteger',  // ChapProcessCodecID
  0x450D: 'binary',  // ChapProcessPrivate
  0x6911: 'master',  // ChapProcessCommand
  0x6922: 'uinteger',  // ChapProcessTime
  0x6933: 'binary',  // ChapProcessData
  0x1254C367: 'master',  // Tags
  0x7373: 'master',  // Tag
  0x63C0: 'master',  // Targets
  0x68CA: 'uinteger',  // TargetTypeValue
  0x63CA: 'string',  // TargetType
  0x63C5: 'uinteger',  // TagTrackUID
  0x63C9: 'uinteger',  // TagEditionUID
  0x63C4: 'uinteger',  // TagChapterUID
  0x63C6: 'uinteger',  // TagAttachmentUID
  0x63C7: 'uinteger',  // TagBlockAddIDValue
  0x67C8: 'master',  // SimpleTag
  0x45A3: 'utf-8',  // TagName
  0x447A: 'string',  // TagLanguage
  0x447B: 'string',  // TagLanguageBCP47
  0x4484: 'uinteger',  // TagDefault
  0x44B4: 'uinteger',  // TagDefaultBogus
  0x4487: 'utf-8',  // TagString
  0x4485: 'binary'  // TagBinary
  };

  let result = { error: '' };
  let pos = 0;

  // check if browser supports BigInt
  if (typeof BigInt === 'undefined') {
    result.error = 'bigint';
    return result;
  }

  // validate input
  if (!bytes || !(bytes instanceof Uint8Array) || bytes.length < 4) {
    result.error = 'input';
    return result;
  }

  let textDecoder = new TextDecoder('utf-8');
    
  // 1. Read EBML ID (0x1A45DFA3 - Master element)
  if (bytes[0] !== 0x1a || bytes[1] !== 0x45 || bytes[2] !== 0xdf || bytes[3] !== 0xa3) {
    result.error = 'not_ebml';
    return result;
  }

  // 2. Read the header size
  pos = 4;
  let headerSize = ebml_readVINT (bytes, pos);
  if (!headerSize) {
    result.error = 'no_header';
    return result;
  }

  pos += Number(headerSize.consumed);

  // 3. Find DocType (0x4282) inside EBML to verify it's matroska
  const ebmlEnd = pos + Number(headerSize.value);
  let foundMatroska = false;

  while (pos < ebmlEnd && pos < bytes.length) {

    // get the element ID and size
    let ebmlElement = ebml_readElement (bytes, pos);
    if (!ebmlElement) {
      result.error = 'doctype';
      return result;
    }
    pos = ebmlElement.nextPosition;

    // Check if this is DocType element (0x4282)
    if (ebmlElement.id === 0x4282 && ebmlElement.value === 'matroska') {
      foundMatroska = true;
      break;
    }
  }
    
  if (!foundMatroska) { 
    result.error = 'not_mkv';
    return result;
  }
    
  // 4. Parse elements
  // Search for Segment (contains all the main data of the MKV file) within remaining bytes
  let fileData = {
    segmentDataStart: -1,
    segmentSizeBigInt: 0n,
    infoDataStart: -1,
    infoSizeBigInt: 0n,
    trackBytesRead: 0
  };

  while (pos < bytes.length) {

    let ebmlElement = ebml_readElement (bytes, pos);
    if (!ebmlElement) {
      //console.log ('no element at 0x' + pos.toString(16) + ' bytes 0x' +
      //  bytes[pos].toString(16) + bytes[pos+1].toString(16) + ' ' + bytes[pos+ 2].toString(16) + bytes[pos+3].toString(16));
      break;
    }

    pos = ebmlElement.nextPosition;

    if (ebmlElement.id === EBML_CLUSTER ||
        ebmlElement.id === EBML_CUES) {
      // done with the header
      break;
    }

    switch (ebmlElement.id) {

      case EBML_SEGMENT:
        fileData.segmentDataStart = ebmlElement.nextPosition;
        fileData.segmentSizeBigInt = ebmlElement.size; // the size of the payload
        break;

      case EBML_INFO:
        fileData.infoDataStart = ebmlElement.nextPosition;
        fileData.infoSizeBigInt = ebmlElement.size; // the size of the payload
        break;

      case EBML_TIMESTAMPSCALE:
        fileData.timestampScale = Number(ebmlElement.value);
        break;
      case EBML_DURATION:
        // Duration in scaled units -> convert to seconds
        if (!result.duration) {
          result.duration = (Number(ebmlElement.value) * fileData.timestampScale) / 1e9;
        }
        break;
      case EBML_INFO_TITLE:
        if (!result.title) {
          result.title = ebmlElement.value;
        }
        break;

      case EBML_TRACKS:
        fileData.tracksSize = Number(ebmlElement.size);
        break;
      case EBML_TRACKENTRY:
        if (!result.Tracks) {
          result.Tracks = [];
        }
        result.Tracks.push({});
        fileData.trackBytesRead += Number(ebmlElement.size);
        break;
      case EBML_TRACKNUMBER:
        if (result.Tracks) {
          result.Tracks[result.Tracks.length - 1].number = Number(ebmlElement.value);
        }
        break;
      case EBML_TRACKCODECID:
        if (result.Tracks && ebmlElement.value && ebmlElement.value !== '') {
          result.Tracks[result.Tracks.length - 1].codecid = ebmlElement.value;
        }
        break;
      case EBML_TRACKTYPE:
        if (result.Tracks) {
          result.Tracks[result.Tracks.length - 1].trackType = (function(t){
            switch(t){
              case 1: return 'video';
              case 2: return 'audio';
              case 17: return 'subtitle';
              default: return t.toString();
            }
          })(Number(ebmlElement.value)); // others: 3=complex, 16=logo, 18=buttons, 32=control, 33=metadata etc
        }
        break;
      case EBML_PIXELWIDTH:
        if (result.Tracks) {
          result.Tracks[result.Tracks.length - 1].width = Number(ebmlElement.value);
        }
        break;
      case EBML_PIXELHEIGHT:
        if (result.Tracks) {
          result.Tracks[result.Tracks.length - 1].height = Number(ebmlElement.value);
        }
        break;

      case EBML_TRACKLANGUAGE:
        if (result.Tracks) {
          let lang = (function(s){
            if (typeof s === 'string' && s !== 'und') {
              return s;
            }
            return null;
          })(ebmlElement.value);

          if (lang) {
            result.Tracks[result.Tracks.length - 1].language = lang;
          }
        }
        break;
      case EBML_TRACKNAME:
        if (result.Tracks) {
          if (ebmlElement.value) {
            result.Tracks[result.Tracks.length - 1].name = ebmlElement.value;
          }
        }
        break;
      case EBML_AUDIO_SAMPLINGFREQ:
        if (result.Tracks) {
          if (ebmlElement.value) {
            result.Tracks[result.Tracks.length - 1].audioSamplingFreq = Number(ebmlElement.value);
          }
        }
        break;
      case EBML_AUDIO_CHANNELS:
        if (result.Tracks) {
          if (ebmlElement.value) {
            result.Tracks[result.Tracks.length - 1].audioChannels = Number(ebmlElement.value);
          }
        }
        break;

    }

  }
    
  if (fileData.segmentDataStart === -1) {
    result.error = 'no_segment';
    return result;
  }

  return result;

  /**
   * Reads the EBML element: id, size and value if any.
   * @param {Uint8Array} bytes
   * @param {number} pos
   * @returns
   */
  function ebml_readElement (bytes, pos) {

    // [ID VINT] [DataSize VINT] [Data]

    let startPos = pos;
    let result;

    const idResult = ebml_readID(bytes, pos);
    if (!idResult) {
      return null;
    }
    pos += idResult.consumed;
    
    const sizeResult = ebml_readVINT(bytes, pos);
    if (!sizeResult) {
      return null;
    }
    pos += sizeResult.consumed;
    const dataSize = Number(sizeResult.value);

    // get the type and read data
    const dataType = EBML_SCHEME[idResult.value];
    let value;

    if (typeof dataType === 'undefined') {
      return null;
    }

    switch (dataType) {
      case 'uinteger':
        let v = ebml_readUint (bytes, pos, dataSize);
        if (!v) return null;
        pos += v.consumed;
        value = v.value;
        break;

      case 'utf-8':
      case 'string':
        // Read string data
        value = '';
        let lastIndex = pos + dataSize;
        if (lastIndex <= bytes.length) {
          value = textDecoder.decode(bytes.slice(pos, lastIndex));
          pos = lastIndex;
        }
        else {
          value = '';
          pos = bytes.length;
        }
        break;

      case 'float':
        const floatResult = ebml_readFloat(bytes, pos, dataSize);
        if (!floatResult) return null;
        value = floatResult.value;
        pos += floatResult.consumed;
        break;

      case 'date':
        // EBML spec: Date MUST be 0 or 8 bytes
        if (dataSize !== 0 && dataSize !== 8) {
            return null; // Invalid date element
        }
    
        // Handle zero-length date (represents the epoch)
        if (dataSize === 0) {
            const epochDateUtc = Date.UTC(2001, 0, 1, 0, 0, 0, 0);
            value = new Date(epochDateUtc);
            pos += 0; // No data to consume
            break;
        }
    
        // Normal 8-byte date
        const dateRaw = ebml_readInt(bytes, pos, 8);
        if (!dateRaw) return null;
        pos += dateRaw.consumed;
    
        const nanoseconds = Number(dateRaw.value);
        const epochDateUtc = Date.UTC(2001, 0, 1, 0, 0, 0, 0);
        const millisecondsSinceEpoch = epochDateUtc + (nanoseconds / 1000000);
    
        value = new Date(millisecondsSinceEpoch);
        break;

      case 'integer':
        let iv = ebml_readInt (bytes, pos, dataSize);
        if (!iv) return null;
        pos += iv.consumed;
        value = iv.value;
        break;

      case 'binary':
        // skip size bytes (or save them)
        value = bytes.slice(pos, pos + dataSize); // new Uint8Array copy
        pos += dataSize;
        break;

      case 'master':
        // next after the element goes payload (next element)
        break;

      case 'void':
      case 'crc32':
        // Just skip the data, no value needed
        pos += Number(sizeResult.value);
        value = null;
        break;

      default: // do nothing
    }

    return {
      id: idResult.value,
      size: sizeResult.value,
      dataType: dataType,
      value: value,
      startPosition: startPos,
      nextPosition: pos
    };

  }

  /**
   * Reads EBML ID from the byte array (raw VINT without masking the leading bits, 1-4 bytes).
   * Unlike ebml_readVINT, this preserves the leading bits that indicate the length.
   * @param {Uint8Array} bytes - The byte array to read from
   * @param {number} startPos - The starting position in the byte array
   * @returns {{value: number, consumed: number} | null} The raw EBML ID value and bytes consumed, or null on error
   */
  function ebml_readID(bytes, startPos = 0) {

    if (startPos >= bytes.length) {
      return null;
    }
    
    const firstByte = bytes[startPos];
    
    // Determine VINT length from the first byte (count leading 0s)
    const vintLength = Math.clz32(firstByte<< 24) + 1;

    if (vintLength === 0) {
      return null;
    }
    
    if (startPos + vintLength > bytes.length) {
      return null;
    }

    // Extract the raw value WITHOUT masking the first byte
    let value = 0;
    
    for (let i = 0; i < vintLength; i++) {
        const byte = bytes[startPos + i];
        value = (value << 8) | byte;
    }

    return {
        value: value,
        consumed: vintLength
    };
  }

  /**
   * Reads VINT from the byte array, return the value and the number of processed bytes.
   * @param {Uint8Array} bytes - The byte array to read from
   * @param {number} startPos - The starting position in the byte array
   * @returns {{value: bigint, consumed: number} | null} The VINT value (BigInt) and bytes consumed, or null on error
   */
  function ebml_readVINT(bytes, startPos = 0) {

    if (startPos >= bytes.length) {
      return null;
    }
    
    const firstByte = bytes[startPos];

    // Determine VINT length from the first byte (count first 0s)
    const vintLength = Math.clz32(firstByte << 24) + 1;
    
    if (vintLength === 0) {
      return null;
    }
    
    if (startPos + vintLength > bytes.length) {
      return null;
    }

    // Extract the value using BigInt for safe handling of large numbers (up to 8 bytes)
    let value = 0n;
    
    for (let i = 0; i < vintLength; i++) {
      const byte = bytes[startPos + i];
      if (i === 0) {
        // Mask out the leading bits for the first byte
        const dataMask = (1 << (8 - vintLength)) - 1;
        value = BigInt(byte & dataMask);
      } else {
        // Take all bits for subsequent bytes
        value = (value << 8n) | BigInt(byte);
      }
    }
    
    return {
      value: value,
      consumed: vintLength
    };
  }

  /**
   * Reads unsigned integer from the byte array (big-endian).
   * @param {Uint8Array} bytes - The byte array to read from
   * @param {number} startPos - The starting position in the byte array
   * @param {number} length - Number of bytes to read (1-8)
   * @returns {{value: bigint, consumed: number} | null} The uint value (BigInt) and bytes consumed, or null on error
   */
  function ebml_readUint(bytes, startPos = 0, length = 1) {

    if (startPos + length > bytes.length) {
        return null;
    }
    
    if (length < 1 || length > 8) {
        return null;
    }
    
    let value = 0n;
    
    for (let i = 0; i < length; i++) {
        value = (value << 8n) | BigInt(bytes[startPos + i]);
    }
    
    return {
        value: value,
        consumed: length
    };
  }

  /**
   * Reads signed integer from the byte array (big-endian, two's complement).
   * @param {Uint8Array} bytes - The byte array to read from
   * @param {number} startPos - The starting position in the byte array
   * @param {number} length - Number of bytes to read (1-8)
   * @returns {{value: bigint, consumed: number} | null} The signed int value (BigInt) and bytes consumed, or null on error
   */
  function ebml_readInt(bytes, startPos = 0, length = 1) {

    if (startPos + length > bytes.length) {
        return null;
    }
    
    if (length < 1 || length > 8) {
        return null;
    }
    
    // First read as unsigned
    let value = 0n;
    for (let i = 0; i < length; i++) {
        value = (value << 8n) | BigInt(bytes[startPos + i]);
    }
    
    // Convert from two's complement to signed
    // Check if the most significant bit is 1 (negative)
    const msbMask = 1n << (BigInt(length * 8) - 1n);
    
    if (value & msbMask) {
        // Negative number: sign extend by subtracting 2^(bits)
        const bits = BigInt(length * 8);
        const modulus = 1n << bits;
        value = value - modulus;
    }
    
    return {
        value: value,
        consumed: length
    };
  }

  /**
   * Reads 64-bit float (double) from the byte array (IEEE 754, big-endian).
   * @param {Uint8Array} bytes - The byte array to read from
   * @param {number} startPos - The starting position in the byte array
   * @returns {{value: number, consumed: number} | null} The float value and bytes consumed (8), or null on error
   */
  function ebml_readFloat(bytes, startPos, size) {

    // EBML float can be 4 bytes (32-bit) or 8 bytes (64-bit)
    if (size !== 4 && size !== 8) {
      return null;
    }
    
    if (startPos + size > bytes.length) {
      return null;
    }
    // Copy the relevant bytes to a new ArrayBuffer
    const temp = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        temp[i] = bytes[startPos + i];
    }
    const view = new DataView(temp.buffer);
    let value;
    if (size === 4) {
      value = view.getFloat32(0, false); // 32-bit float, false = big-endian
    } else {
      value = view.getFloat64(0, false); // 64-bit float, false = big-endian
    }    
    return {
        value: value,
        consumed: size
    };
  }


  // TODO: remove next functions
  /**
   * TEMP - Returns the byte with padded zeroes
   * @param {any} byte
   * @returns
   */
  function showByteBits (byte) {
    var res = byte.toString (2);
    return res.padStart(8, '0');
  }

  function showElement (ebmlElement) {
    if(!ebmlElement) {
      return 'NULL';
    }
    return '' +
      `    ID:    0x${ebmlElement.id.toString(16)}\n` +
      `    type:  ${ebmlElement.dataType}\n` +
      `    size:  ${ebmlElement.size}\n` +
      `    value: ${ebmlElement.value}\n` +
      `    startPosition: 0x${ebmlElement.startPosition.toString(16)} (${ebmlElement.startPosition})\n` +
      `    nextPosition:  0x${ebmlElement.nextPosition.toString(16)} (${ebmlElement.nextPosition})\n`;
  }


}