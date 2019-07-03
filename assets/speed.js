/*
 * File: speed.js 
 * 2019-07-03
 * 
 */
function Speed () {

  var SPEED_OF_LIGHT = 299792458, // m/s
    SECONDS_PER_DAY = 3600 * 24,
    SECONDS_PER_YEAR = SECONDS_PER_DAY * 365,
    velocityValueElement = document.getElementById('speed-value'),
    velocityUnitElements = document.getElementsByName('speed-unit'),
    otherUnitsElement = document.getElementById('other-units'),
    comparisonElement = document.getElementById('comparison'),
    units,
    messages = [
      'Enter a numeric value, please.',
      'No move at all.',
      'Negative speed! Please stop it.',
      'All units be advised, a suspect speeding down the virtual area.'
    ],
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
        distance: 1.496e11}
    ];

  velocityValueElement.onchange = velocityChanged;
  velocityValueElement.onkeyup = velocityChanged;

  // Radio buttons change event
  (function () {
    var i;

    for (i = 0; i < velocityUnitElements.length; i++) {
      velocityUnitElements[i].onchange = velocityChanged;
    }

  })();

  units = getUnits();

  velocityValueElement.focus();

  /**
   * Update calculations
   */
  function velocityChanged() {

    var vTxt,
      vNumber,
      unitData,
      speed;

    if (velocityValueElement === null) {
      console.log('Value element is null;')
      return;
    }

    vTxt = velocityValueElement.value.replace(',', '.');
    vNumber = parseFloat(vTxt);
    unitData = getUnitData();

    if (unitData === null) {
      console.log('Unit not selected');
      return;
    }

    speed = vNumber * unitData.k; // m/s

    if (showOtherUnits(speed)) {
      // Show comparison texts if the speed is valid.
      showComparison(speed);
    }

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

    for (i = 0; i < velocityUnitElements.length; i++) {

      k = velocityUnitElements[i].dataset.k;
      overPosition = k.indexOf('/');

      if (overPosition >= 0) {
        // k in the form of a/b
        k = parseFloat(k.substring(0, overPosition)) / parseFloat(k.substring(overPosition + 1));
      }
      else {
        k = parseFloat(k);
      }

      unitName = velocityUnitElements[i].parentNode.textContent;
      unitName = unitName.replace(reSpaces, ''); // remove spaces and new lines

      units[velocityUnitElements[i].value] = {
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

    for (i = 0; i < velocityUnitElements.length; i++) {

      if (velocityUnitElements[i].checked) {

        // Get the unit by the key
        return units[velocityUnitElements[i].value];

      }

    }

    return null;
  }

  /**
   * Shows the speed in other units in the element.
   * @param {Number} speed The speed in m/s.
   * @returns {Boolean} The value indicating whether the speed is valid or not;
   */
  function showOtherUnits(speed) {

    var i,
      unit,
      text = '',
      unitSpeed;

    if (!isValid(speed)) {
      // Not valid, a message is shown.
      return false;
    }

    for (i = 0; i < velocityUnitElements.length; i++) {

      if (!velocityUnitElements[i].checked) {

        // Get the unit by the key
        unit = units[velocityUnitElements[i].value];

        unitSpeed = speed / unit.k;

        if (unitSpeed > 0.1) {
          text += ' <b>' + formatNumber(unitSpeed) + '</b> ' + unit.name;
        }

      }

    }

    otherUnitsElement.innerHTML = text;
    return true;

  }

/**
 * Shows the time for making the distances in the element.
 * @param {Number} speed The speed in m/s.
 */
  function showComparison(speed) {

    var i,
      seconds,
      text = '';

    console.log({ speed, distances });
    for (i = 0; i < distances.length; i++) {

      seconds = distances[i].distance / speed; // s 
      text += '<p class="comparisonText">' + distances[i].name +
        ': <span>' + formatTime (seconds) +
        '</span></p>';
    }

    comparisonElement.innerHTML = text;
  }

  /**
   * Returns the value indicating whether the speed is value or not
   * and show the message.
   * @param {Number} speed The speed in m/s
   * @returns {Boolean} Is the speed valid or not.
   */
  function isValid(speed) {

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

    return true;

  }

  /**
   * Returns the formatted numeric value.
   * @param {Number} v The value.
   * @returns {String} The formatted value.
   */
  function formatNumber(v) {

    var absv;

    if (isNaN(v)) {
      return '---';
    }

    absv = Math.abs(v);

    if (absv < 1e-4 || absv >= 1e7) {
      return v.toExponential(3);
    }

    return v.toFixed(2).replace (/(\.00|0)$/, '');

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
      return (seconds /SECONDS_PER_YEAR).toFixed (1) + ' years'
    }

    if (seconds > SECONDS_PER_DAY) {
      // Days
      return (seconds /SECONDS_PER_DAY).toFixed (2) + ' days'
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

}
