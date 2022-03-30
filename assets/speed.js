/*
 * File: speed.js 
 * 2019-07-03...04
 * 2020-12-26 * percent of the speed of light added to results;
 *            * the options parameter added to the formatNumber().
 * 2020-12-27 * 
 * 2021-12-05 * browser compatibility check; the .dataset replaced with .getAttribute().
 * 2021-03-30 * messages are passed via options, set css classes to the message element.
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name speed.min.js
// ==/ClosureCompiler==
/**
 * Processes the form.
 * @param {any} options the options.
 * @param {[string]} options.msg the messages.
 */
function Speed(options) {

  if (document.getElementsByName === undefined) {

    document.getElementById('incompatible-browser').style.display = 'block';
    return;
  }

  var SPEED_OF_LIGHT = 299792458, // m/s
    SECONDS_PER_DAY = 3600 * 24,
    SECONDS_PER_YEAR = SECONDS_PER_DAY * 365,
    speedValueElement = document.getElementById('speed-value'),
    speedUnitElements = document.getElementsByName('speed-unit'),
    otherUnitsElement = document.getElementById('other-units'),
    comparisonElement = document.getElementById('comparison'),
    units,
    messages = options.msg,
    distances = [
      { name: 'From Chicago to LA',
        distance: 2.808e6 }, // meters
      { name: 'From London to New York',
        distance: 5.585e6 },
      { name: 'Earth diameter',
        distance: 12.742e6},
      { name: 'Sun diameter',
        distance: 1.391e9},
      { name: 'From Sun to Earth',
        distance: 1.496e11},
      { name: 'Milky Way galaxy diameter',
        distance: 1.85e21}
    ];

  speedValueElement.onchange = calculateSpeed;
  speedValueElement.onkeyup = calculateSpeed;

  // Radio buttons change event
  (function () {
    var i;

    for (i = 0; i < speedUnitElements.length; i++) {
      speedUnitElements[i].onchange = calculateSpeed;
    }

  })();

  units = getUnits();

  speedValueElement.focus();

  // Process url parameters
  (function () {
    var v = getUrlParameter('v'),
      unit = getUrlParameter('unit'),
      i;

    if (v === null || unit === null) {
      return;
    }

    speedValueElement.value = v;

    for(i = 0; i < speedUnitElements.length; i++) {

      if (speedUnitElements[i].value === unit) {
        speedUnitElements[i].checked = true;
      }
    }
  })();

  calculateSpeed();

  /**
   * Update calculations
   */
  function calculateSpeed() {

    var vTxt,
      vNumber,
      unitData,
      speed;

    comparisonElement.innerHTML = '';

    if (speedValueElement === null) {
      console.log('Value element is null;')
      return;
    }

    vTxt = speedValueElement.value.replace(',', '.');
    vNumber = parseFloat(vTxt);
    unitData = getUnitData();

    if (unitData === null) {
      console.log('Unit not selected');
      return;
    }

    speed = vNumber * unitData.k; // m/s

    if (!isValid(speed)) {
      // Not valid, a message is shown.
      return;
    }

    showOtherUnits(speed);
    showComparison(speed);

  }

  /**
   * Returns the unit list.
   * @returns {*} The associative array of units, the key - a unit code, the value - the unit name, factor etc.
   */
  function getUnits() {

    var i,
      k,
      overPosition,
      units = {},
      reSpaces = /\s+/g,
      unitName;

    for (i = 0; i < speedUnitElements.length; i++) {

      k = speedUnitElements[i].getAttribute('data-k');
      overPosition = k.indexOf('/');

      if (overPosition >= 0) {
        // k in the form of a/b
        k = parseFloat(k.substring(0, overPosition)) / parseFloat(k.substring(overPosition + 1));
      }
      else {
        k = parseFloat(k);
      }

      unitName = speedUnitElements[i].parentNode.textContent;
      unitName = unitName.replace(reSpaces, ''); // remove spaces and new lines

      units[speedUnitElements[i].value] = {
        name: unitName,
        k: k
      };
    }

    return units;
  }

  /**
   * Returns the selected unit properties.
   * @returns {*} The unit properties.
   */
  function getUnitData() {

    var i;

    for (i = 0; i < speedUnitElements.length; i++) {

      if (speedUnitElements[i].checked) {

        // Get the unit by the key
        return units[speedUnitElements[i].value];

      }

    }

    return null;
  }

  /**
   * Shows the speed in other units in the element.
   * @param {Number} speed The speed, m/s.
   */
  function showOtherUnits(speed) {

    var i,
      unit,
      text = '',
      unitSpeed;

    for (i = 0; i < speedUnitElements.length; i++) {

      if (!speedUnitElements[i].checked) {

        // Get the unit by the key
        unit = units[speedUnitElements[i].value];

        unitSpeed = speed / unit.k;

        if (unitSpeed > 0.1) {
          text += getResultUnitBlock(unitSpeed, ' ' + unit.name);
        }

      }

    }

    if (!isNaN(speed)) {

      text += getResultUnitBlock(
        100.0 * speed / SPEED_OF_LIGHT,
        '% the speed of light',
        3);

    }

    otherUnitsElement.innerHTML = text;

  }

  /**
   * Returns html code for the result/unit block.
   * @param {number} value The value.
   * @param {string} unit The unit name. Prepend with the space to separate from the value.
   * @param {number} fractionDigits The fraction digits.
   */
  function getResultUnitBlock(value, unit, fractionDigits) {

    return '<span><b>' +
      formatNumber (value, { fractionDigits: fractionDigits }) +
      '</b>' + unit + '</span> ';
  }

/**
 * Shows the time for making the distances in the element.
 * @param {Number} speed The speed in m/s.
 */
  function showComparison(speed) {

    var i,
      seconds,
      text = '';

    for (i = 0; i < distances.length; i++) {

      seconds = distances[i].distance / speed; // s 
      text += '<p class="comparisonText">' + distances[i].name +
        ': <span>' + formatTime (seconds) +
        '</span></p>';
    }

    comparisonElement.innerHTML =
      '<h2 class="comparison-header">Cover the Distance</h2>' +
      text;
  }

  /**
   * Returns the value indicating whether the speed is value or not
   * and show the message.
   * @param {Number} speed The speed in m/s
   * @returns {Boolean} Is the speed valid or not.
   */
  function isValid(speed) {

    if (speedValueElement.value !== '') {

      styleMessage ();

      if (isNaN (speed)) {
        otherUnitsElement.innerHTML = messages[0];
        return false;
      }

      if (speed > SPEED_OF_LIGHT) {
        otherUnitsElement.innerHTML = messages[3];
        return false;
      }

      if (speed < 0) {
        otherUnitsElement.innerHTML = messages[2];
        return false;
      }

      if (Math.abs(speed) < 1e-10) {
        otherUnitsElement.innerHTML = messages[1]; // zero
        return false;
      }

    }

    resetMessageStyle ();
    return true;

  }

  /** Sets a message css classes for the message element. */
  function styleMessage() {
    if (otherUnitsElement.classList !== undefined) {
      otherUnitsElement.classList.add ('page-message', 'page-message--warning');
    }
  }

  /** Removes a message css classes for the message element. */
  function resetMessageStyle() {
    if (otherUnitsElement.classList !== undefined) {
      otherUnitsElement.classList.remove ('page-message', 'page-message--warning');
    }
  }

  /**
   * Returns the formatted numeric value.
   * @param {number} v The value.
   * @param {*} options The options.
   * @param {number} options.fractionDigits The number of digits after decimal point, optional, default is 2.
   * @returns {String} The formatted value.
   */
  function formatNumber(v, options) {

    var absv,
        fd = 2;

    if (isNaN(v)) {
      return '---';
    }

    absv = Math.abs(v);

    options = options || {};
    if (!isNaN(options.fractionDigits)) {
      fd = options.fractionDigits;
    }

    if (absv < 1e-4 || absv >= 1e7) {
      return v.toExponential(fd);
    }

    return v.toFixed(fd).replace (/(\.00|0)$/, '');

  }

  /**
   * Returns the formatted time value.
   * @param {Number} seconds The time in seconds.
   * @returns {String} The formatted value.
   */
  function formatTime(seconds) {

    var hh, mm, ss, secondsPrecision;

    if (isNaN(seconds)) {
      return '---';
    }

    if (!isFinite(seconds)) {
      return '&infin;';
    }

    if (seconds > SECONDS_PER_YEAR) {
      // Years
      return formatNumber(seconds / SECONDS_PER_YEAR) + ' years';
    }

    if (seconds > SECONDS_PER_DAY) {
      // Days
      return formatNumber(seconds / SECONDS_PER_DAY) + ' days';
    }

    secondsPrecision = secondsPrecision || 0;

    // https://stackoverflow.com/a/6313008
    hh = Math.floor(seconds / 3600);
    mm = Math.floor((seconds - (hh * 3600)) / 60);
    ss = seconds - (hh * 3600) - (mm * 60);

    if (seconds < 60) {
      secondsPrecision = 2;
    }

    ss = ss.toFixed(secondsPrecision);

    if (hh < 10) { hh = "0" + hh; }
    if (mm < 10) { mm = "0" + mm; }
    if (ss < 10) { ss = "0" + ss; }

    return hh + ":" + mm + ":" + ss;
  }

  /**
   * Returns the url parameter value or null.
   * @param {String} parameterName The url parameter name.
   * @returns {String} The value or null.
   * */
  function getUrlParameter(parameterName) {

    try {
      var url = new URL(window.location.href);
      return url.searchParams.get(parameterName);
    }
    catch (error) {
      document.getElementById('incompatible-browser').style.display = 'block';
      return null;
    }

  }

}
