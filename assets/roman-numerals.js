/*
 * File: roman-numerals.js
 * 2022-05-08
 * 2022-05-10 errors handling added.
 * 2022-05-11 keyboard handler and other corrections.
 * 2022-05-15 romanToInt - validation code moved.
 * 2022-05-16 number to Roman numeral conversion added.
 * 2022-05-20 one form, detect entered value type and do calculations.
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
    inputValue = document.getElementById('value-to-convert'),
    resultBlock = document.getElementById('result-block'),
    resultElement = document.getElementById('result'),
    messageBlock = document.getElementById('message-block'),
    btnRomanToNumber = document.getElementById('button-to-number'),
    message = new T.Message ({element: document.getElementById('message-block')}),

    urlParams = T.getUrlParameters();

    inputValue.maxLength = MAX_INPUT_LENGTH;

  //test ();

  if (!Element.prototype.addEventListener) {

    document.getElementById('incompatible-browser').style.display = 'block';
    return;

  }

  if (urlParams.value !== undefined) {

    inputValue.value = decodeURIComponent (urlParams.value);
    convert ();

  }

  // Event handlers
  inputValue.addEventListener('keyup', convert);
  btnRomanToNumber.addEventListener('click', convert);

  /**
    * Clears the result text and styles and hide messages
    * in the Roman to number block.
    */
  function clearResults() {

    resultBlock.style.display = 'block';
    resultElement.innerHTML = '';
    message.hide ();

  }

  /**
    * Converts a roman numeral to an integer number.
    * @param (*} event the DOM event, optional.
    */
  function convert(event) {

    var RE_ROMAN = /^[IVXLCDM]+$/gi,
      RE_INTEGER = /^\d+$/gi,
      value,
      result,
      html,
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

    // get value
    value = inputValue.value.replace (/^\s+|\s+$/gm, ''); // get text and trim spaces

    // validate
    if (value.length === 0) {
      // nothing to convert, ok
      return;
    }

    if (value.length > MAX_INPUT_LENGTH) {
      message.show ('The input value is too long. Maximum length is ' +
        MAX_INPUT_LENGTH + ' characters.', T.MessageLevel.WARNING);
      return;
    }

    // detect
    if (RE_ROMAN.test(value)) {

      // Roman to number
      result = romanToInt (value, MAX_INPUT_LENGTH);
      result.isRomanToNumber = true;
    }
    else if (RE_INTEGER.test(value)) {

      // number to Roman
      value = value.replace (/[,]/g, '.'); // replace the decimal delimiter with a dot

      // convert to float, the function will test is in integer or float
      result = intToRoman (parseFloat (value));
      result.isRomanToNumber = false;
    }
    else {

      message.show (
        'The text "<span class="err">' + value +'</span>" is not recognized as a Roman numeral or an integer number.',
        T.MessageLevel.WARNING);

      return;
    }

    // Process result and errors
    switch (result.error) {
      case 0:
        // ok
        if (result.isRomanToNumber) {
          html = '<b>' + result.roman + '</b> = <b>' + result.number + '</b>';
        }
        else {
          html = '<b>' + result.number + '</b> = <b>' + result.roman + '</b>';
        }
        break;

      case 1:
        message.show ('Only integer numbers from 1 to 3999 are supported.', T.MessageLevel.WARNING);
        break;

      // case 2: skipped, initial validation is done
      case 3:
        if (result.isRomanToNumber) {
          message.show (
            'The string "<span class="err">' + result.roman +'</span>" is not a valid roman numeral.',
            T.MessageLevel.WARNING);
        }
        else {
          message.show (
            'The value "<span class="err">' + inputText +'</span>" is not recognized as an integer number.',
            T.MessageLevel.WARNING);
        }

    }

    console.log ('res', result);

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
        params.push ('roman=' + encodeURIComponent (inputValue.value));
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
    * Returns structure with converted numeral and an error code.
    * Error codes: 0 - ok, 1 - not in range, 2 - not a roman numeral,
    *   3 - not recognized, 4 - no input, 5 - too long.
    * @param {string} s The Roman numeral.
    * @param {number} maxLength The input string maximum length in characters.
    * @return { {roman:string, number:number, error:number} }
    */
  function romanToInt (s, maxLength) {
        
    var R = {
        I: 1,
        V: 5,
        X: 10,
        L: 50,
        C: 100,
        D: 500,
        M: 1000
    };

    var prevCharValue = 0;
    var number = 0;
    var i;
    var c;
    var v;
    var result = {roman: s, number: NaN, error: 0};

    if (maxLength === undefined) {
      maxLength = 15;
    }

    if (s === undefined || s.length === 0) {
      result.error = 4; // no input
      return result; 
    }

    if (s.length > maxLength) {
      result.error = 5; // too long
      return result;
    }

    if (!s.match(reValid)) {
      result.error = 3; // not recognized
      return result;
    }

    for (i = s.length - 1; i >= 0; i--) {
      // from right (less significant) to left (most significant)

      c = s.charAt(i).toUpperCase();
          
      if (R[c] === undefined) {
        result.error = 2; // not a Roman numeral
        return result;
      }

      v = parseInt (R[c], 10);

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
      result.error = 1; // not in range
      return result;
    }
        
    result.number = number;
    return result; // ok, no errors
  }

  /**
    * Returns the structure with the Roman numeral and an error code.
    * Error codes: 0 - ok, 1 - not in range, 2 - not a number, 3 - not integer
    * @param {number} n the input value, a number.
    * @return { {roman:string, number:number, error:number} }
    */
  function intToRoman (n) {

    var symbols = ['I', 'V', 'X', 'L', 'C', 'D', 'M'],
      index = 0,
      chars,
      i,
      digit,
      result = {roman: '', number: n, error: 0};;

    // validation
    if (typeof (n) !== 'number' || isNaN (n)) {
      result.error = 2; // Not a number
      return result;
    }

    if (n < 1 || n > 3999) {
      result.error = 1; // Not in range 1...3999
      return result; 
    }

    if (n !== Math.floor (n)) {
      result.error = 3; // Not integer
      return result;
    }

    chars = n.toString().split('');

    for (i = chars.length - 1; i >= 0; i--) {

      digit = parseInt (chars[i], 10);

      switch (digit) {
      case 1:
        result.roman = symbols[index] + result.roman;
        break;
      case 2:
        result.roman = symbols[index] + symbols[index] + result.roman;
        break;
      case 3:
        result.roman = symbols[index] + symbols[index] + symbols[index] + result.roman;
        break;
      case 4:
        result.roman = symbols[index] + symbols[index + 1] + result.roman;
        break;
      case 5:
        result.roman = symbols[index + 1] + result.roman;
        break;
      case 6:
        result.roman = symbols[index + 1] + symbols[index] + result.roman;
        break;
      case 7:
        result.roman = symbols[index + 1] + symbols[index] + symbols[index] + result.roman;
        break;
      case 8:
        result.roman = symbols[index + 1] + symbols[index] + symbols[index] + symbols[index] + result.roman;
        break;
      case 9:
        result.roman = symbols[index] + symbols[index + 2] + result.roman;
        break;

      }

      index += 2;

    }

    return result; // ok, no errors
  }

  /**
   * Tests the convertion function.
   */
  function test() {

    var fn = intToRoman,
      fails = [];

    // TESTS:
    console.group ('Tests 1');
    // timing
    var startTime = new Date();
    for (let i = 1; i <= 3999; i++) {
      let roman = fn (i);
    }
    console.log ('Lapse:', (new Date() - startTime) +  " ms.");

    // test
    for (let i = 1; i <= 3999; i++) {
      let roman = fn (i);
      let int = romanToInt (roman.roman, MAX_INPUT_LENGTH);

      if (int.n !== i) {
        //console.log (`Failed i: ${i}, roman: ${roman.roman}`);
        fails.push ({i: i, Roman: roman.roman});
      }
      else {
        //console.log (`OK i: ${i}, roman: ${roman.roman}`);
      }

    }

    if (fails.length > 0) {
      console.error (`Failed ${fails.length} tests:`, fails);
    }
    else {
      console.log ('Tests passed');
    }

    console.groupEnd();
    console.group ('Tests 2');

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
    console.groupEnd();

  }

}
