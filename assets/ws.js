﻿/*
 * Javascript code for the ws.htm page.
 * 
 * 2025-03-25
 */

function wsPage () {
  'use strict';

  var URL_PARAM = 't';
  var showBytes = undefined;
  var sourceElement = document.getElementById('text-box'),
    targetElement = document.getElementById('text-processed'),
    lenElement = document.getElementById('text-len'),
    nonAsciiElement = document.getElementById('nonascii-counter'),
    nonAsciiCounter = nonAsciiElement.getElementsByTagName('b')[0],
    bytesCounterElement = document.getElementById('bytes-counter'),
    bytesCounter = bytesCounterElement.getElementsByTagName('b')[0],
    showContentBytes = (typeof TextEncoder !== 'undefined'),
    charElement = document.getElementById('text-character'),
    charCharElement = charElement.getElementsByTagName('b')[0],
    charBytesElement = charElement.getElementsByTagName('b')[1],
    urlParams = T.getUrlParameters();

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
      setTimeout (function() { textChanged(); }, 0); // the paste event fired BEFORE the element content is updated, so the call is delayed
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

    var cp2b = function(cp) {

      var b = new Array(4); // strings in javascript are UTF-16, 4-bytes
      var i;

      for (i = 3; i >= 0; i--) {
        b[i] = (cp >> (i * 8)) & 0xFF;
      }

      return b; // array of numbers

    };

    charElement.style.display = 'block'; // shows the block
    sourceElement.onmouseup = function(){
      showBytes();
    };

    /**
      * Shows the character and its bytes
      */
    showBytes = function() {
      // https://stackoverflow.com/questions/5290182/how-many-bytes-does-one-unicode-character-take#33349765
      var cp = getCodePoint();
      var i;
      var bytesText = '';
      var skip = true;
      var byteToString = function(b) {
        var s = b.toString(16);
        if (b < 16) {
          return '0' + s;
        }
        return s;
      };

      if (cp === 0) { 
        charCharElement.innerHTML = '';
        charBytesElement.innerHTML = '';
        return; 
      }

      var b = cp2b(cp);
      if (cp > 0) {
        charCharElement.innerHTML = String.fromCodePoint (cp);
      }
      else {
        charCharElement.innerHTML = '';
      }

      // show bytes in reverse order
      for (i = b.length - 1; i >= 0; i--) {

        if (b[i] === 0 && skip) {
          continue;
        }
        skip = false;
        bytesText += ' ' + byteToString(b[i]) + '';  // hex
  
      }

      charBytesElement.innerHTML = bytesText;
    };

  }

  /**
    * Return the Unicode code point next to text cursor or zero;
    */
  function getCodePoint (){
    var p = sourceElement.selectionStart;
    var c = sourceElement.value.codePointAt(p);
    if (sourceElement.selectionEnd - p <= 1) {
      return c;
    }
    return 0;
  }

  /**
    * Sets text from the textarea to the url parameter.
    */
  function textChanged() {

    var result = processText(sourceElement.value);
    var contentBytes = [];

    if (showContentBytes) {
      contentBytes = getBytesArray(sourceElement.value);
      bytesCounter.innerText = contentBytes.length;
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
    lenElement.innerHTML = getTextLength (sourceElement.value).toString();

    // Show character next to text cursor
    if (typeof showBytes === 'function') {
      showBytes();
    }

    if (window.history.pushState) {
      window.history.pushState('ws.htm', 'Title', '/ws.htm?' +
        URL_PARAM + '=' + encodeURIComponent(sourceElement.value));
    }
  }

  /**
   * Returns the text length, one emoji counts as one.
   * If the Segmenter does not support it returns inaccurate text.length.
   * @param {string} text
   * @returns {number}
   */
  function getTextLength (text) {

    var segmenter;
    var graphemes;

    // check the function support
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {

      segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        
      // Use the segmenter to split the string into graphemes
      graphemes = Array.from(segmenter.segment(text));
        
      // Return the number of graphemes
      return graphemes.length;
    }
    else {
      // inaccurate
      return text.length;
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

  function getBytesArray(str) {
      const encoder = new TextEncoder(); // Default is UTF-8
      return encoder.encode(str);
  }
}