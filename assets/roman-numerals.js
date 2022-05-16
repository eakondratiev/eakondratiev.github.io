/*
 * File: roman-numerals.js
 * 2022-05-08
 * 2022-05-10 errors handling added.
 * 2022-05-11 keyboard handler and other corrections.
 * 2022-05-15 romanToInt - validation code moved.
 * 2022-05-16 number to Roman numeral conversion added.
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
    resultBlock = document.getElementById('result-block'),
    resultElement = document.getElementById('result'),
    messageBlock = document.getElementById('message-block'),
    btnRomanToNumber = document.getElementById('button-to-number'),
    message = new T.Message ({element: document.getElementById('message-block')}),

    inputIntegerNumber = document.getElementById ('integer-number'),
    resultBlockN2r = document.getElementById ('result-block-n2r'),
    resultElementN2r = document.getElementById ('result-n2r'),
    messageBlogN2r = document.getElementById ('message-block-n2r'),
    btnNumberToRoman = document.getElementById ('button-to-roman'),
    messageN2r = new T.Message ({element: document.getElementById('message-block-n2r')}),

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

  if (urlParams.number !== undefined) {

    inputIntegerNumber.value = decodeURIComponent (urlParams.number);
    convertNumberToRoman ();

  }

  // Event handlers
  inputRomanNumber.addEventListener('keyup', convertRomanToNumber);
  btnRomanToNumber.addEventListener('click', convertRomanToNumber);

  inputIntegerNumber.addEventListener('keyup', convertNumberToRoman);
  btnNumberToRoman.addEventListener('click', convertNumberToRoman);

  /**
    * Clears the result text and styles and hide messages
    * in the Roman to number block.
    */
  function clearResultsR2N() {

    resultBlock.style.display = 'block';
    resultElement.innerHTML = '';
    message.hide ();

  }

  /**
    * Clears the result text and styles and hide messages
    * in the Number to Roman block.
    */
  function clearResultsN2R() {

    resultBlockN2r.style.display = 'block';
    resultElementN2r.innerHTML = '';
    messageN2r.hide ();

  }

  /**
    * Converts a roman numeral to an integer number.
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

    clearResultsR2N ();

    // convert
    romanNumber = inputRomanNumber.value.replace (/^\s+|\s+$/gm, ''); // get text and trim spaces
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
    * Converts a number to Roman numeral.
    * @param (*} event the DOM event, optional.
    */
  function convertNumberToRoman(event) {

    var integerNumber,
      inputText,
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

    clearResultsN2R ();

    // convert
    inputText = inputIntegerNumber.value
        .replace (/^\s+|\s+$/gm, '') // get text and trim spaces
        .replace (/[,]/g, '.');      // replace the decimal delimiter to a dot

    integerNumber = parseFloat (inputText); // convert to float, the function will test is in integer or float
    result = intToRoman (integerNumber);

    // output
    switch (result.error) {
      case 0:
        html = '<b>' + integerNumber + '</b> = <b>' + result.roman + '</b>';
        break;

      case 1:
        messageN2r.show (
          'The text "<span style="color:#c00;">' + inputText +'</span>" is not a number.',
          T.MessageLevel.WARNING);
        break;

      case 2:
        messageN2r.show ('Only integer numbers from 1 to 3999 are supported.', T.MessageLevel.WARNING);
        break;

      case 3:
        messageN2r.show (
          'The text "<span style="color:#c00;">' + inputText +'</span>" is not recognized as an integer number.',
          T.MessageLevel.WARNING);
        break;

      default:
        inputBorderStyle = '1px solid #e00';
        messageN2r.show ('Unexpected value.', T.MessageLevel.ERROR);
        break;
    }

    inputIntegerNumber.style.border = inputBorderStyle;
    resultElementN2r.innerHTML = html;
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
    * Returns the structure with the Roman numeral and an error code.
    * Error codes: 0 - ok, 1 - not a number, 2 - Not in range 1...3999,
    *   3 - Not integer
    * @param {number} n the input value, a number.
    * @return { {roman:string, error:number} }
    */
  function intToRoman (n) {

    var symbols = ['I', 'V', 'X', 'L', 'C', 'D', 'M'],
      index = 0,
      chars,
      i,
      digit,
      result = '';

    // validation
    if (typeof (n) !== 'number' || isNaN (n)) {
      return { roman:'', error: 1 }; // Not a number
    }

    if (n < 1 || n > 3999) {
      return { roman:'', error: 2 }; // Not in range 1...3999
    }

    if (n !== Math.floor (n)) {
      return { roman:'', error: 3 }; // Not integer
    }

    chars = n.toString().split('');

    for (i = chars.length - 1; i >= 0; i--) {

      digit = parseInt (chars[i], 10);

      switch (digit) {
      case 1:
        result = symbols[index] + result;
        break;
      case 2:
        result = symbols[index] + symbols[index] + result;
        break;
      case 3:
        result = symbols[index] + symbols[index] + symbols[index] + result;
        break;
      case 4:
        result = symbols[index] + symbols[index + 1] + result;
        break;
      case 5:
        result = symbols[index + 1] + result;
        break;
      case 6:
        result = symbols[index + 1] + symbols[index] + result;
        break;
      case 7:
        result = symbols[index + 1] + symbols[index] + symbols[index] + result;
        break;
      case 8:
        result = symbols[index + 1] + symbols[index] + symbols[index] + symbols[index] + result;
        break;
      case 9:
        result = symbols[index] + symbols[index + 2] + result;
        break;

      }

      index += 2;

    }

    return { roman: result, error: 0 };
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
