/*
 * File: roman-numerals.js
 * 2022-05-08
 * 2022-05-10 errors handling added.
 * 2022-05-11 keyboard handler and other corrections.
 * 2022-05-15 romanToInt - validation code moved.
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

  var MAX_INPUT_LENGTH = 15, // characters
    reValid = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i, // thanks to https://stackoverflow.com/a/267405
    inputRomanNumber = document.getElementById('roman-number'),
    resultElement = document.getElementById('result'),
    resultBlock = document.getElementById('result-block'),
    messageBlock = document.getElementById('message-block'),
    btnRomanToNumber = document.getElementById('button-to-number'),
    message = new T.Message ({element: document.getElementById('message-block')}),
    urlParams = T.getUrlParameters();

  //test ();

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
    message.hide ();

  }

  /**
    * Converts a roman number to integer number.
    * @param (*} event the DOM event, optional.
    */
  function convertRomanToNumber(event) {

    var romanNumber,
      result,
      html = '',
      inputBorderStyle = '',
      key;

    if (event !== undefined) {

      key = event.keyCode;

      if (key !== undefined && key !== 13) {
        // A key was pressed by not Enter
        return;
      }

      // Cancel the default action, if needed
      event.preventDefault();

    }

    clearResults ();

    // convert
    romanNumber = inputRomanNumber.value.replace (/^\s+|\s+$/gm, ''); // get text adt trim spaces
    result = romanToInt (romanNumber, MAX_INPUT_LENGTH);

    // output
    switch (result.error) {
      case 0:
        html = '<b>' + romanNumber + '</b> = <b>' + result.n + '</b>';
        break;

      case 1:
        message.show (
          'The string "<span style="color:#c00;">' + romanNumber +'</span>" is not a roman numeral.',
          T.MessageLevel.WARNING);
        break;

      case 2:
        message.show ('Only integer numbers from 1 to 3999 are supported.', T.MessageLevel.WARNING);
        break;

      case 3:
        // no input value, its ok
        break;

      case 4:
        message.show ('The Roman number is too long. Maximum length is ' +
          MAX_INPUT_LENGTH + ' characters.', T.MessageLevel.WARNING);
        break;

      case 5:
        message.show (
          'The string "<span style="color:#c00;">' + romanNumber +'</span>" is not a valid roman numeral.',
          T.MessageLevel.WARNING);
        break;

      default:
        inputBorderStyle = '1px solid #e00';
        message.show ('Unexpected value.', T.MessageLevel.ERROR);
        break;
    }

    inputRomanNumber.style.border = inputBorderStyle;
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
    * Error codes: 0 - ok, 1 - not a Roman number, 2 - the value not supported,
    *   3 - no input data, 4 - the string is too long, 5 - invalid sequence.
    * @param {string} s The Roman number
    * @param {number} maxLength The input string maximum length in characters.
    * @return { {n:number, error:number} }
    */
  function romanToInt (s, maxLength) {
        
    let R = {
        I: 1,
        V: 5,
        X: 10,
        L: 50,
        C: 100,
        D: 500,
        M: 1000
    };

    if (maxLength === undefined) {
      maxLength = 15;
    }

    if (s === undefined || s.length === 0) {
      return { n: NaN, error: 3 };
    }

    if (s.length > maxLength) {
      return { n: NaN, error: 4 };
    }

    if (!s.match(reValid)) {
      return {n: NaN, error: 5};
    }

    let prevCharValue = 0;
    let number = 0;

      for (let i = s.length - 1; i >= 0; i--) {
        // from right (less significant) to left (most significant)

        let c = s.charAt(i).toUpperCase();
          
        if (R[c] === undefined) {
          return {n: NaN, error: 1};
        }

        let v = parseInt (R[c], 10);

        if (prevCharValue <= v) {
          number += v;
        }
        else {

          // the value must preceed previous number in the alphabet
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
      {R: 'IIIIIVVVVVXXXXXLLLLL', Expected: NaN},
      {R: 'abc', Expected: NaN}];

    for (let i = 0; i < T.length; i++) {
      let actual = romanToInt (T[i].R, MAX_INPUT_LENGTH);
      console.log (T[i].R, actual.n,
        (Object.is (actual.n, T[i].Expected))? 'Test passed' : 'Test FAILED, expected: ' + T[i].Expected);
    }

  }

}
