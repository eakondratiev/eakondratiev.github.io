/*
 * File: speed.js 
 * 2019-07-03
 * 
 */
function Speed () {

  var SPEED_OF_LIGHT = 299792458, // m/s
    velocityValueElement = document.getElementById('speed-value'),
    velocityUnitElements = document.getElementsByName('speed-unit'),
    otherUnitsElement = document.getElementById('other-units'),
    units,
    messages = [
      'Enter a numeric value, please.',
      'No move at all.',
      'Negative speed! Please stop it.',
      'All units be advised, a suspect speeding down the virtual area.'
    ];

  velocityValueElement.onchange = velocityChanged;
  velocityValueElement.onkeyup = velocityChanged;

  units = getUnits();

  velocityValueElement.focus();

  /**
   * Update calculations
   */
  function velocityChanged() {

    var vTxt,
      vNumber,
      unitData,
      velocity;

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

    console.log({ vTxt, vNumber });
    console.log(unitData);

    velocity = vNumber * unitData.k; // m/s

    console.log('Speed: ' + velocity.toString() + ' m/s.');

    showOtherUnits(velocity);
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
   */
  function showOtherUnits(speed) {

    var i,
      unit,
      text = '',
      unitSpeed;

    if (!isValid(speed)) {
      // Not valid, a message is shown.
      return;
    }

    for (i = 0; i < velocityUnitElements.length; i++) {

      if (!velocityUnitElements[i].checked) {

        // Get the unit by the key
        unit = units[velocityUnitElements[i].value];

        unitSpeed = speed / unit.k;
        text += ' <b>' + formatNumber (unitSpeed) + '</b> ' + unit.name;

      }

    }

    otherUnitsElement.innerHTML = text;

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

    return v.toFixed(2);

  }

}
