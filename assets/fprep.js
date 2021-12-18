/*
 * Floating-point representation,
 * used WASM code.
 * 
 * Depends on: menu.js
 * 
 * ref: https://docs.microsoft.com/en-us/cpp/build/ieee-floating-point-representation?view=msvc-170
 * 
 * 2021-12-06
 * 2021-12-08 use of T.getNumber().
 * 2021-12-09 special case of zero.
 * 2021-12-11 code corrections, 64-bit (double) added.
 * 2021-12-18 32- and 64-bit representation is shown.
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name fprep.min.js
// ==/ClosureCompiler==
/**
 * Processes the floating point number and shows its representation.
 */
function processFloatingPointValue(inputElement, resultElement) {

  'use strict';

  // TEST
  // 0,1
  // 32-bit
  // 00111101 10011001 10011001 10011001 (DONE)
  // 64-bit
  // 00111111 10111001 10011001 10011001 10011001 10011001 10011001 10011001

  var inputText = inputElement.value;
  var number = T.getNumber(inputText);

  resultElement.innerHTML = '';

  if (isNaN(number) || !isFinite(number)) {
    resultElement.innerHTML = 'n/a';
    return;
  }


  fetch('/assets/fprep.wasm')
    .then(response =>
      response.arrayBuffer()
    )
    .then(bytes => WebAssembly.instantiate(bytes))
    .then(results => {

      var instance = results.instance;

      const { memory, getFloatBits, getDoubleBits } = instance.exports;

      const arr32 = new Int32Array(memory.buffer, 0, 32);
      const arr64 = new Int32Array(memory.buffer, 0, 64);

      getFloatBits(arr32.byteOffser, number);
      resultElement.innerHTML += getResults (arr32, number);

      getDoubleBits(arr64.byteOffser, number);
      resultElement.innerHTML += getResults (arr64, number);

      resultElement.innerHTML += '<p>The javascript representation is 64-bits <b>' +
        number.toFixed(64) + '</b>.</p>';

    })
    .catch(console.error);

  /**
   * Resturs description of the array bits.
   * @param {[number]} array
   * @returns {string}
   */
  function getResults(array, number) {

    var exponentBits;
    var exponentBias;
    var i;
    var floatValue;
    var text;

    var totalBits = array.length;

    switch (totalBits) {
      case 32:
        exponentBits = 8;
        exponentBias = 127;
        break;

      case 64:
        exponentBits = 11;
        exponentBias = 1023;
        break;

      default:
        resultElement.innerHTML = 'Must be 32 or 64 bits.';

    }

    // the title and bits
    text =
      '<h2>' + totalBits + '-bit representation</h2>' +
      '<div class="bits">' + formatBits (array, exponentBits) + '</div>';

    // bits description
    // the sign bit
    var fpSign;
    var description = 'The sign bit <span class="fp-bit fp-sign">' +
      array[0] + '</span>: the number is ';

    if (array[0] === 0) {
      description += '<b>positive</b>.';
      fpSign = '+';
      floatValue = 1;
    }
    else {
      description += '<b>negative</b>.';
      fpSign = '-';
      floatValue = -1;
    }

    text += '<p>' + description + '</p>';

    // exponent description
    var expValue = '';

    description = 'The exponent stored as ' + exponentBits + ' bits <span class="fp-bit fp-exp">';

    for (i = 1; i <= exponentBits; i++) {
      expValue += array[i];
    }

    description += expValue + '</span> = ';

    expValue = parseInt(expValue, 2); // convert to decimal
    description += '<b>' + expValue + '</b> and the real value is ' +
      expValue + ' - ' + exponentBias + ' = <b>' + (expValue - exponentBias) + '</b>. ' +
      'So the exponent is <b>2<sup>' + (expValue - exponentBias) + '</sup></b>.';

    text += '<p>' + description + '</p>';

    // fraction description
    var fraction = '',
      fValue = 0;

    description = 'The fraction stored as ' + (totalBits - exponentBits - 1) +
      ' bits <span class="fp-bit fp-fraction">';

    for (i = exponentBits + 1; i < totalBits; i++) {
      fraction += array[i];
      fValue += array[i] * Math.pow(2, exponentBits - i);
    }

    // 20 is maximum to number.toLocaleString().
    var fmt = {minimumFractionDigits: 10, maximumFractionDigits: 20};

    description += fraction + '</span> = ' + fValue +
      '. The 1 is not stored but asumed, so the fraction is 1 + ' + fValue +
      ' = <b>' + T.formatNumber (1 + fValue, 'en-US', fmt) + '</b>.';

    text += '<p>' + description + '</p>';

    // So
    floatValue *= (1 + fValue) * Math.pow(2, (expValue - exponentBias));

    text += '<p>The number <b>' + number +
      '</b> is represented as <b>' + fpSign + (1 + fValue) + '&times;2<sup>' +
      (expValue - exponentBias) + '</sup> = <b>' +
      T.formatNumber (floatValue, 'en-US', fmt) + '</b></p >';

    return text;
  }

  /**
   * Returns html code for the bits.
   * @param {[number]} bits the array of bits.
   * @param {number} exponentBits the number of bits for exponent, deafult is 8.
   * @returns {string}
   */
  function formatBits(bits, exponentBits) {

    var i,
        text = '';
    
    exponentBits = exponentBits || 8;

    // display bits
    for (i = 0; i < bits.length; i++) {

      text += formatBit(bits[i], i, exponentBits);

      // separate octets with a space, so the line could be break down.
      if (i === 7 || i === 15 || i === 23 || i === 31 ||
          i === 39 || i === 47 || i === 55 || i === 63) {
        text += ' ';
      }

    }

    return text;

  }

  /**
   * Returns formatted bit.
   * @param {number} value the bit value.
   * @param {number} index the bit index in array.
   * @param {number} exponentBits the number of bits for exponent, deafult is 8.
   */
  function formatBit(value, index, exponentBits) {

    var css;

    exponentBits = exponentBits || 8;

    if (index === 0) {
      css = 'fp-sign';
    }
    else if (index <= exponentBits) {
      css = 'fp-exp';
    }
    else {
      css = 'fp-fraction';
    }

    return '<span class="fp-bit ' + css + '">' + value + '</span>';
  }

}
