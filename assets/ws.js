/*
 * Javascript code for the ws.htm page.
 * 
 * 2025-03-25
 * 2025-03-26 Graphemes type added.
 * 2025-03-28 Show the whole text bytes.
 * 2025-03-29 Show the whole text bytes.
 */

function wsPage () {
  'use strict';

  var URL_PARAM = 't';
  var supportCodepoints = false;
  var sourceElement = document.getElementById('text-box'),
    targetElement = document.getElementById('text-processed'),
    lenElement = document.getElementById('text-len'),
    nonAsciiElement = document.getElementById('nonascii-counter'),
    nonAsciiCounter = nonAsciiElement.getElementsByTagName('b')[0],
    bytesCounterElement = document.getElementById('bytes-counter'),
    bytesCounter = bytesCounterElement.getElementsByTagName('b')[0],
    textBytesElement = document.getElementById('text-bytes'),
    showContentBytes = (typeof TextEncoder !== 'undefined'),
    charElement = document.getElementById('text-character'),
    charCharElement = charElement.getElementsByTagName('b')[0],
    charCodepointsElement = charElement.getElementsByTagName('b')[1], // the Unicode code point
    urlParams = T.getUrlParameters();

  var graphemes = (function(){

    var _length = 0;
    var _segmenter = null;
    var _segments = [];

    return {
      init: function(){

        var s, i, r;

        try {
          _segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
          // do quick test
          s = _segmenter.segment('abc');
          i = s[Symbol.iterator]();
          r = i.next();
        } catch (e) {
          _segmenter = null;
        }

      },

      update: function(text){
      
        if (_segmenter) {
        
          try {

            _length = 0;
            _segments = Array.from (_segmenter.segment(text));
            _length = _segments.length;
            return;

          } catch (e) {
            _segments = [];
          }        

        }

        // Fallback but inaccurate
        _length = text.length;

      },

      getLength: function() {
        // for better compatibility the function is used instead of getter
        return _length;
      },

      getSegments: function(){
        return _segments;
      }
    };

  })();

  graphemes.init();

  // check feature
  if (showContentBytes) {
    bytesCounterElement.style.display = ''; // show the container of bytes counter
  }

  sourceElement.focus();

  // check if the newer 'input' event can be handled or not
  if (typeof Event !== 'undefined' && typeof sourceElement.oninput === 'object') {
    // inserting via system Emoji picker supported
    sourceElement.addEventListener ('input', textChanged);
  }
  else {
    // older browsers, inserting via system Emoji picker not supported
    sourceElement.addEventListener ('change', textChanged);
    sourceElement.addEventListener ('paste', function(e) {
      setTimeout (function() { textChanged(e); }, 0); // the paste event fired BEFORE the element content is updated, so the call is delayed
    });
  }

  // this handles the text cursor moves
  sourceElement.addEventListener ('keyup', textChanged);

  if (urlParams.t !== undefined) {
    // process the url parameter
    sourceElement.value = decodeURIComponent(urlParams.t);
    textChanged();
  }

  // Shows the current character, first check browser support
  if (window.getSelection !== undefined &&
      String.fromCodePoint !== undefined) {

    supportCodepoints = true;
    charElement.style.display = 'block'; // shows the block
    sourceElement.onmouseup = function(){
      showCharAndCodepoints();
    };

  }

  /**
    * Shows the character and its Unicode code points
    */
  function showCharAndCodepoints() {
      
    var segments = graphemes.getSegments();
    var p = sourceElement.selectionStart;
    var cp;
    var symbol = '';
    var codepoints;
    var i;
    var j;
      
    if (segments.length === 0) {
      // empty text or the browser don't support Intl.Segmenter
      cp = getCodePoint(p); // non-negative integer that is the Unicode code point value
      
      if (cp === 0) { 
        charCharElement.innerHTML = '';
        charCodepointsElement.innerHTML = '';
      }
      else {
        charCharElement.innerHTML = String.fromCodePoint (cp);
        charCodepointsElement.innerHTML = codepointToString (cp);
      }

    }
    else {
      // use Intl.Segmenter
      charCodepointsElement.innerHTML = '';

      for (i = 0; i < segments.length; i++) {
        if (segments[i].index === p) {
          symbol = segments[i].segment;

          for (j = 0; j < symbol.length; j++) {
            cp = symbol.codePointAt (j);
            // the space is after the code point, so the first codepoint will not break from the field title
            charCodepointsElement.innerHTML += codepointToString (cp) + ' ';
          }

          charCharElement.textContent = symbol;
          return; // done
        }
      }

    }

  };

  /**
    * Return the Unicode code point next to text cursor or zero;
    * @returns {numner} non-negative integer that is the Unicode code point value of the character.
    */
  function getCodePoint (position){

    var cp = sourceElement.value.codePointAt(position);

    if (cp!== undefined && sourceElement.selectionEnd - position <= 1) {
      return cp;
    }
    return 0;
  }

  /**
   * Returns 4-bytes array representing the Unicode code point
   * @param {number} cp
   * @returns {[]}
   */
  function codePointToBytes (cp) {

    var b = new Array(4); // strings in javascript are UTF-16, 4-bytes
    var i;

    for (i = 3; i >= 0; i--) {
      b[i] = (cp >> (i * 8)) & 0xFF;
    }

    return b; // array of numbers

  };


  /**
    * Sets text from the textarea to the url parameter.
    */
  function textChanged() {

    // this function can be called with or without arguments
    var result = processText(sourceElement.value);
    var contentBytes = [];
    var isKeyUp = (arguments.length > 0 && arguments[0].type === 'keyup');

    if (showContentBytes) {
      contentBytes = getBytesArray(sourceElement.value);
      bytesCounter.innerText = contentBytes.length;

      // show bytes
      if (isKeyUp) {
        // emphasize bytes at the text cursor
      }
      else {
        // render bytes
        showTextBytes (contentBytes);
      }
    }

    targetElement.innerHTML = result.text;
    nonAsciiCounter.innerHTML = result.nonAscii;

    if (result.nonAscii > 0) {
      nonAsciiElement.style.display = '';
    }
    else {
      nonAsciiElement.style.display = 'none';
    }

    if (sourceElement.value.length > 0) {
      targetElement.style.display = 'block';
    }
    else {
      targetElement.style.display = 'none';
    }
    graphemes.update(sourceElement.value);
    lenElement.innerHTML = graphemes.getLength().toString();

    // Show character next to text cursor
    if (supportCodepoints) {
      showCharAndCodepoints();
    }

    if (window.history.pushState) {
      window.history.pushState('ws.htm', 'Title', '/ws.htm?' +
        URL_PARAM + '=' + encodeURIComponent(sourceElement.value));
    }
  }

  /**
    * Processes the entered text.
    * @param {string} text the entered text.
    * returns {{text:string, nonAscii:number}}
    */
  function processText(text) {

    // NOTE: textarea internal value, the line breaks are normalized to LF (only).
    var reNonAscii = /([\u00FF-\uFFFF])/g,
      reNewline = /[\n\u2029]/g, // u2029 - paragraph separator
      reWhiteSpace = /[\u0020\u00A0\u2000-\u200A\u2028\u205F\u3000]/g, // u2028 - line separator.
      reTab = /\t/g;

    var nonAsciiMatches = text.match (reNonAscii);
    var nonAsciiCounter = nonAsciiMatches? nonAsciiMatches.length : 0;
          
    return {
      text: text.replace (/</g, '&lt;') // escape HTML <
        .replace(/>/g, '&gt;')          // and >
        .replace(reNonAscii, '<b>$1</b>')
        .replace(reTab, '<i>&rarr;</i>')
        .replace(reWhiteSpace, '<i>.</i>')
        .replace(reNewline, '<i class="new-line-symbol">&para;</i><br />'),
      nonAscii: nonAsciiCounter
    };
  }

  /**
   * Returns the string byte array
   * @param {string} str
   * @returns {[number]}
   */
  function getBytesArray(str) {
      var encoder = new TextEncoder(); // Default is UTF-8
      return encoder.encode(str);
  }

  /**
   * Show the whole text bytes
   * @param {[number]} bytes
   */
  function showTextBytes (bytes) {

    var html = '';
    var i;

    // TODO: add graphemes
    if (bytes.length > 0) {

      for (i = 0; i < bytes.length; i++) {
        html += '<i>' + byteToHexString (bytes[i]) + '</i>';
        if (i !== 0 && (i + 1) % 16 === 0) {
          html += '<br>';
        }
      }

      textBytesElement.innerHTML = html;

      // show the box
      textBytesElement.style.display = 'block';
    
    }
    else {
      // clear
      textBytesElement.textContent = '';
      textBytesElement.style.display = 'none';
    }
  }

  /**
   * Returns the string representation of the Unicode code point
   * @param {any} cp
   */
  function codepointToString (cp) {

    var b = codePointToBytes(cp); // 4-bytes array
    var i;
    var leadingZeroByteCount = 0;
    var bytesText = '';

    // count leading zero bytes
    for (i = b.length - 1; i >= 0; i--) {
      if (b[i] === 0) {
        ++leadingZeroByteCount;
      }
      else {
        break;
      }
    }

    // show bytes in reverse order. For example:
    // 👍       bytes 4d f4 01 00, code point 1 f4 4d, 00 and 0 are omited
    // tab (/t) bytes 09 00 00 00, code point 00 09
    for (i = b.length - 1; i >= 0; i--) {

      if (b[i] === 0 && (
            (leadingZeroByteCount >= 2 && i >= 2) ||
            (leadingZeroByteCount === 1 && i === 3))) {
        // skip first zero bytes if 2 or 3 leading bytes are zeros
        continue;
      }

      if (leadingZeroByteCount <= 1 && i === 2) {
        // no leading zero
        bytesText += b[i].toString(16);
      }
      else {
        // zero-padded
        bytesText += byteToHexString(b[i]);
      }
  
    }
    return 'U+' + bytesText;
  }

  /**
    * Returns the hexademical value representation of the byte.
    */
  function byteToHexString(n) {

    var hex = n.toString(16).toUpperCase();

    if (n < 16) {
      return '0' + hex;
    }
    return hex;
  }

}