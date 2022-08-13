/*
 * Javascript code for the file.htm page.
 * 
 * 2022-08-12
 * 2022-08-13 isTextFile() added, fix for empty files.
 */

/**
 * Initialization, event handlers and all functions.
 * @param {*} options
 */
function fileTypePage(options) {

  'use strict';

  var fileDropZone = document.getElementById ('file-target');
  var fileElement = document.getElementById ('input-file');
  var resultElement = document.getElementsByClassName('file-signature')[0];
  var loader = new Loader(options.loaderCss);

  var wasmUrl = options.wasmUrl;
  var dropReadyCss = options.dropReadyCss;
  var dropZoneText = options.dropZoneText;
  var _wasmModule = {};

  // TODO: progress indicator, process file list

  /** Definitions */
  /*
   * When the list changed uncomment the listAllDescriptions function and use this code to generate html code:
   * 
   * <div class="list-all"></div>
   * var listAll = document.getElementsByClassName('list-all')[0].innerHTML = listAllDescriptions(SIGNATURES);
   *
   */
  var SIGNATURES = {

    // graphics
    'JPEG': {description: 'JPEG raw or in the JFIF or Exif'},
    'JPEG2000': {description: 'JPEG 2000 file'},
    'PNG': {description: 'png, Image encoded in the Portable Network Graphics format'},
    'webp': {description: 'Google WebP image file'},
    'ani':  {description: 'Animated cursor'},
    'CanonRAW': {description: 'Canon RAW Format Version 2'},
    'xcf': {description: 'XCF file, GIMP native'},
    'GIF87a': {description: 'gif, Image file encoded in the Graphics Interchange Format (GIF87a)'},
    'GIF89a': {description: 'gif, Image file encoded in the Graphics Interchange Format (GIF89a)'},
    'ttf': {description: 'TrueType font'},
    'ico': {description: 'Computer icon encoded in ICO file format'},
    'PSD': {description: 'Adobe Photoshop\'s native file'},
    'AppleIcon': {description: 'Apple Icon Image format'},
    'TIFF(le)': {description: 'TIFF, Tagged Image File Format, little-endian'},
    'TIFF(be)': {description: 'TIFF, Tagged Image File Format, big-endian'},
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
    'FLAC': {description: 'Free Lossless Audio Codec'},
    'AIFF': {description: 'AIFF, Audio Interchange File Format'},
    'wav':  {description: 'wav, Waveform Audio File Format'},
    'OGGS': {description: 'Ogg, an open source media container format'},
    'MIDI': {description: 'MIDI sound file'},

    // video
    'avi':  {description: 'avi, Audio Video Interleave video format'},
    'MKV': {description: 'mkv, mka, mks, mk3d, webm - Matroska media container, including WebM'},
    'ASF-WMA-WMV': {description: 'asf, wma, wmv - Advanced Systems Format'},
    'mp4': {description: 'ISO Base Media file (MPEG-4)'},
    'ftyp3g': {description: '3rd Generation Partnership Project 3GPP and 3GPP2 multimedia files'},
    'MLV': {description: 'Canon Magic Lantern Video file'},
    'MPEG-Stream': {description: 'MPEG Program Stream'},
    'MPEG-Video': {description: 'MPEG-1 video and MPEG-2 video'},
    'MPEG-Transport': {description: 'ts, tsv, tsa, mpg, mpeg - MPEG Transport Stream (MPEG-2 Part 1)'},
    'MOV': {description: 'QuickTime MOV, a video container'},
    'FLV': {description: 'flv, Flash Video file'},
    'PIC-PIF-SEA-OCR': {description: 'PIC (IBM Storyboard bitmap file) or PIF (Windows Program Information File)' +
                        ' or SEA (Mac Stuffit Self-Extracting Archive) or YTR (IRIS OCR data file)'},

    //other
    'PDF': {description: 'PDF document'},
    'DJVU': {description: 'DjVu document'},
    'OfficeOld': {description: 'Compound File Binary Format, a container format defined by Microsoft COM.' +
              ' It can contain the equivalent of files and directories.' +
              ' It is used by <b>Windows Installer</b> and for documents in <b>older versions of Microsoft Office</b>.'},
    'AppleWorks5': {description: 'AppleWorks 5 document'},
    'AppleWorks6': {description: 'AppleWorks 6 document'},

    'SQLite3': {description: 'SQLite Database'},
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
    'dat-reg': {description: 'dat, Windows Registry file'},
    'CRD-RRG': {description: 'crd, Microsoft Windows Cardfile Database Format, RRG card file'},
    'CRD-MGC': {description: 'crd, Microsoft Windows Cardfile Database Format, MGC card file'},

    'UTF8': {description: 'UTF-8 byte order mark, commonly seen in text files'},
    'UTF16LE': {description: 'Text file with UTF-16LE byte order mark'},
    'UTF16BE': {description: 'Text file with UTF-16BE byte order mark'}

  };

  // load WASM module, synchronous
  (async function(){
    _wasmModule = await loadWasmModule (wasmUrl);

    if (_wasmModule.memory !== undefined) {
      // the module was loaded
      fileDropZone.innerHTML = dropZoneText;
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

    if (files === undefined ||
        files.length === 0) {

      r = 'Please, select a file.';
    }
    else {

      file = files[0];

      loader.show();

      var f = async (file) => {

        r +=
          getResultProperty ('File name', file.name) +
          getResultProperty ('File size', formatFileSize (file.size)) +
          getResultProperty ('File MIME type', file.type);

        await reader.readAsArrayBuffer (file);

        reader.onload = function (e) {
          getSignatue (e.target.result, file, resultElement);
          loader.hide();
        };

        reader.onerror = function (e) {
          console.log ('Read error', e.toString());
          loader.hide();
        }

      };

      await f (file);

    }

    resultElement.innerHTML = r;
  }

  /**
    * Processes the file bytes and appends the file description to the result element.
    * @param {*} fileData
    * @param {FILE} file
    * @param {*} resultElement
    */
  function getSignatue(fileData, file, resultElement) {

    // https://wasdk.github.io/WasmFiddle/
    // move -Force C:\Users\ekond\Downloads\program.wasm D:\MyStuff\EA\eakondratiev.github.io\assets\filesignature.wasm

    // create input and output arrays
    // input
    var FILE_ARRAY_SIZE = 300; // some signatures uses an offset
    var RESULT_ARRAY_SIZE = 45;
    var MAX_SHOWN_BYTES = 32;
    var DESCR_TITLE = 'Description';
    var UNKNOWN = 'n/a'; // value returned by the WASM function if the type was not determined.

    var offset = 0;

    var fileBytes = new Uint8Array (_wasmModule.memory.buffer, offset, FILE_ARRAY_SIZE);
    memAllZeroes (fileBytes);
    fileBytes.set(new Uint8Array (fileData, 0, Math.min (fileData.byteLength, FILE_ARRAY_SIZE)));

    if (fileData.byteLength === 0) {
      resultElement.innerHTML += getResultProperty (DESCR_TITLE, 'Empty file');
      return;
    }

    // result
    offset += FILE_ARRAY_SIZE * Uint8Array.BYTES_PER_ELEMENT;
    var resultBytes = new Uint8Array (_wasmModule.memory.buffer, offset, RESULT_ARRAY_SIZE);
    memAllZeroes (resultBytes);

    _wasmModule.getFileSignature (fileBytes.byteOffset, resultBytes.byteOffset);

    var resultText = getStringFromBuffer(resultBytes);
    var description = '';
    var isText = true;

    if (resultText === UNKNOWN) {

      isText = isTextFile(fileData);

      if (isText) {
        description = 'ASCII text file';
      }
      else {
        description = 'A binary file, type not detected';
      }
    }
    else {
      description = getDescription (resultText);
    }

    resultElement.innerHTML += getResultProperty (DESCR_TITLE, description);

    if (resultText === UNKNOWN && isText === false) {
      // for unknown binary files show its first bytes
      resultElement.innerHTML += '<div style="margin: 8pt 0;">' +
        '<div>First bytes</div>' +
        getFirstBytes(fileBytes, Math.min(MAX_SHOWN_BYTES, file.size, FILE_ARRAY_SIZE)) +
        '</div>';
    }

    return;

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
    * @param buf
    */
  function getStringFromBuffer (buf) {
    var s = "";
    var index = 0;
    while(true){
      if(buf[index] !== 0){
        s += String.fromCharCode(buf[index]);
        index++;
      }else{
        return s;
      }
    }

    return ''; // todo: unreachable
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
  function getFirstBytes(fileBytes, size) {

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
   * Returns true if the bytes does not contains binary data
   * or false otherwise.
   * @param {ArrayBuffer} bytes
   */
  function isTextFile(bytes) {

    var MAX_SIZE = 10485760, // 10 MB
      i,
      byte,
      view = new Uint8Array(bytes, 0, MAX_SIZE);

    for (i = 0; i < Math.min (MAX_SIZE, bytes.byteLength); i++) {

      byte = view[i];

      if (byte < 7 ||
          byte > 13 && byte < 27 ||
          byte > 27 && byte < 32 ||
          byte > 126) {

        return false; // binary
      }
    }

    return true; // text

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