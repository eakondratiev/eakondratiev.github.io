/*
 * Floating-point representation,
 * used WASM code.
 * 
 * ref: https://docs.microsoft.com/en-us/cpp/build/ieee-floating-point-representation?view=msvc-170
 * 
 * 2021-12-06
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name fprep.min.js
// ==/ClosureCompiler==
/**
 * Processes the floating point number and shows its representation.
 */
function processFloatingPointValue(inputElement, resultElement) {

  var inputText = inputElement.value;
  var number = parseFloat(inputText);

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

      const BITS = 32;
      var instance = results.instance;
      var i;
      var floatValue;
      var bitsString = '';

      const { memory, getFloatBits } = instance.exports;
      const arr = new Int32Array(memory.buffer, 0, BITS);

      getFloatBits(arr.byteOffser, number);

      // display bits
      for (i = 0; i < BITS; i++) {

        bitsString += formatBit(arr[i], i);

        // separate octets with a space, so the line could be break down.
        if (i === 7 || i === 15 || i === 23 || i === 31) {
          bitsString += ' ';
        }


      }

      resultElement.innerHTML = '<h2>32-bit representation</h2>' +
        '<div class="bits">' + bitsString + '</div>';

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

      for (i = 1; i <= 8; i++) {
        expValue += arr[i];
      }

      description += expValue + '</span> = ';

      expValue = parseInt(expValue, 2); // convert to decimal
      description += '<b>' + expValue + '</b> and the real value is ' +
        expValue + ' - 127 = <b>' + (expValue - 127) + '</b>. ' +
        'So the exponent is <b>2<sup>' + (expValue - 127) + '</sup></b>.';

      resultElement.innerHTML += '<p>' + description + '</p>';

      // fraction description
      var fraction = '',
        fValue = 0;

      description = 'The fraction stored as <span class="fp-bit fp-fraction">';

      for (i = 9; i < BITS; i++) {
        fraction += arr[i];
        fValue += arr[i] * Math.pow(2, 8 - i);
      }

      description += fraction + '</span> = ' + fValue +
        '. The 1 is not stored but asumed, so the fraction is 1 + ' + fValue +
        ' = <b>' + (1 + fValue) + '</b>.';

      resultElement.innerHTML += '<p>' + description + '</p>';

      // So
      floatValue *= (1 + fValue) * Math.pow(2, (expValue - 127));

      resultElement.innerHTML += '<p>The number <b>' + number +
        '</b> is represented as <b>' + fpSign + (1 + fValue) + '&times;2<sup>' +
        (expValue - 127) + '</sup> = <b>' + floatValue + '</b></p > ';

      resultElement.innerHTML += '<p>The javascript representation is <b>' +
        number.toFixed(BITS) + '</b>.</p>';

    })
    .catch(console.error);

  /**
   * Returns formatted bit.
   * @param {number} value the bit value.
   * @param {number} index the bit index in array.
   */
  function formatBit(value, index) {

    var css;

    if (index === 0) {
      css = 'fp-sign';
    }
    else if (index <= 8) {
      css = 'fp-exp';
    }
    else {
      css = 'fp-fraction';
    }

    return '<span class="fp-bit ' + css + '">' + value + '</span>';
  }

}
