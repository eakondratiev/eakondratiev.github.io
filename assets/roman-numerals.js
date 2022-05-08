/*
 * File: roman-numerals.js
 * 2022-05-08
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name roman-numerals.min.js
// ==/ClosureCompiler==
/**
 * Processes the form.
 */
function RomanNumerals() {

  'use strict';

  var inputRomanNumber = document.getElementById('roman-number'),
    resultElement = document.getElementById('result'),
    resultBlock = document.getElementById('result-block'),
    messageBlock = document.getElementById('message-block'),
    btnRomanToNumber = document.getElementById('button-to-number'),
    urlParams = T.getUrlParameters();

  if (!Element.prototype.addEventListener) {

    document.getElementById('incompatible-browser').style.display = 'block';
    return;

  }

  if (urlParams.roman !== undefined) {

    inputRomanNumber.value = decodeURIComponent (urlParams.roman);
    convertRomanToNumber ();

  }

  // Event handlers
  inputRomanNumber.addEventListener('keyup', convertRomanToNumber);
  btnRomanToNumber.addEventListener('click', convertRomanToNumber);

  /**
    * Clears the result text and styles, hide messages.
    */
  function clearResults() {

    resultBlock.style.display = 'block';
    resultElement.innerHTML = '';
    messageBlock.style.display = 'none';

  }

  /**
    * Converts a roman number to integer number.
    * @param (*} event the DOM event, optional.
    */
  function convertRomanToNumber(event) {

    var romanNumber,
      result,
      html = '';

    clearResults ();

    if (event !== undefined) {

      if (event.keyCode !== undefined && event.keyCode !== 13) {
        // A key was pressed by not Enter
        return;
      }

      // Cancel the default action, if needed
      event.preventDefault();

    }

    // validate
    if (inputRomanNumber.value.length === 0) {
      inputRomanNumber.style.border = '1px solid #e00';
      return;
    }

    // convert
    romanNumber = inputRomanNumber.value;
    result = romanToInt (romanNumber);

    // output
    switch (result.error) {
      case 0:
        html = '<b>' + romanNumber + '</b> = <b>' + result.n + '</b>';
        break;

      case 1:
        html = 'The string "<span style="color:#c00;">' + romanNumber +'</span>" is not a roman number.';
        break;

      case 2:
        html = 'Only integer numbers from 1 to 3999 are supported.';
        break;

      default:
        html = 'Unexpected value.';
        break;
    }

    resultElement.innerHTML = html;

  }

  /**
    * Copies the page url to the clipboard for sharing.
    */
  function share() {

    var urlBase = location.protocol + '//' + location.host + '/roman-numerals.htm',
      qs = '',
      params = [];

    if (!navigator.clipboard) {
      messageBlock.innerHTML = 'This function requires HTTPS protocol or localhost.';
      messageBlock.style.display = 'block';
    }
    else {
      // make
      if (testRe.value.length > 0) {
        params.push ('roman=' + encodeURIComponent (inputRomanNumber.value));
      }

      if (params.length > 0) {
        qs = '?' + params.join ('&');
      }

      // copy
      navigator.clipboard.writeText(urlBase + qs);
    
      /* Alert the copied text */
      messageBlock.innerHTML = 'The page url was copied to the clipboard:<div style="word-break: break-all;">' +
        urlBase + qs.replace (/&/g, '&amp;') + '</div>';
      messageBlock.style.display = 'block';
    }

  }

  /**
    * Returns structure with converted number and an error code.
    * Error codes: 0 - ok, 1 - not a Roman number, 2 - the value not supported.
    * @param {string} s The Roman number
    * @return { {n:number, error:number} }
    */
  function romanToInt (s) {
        
      let R = {
          I: 1,
          V: 5,
          X: 10,
          L: 50,
          C: 100,
          D: 500,
          M: 1000
      };

      let prevCharValue = 0;
      let number = 0;

      for (let i = s.length - 1; i >= 0; i--) {

        let c = s.charAt(i).toUpperCase();
          
        if (R[c] === undefined) {
          return {n: NaN, error: 1};
        }

        let v = parseInt (R[c], 10);

        if (prevCharValue <= v) {
          number += v;
        }
        else {
          number -= v;
        }

        prevCharValue = v;

      }

    if (number < 1 || number > 3999) {
      return {n:NaN, error: 2};
    }
        
    return {n:number, error: 0};
  }

  /**
   * Tests the convertion function.
   */
  function test() {

    const T = [
      {R: 'III', Expected:       3},
      {R: 'LVIII', Expected:     58},
      {R: 'MCMXCIV', Expected:   1994},
      {R: 'MMXXII', Expected:    2022},
      {R: 'DLXX', Expected:      570},
      {R: 'MMMDLXXIV', Expected: 3574},
      {R: 'abc', Expected: NaN}];

    for (let i = 0; i < T.length; i++) {
      let actual = romanToInt (T[i].R);
      console.log (T[i].R, actual.n,
        (Object.is (actual.n, T[i].Expected))? 'Test passed' : 'Test FAILED, expected: ' + T[i].Expected);
    }

  }

}
