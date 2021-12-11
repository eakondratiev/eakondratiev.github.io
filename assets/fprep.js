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
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name fprep.min.js
// ==/ClosureCompiler==
/**
 * Processes the floating point number and shows its representation.
 */
function processFloatingPointValue(inputElement, resultElement) {

  const BITS = 32; // 32 or 64

  // TEST
  // 0,1
  // 32-bit
  // 001111011 1001100 11001100 11001100 (DONE)
  // 64-bit
  // 00111111 10111001 10011001 10011001 10011001 10011001 10011001 10011001

  var inputText = inputElement.value;
  var number = T.getNumber(inputText);
  var exponentBits;
  var exponentBias;

  if (BITS === 64) {
    exponentBits = 11;
    exponentBias = 1023;
  }
  else {
    exponentBits = 8;
    exponentBias = 127;
  }

  if (isNaN(number) || !isFinite(number)) {
    resultElement.innerHTML = 'n/a';
    return;
  }

  // the title
  resultElement.innerHTML = '<h2>' + BITS + '-bit representation</h2>';

  if (number === 0) {
    // special case

    var zeroes = [];
    var i;

    for (i = 0; i < BITS; i++) zeroes[i] = 0;

    resultElement.innerHTML +=
      '<p>Zero is a <b>special case</b>. It represented by special bit pattern of all zeroes.</p>' +
      '<p>' + formatBits (zeroes, exponentBits) + '</p>';

    return;
  }

  fetch('/assets/fprep.wasm')
    .then(response =>
      response.arrayBuffer()
    )
    .then(bytes => WebAssembly.instantiate(bytes))
    .then(results => {

      var instance = results.instance;
      var i;
      var floatValue;

      const { memory, getFloatBits, getDoubleBits } = instance.exports;
      const arr = new Int32Array(memory.buffer, 0, BITS);

      if (BITS === 64) {
        getDoubleBits(arr.byteOffser, number);
      }
      else {
        getFloatBits(arr.byteOffser, number);
      }

      resultElement.innerHTML += '<div class="bits">' + formatBits (arr, exponentBits) + '</div>';

      // bits description
      // the sign bit
      var fpSign;
      var description = 'The sign bit <span class="fp-bit fp-sign">' +
        arr[0] + '</span>: the number is ';

      if (arr[0] === 0) {
        description += '<b>positive</b>.';
        fpSign = '+';
        floatValue = 1;
      }
      else {
        description += '<b>negative</b>.';
        fpSign = '-';
        floatValue = -1;
      }

      resultElement.innerHTML += '<p>' + description + '</p>';

      // exponent description
      var expValue = '';

      description = 'The exponent stored as <span class="fp-bit fp-exp">';

      for (i = 1; i <= exponentBits; i++) {
        expValue += arr[i];
      }

      description += expValue + '</span> = ';

      expValue = parseInt(expValue, 2); // convert to decimal
      description += '<b>' + expValue + '</b> and the real value is ' +
        expValue + ' - ' + exponentBias + ' = <b>' + (expValue - exponentBias) + '</b>. ' +
        'So the exponent is <b>2<sup>' + (expValue - exponentBias) + '</sup></b>.';

      resultElement.innerHTML += '<p>' + description + '</p>';

      // fraction description
      var fraction = '',
        fValue = 0;

      description = 'The fraction stored as <span class="fp-bit fp-fraction">';

      for (i = exponentBits + 1; i < BITS; i++) {
        fraction += arr[i];
        fValue += arr[i] * Math.pow(2, 8 - i);
      }

      description += fraction + '</span> = ' + fValue +
        '. The 1 is not stored but asumed, so the fraction is 1 + ' + fValue +
        ' = <b>' + (1 + fValue) + '</b>.';

      resultElement.innerHTML += '<p>' + description + '</p>';

      // So
      floatValue *= (1 + fValue) * Math.pow(2, (expValue - exponentBias));

      resultElement.innerHTML += '<p>The number <b>' + number +
        '</b> is represented as <b>' + fpSign + (1 + fValue) + '&times;2<sup>' +
        (expValue - exponentBias) + '</sup> = <b>' + floatValue + '</b></p > ';

      resultElement.innerHTML += '<p>The javascript representation is 64-bits <b>' +
        number.toFixed(BITS) + '</b>.</p>';

    })
    .catch(console.error);

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
