﻿/*
 * File: speed.js 
 * 2019-07-03
 * 
 */
function Speed () {

  var velocityValueElement = document.getElementById('velocity-value'),
    velocityUnitElements = document.getElementsByName('velocity-unit'),
    otherUnitsElement = document.getElementById('other-units'),
    units;

  velocityValueElement.onchange = velocityChanged;
  velocityValueElement.onkeyup = velocityChanged;

  units = getUnits();
  console.log({ units });

  otherUnitsElement.innerHTML = '<i>todo</i>';

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
      unitName = reSpaces.replace(unitName, ''); // remove spaces and new lines

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

    var i,
      k,
      overPosition;

    for (i = 0; i < velocityUnitElements.length; i++) {

      if (velocityUnitElements[i].checked) {

        k = velocityUnitElements[i].dataset.k;
        overPosition = k.indexOf('/');

        if (overPosition >= 0) {
          // k in the form of a/b
          k = parseFloat(k.substring(0, overPosition)) / parseFloat(k.substring(overPosition + 1));
        }
        else {
          k = parseFloat(k);
        }

        return {
          name: velocityUnitElements[i].value,
          k: k
        }
      }

    }

    return null;
  }

  /**
   * Shows the speed in other units in the element.
   * @param {Number} speed The speed in m/s.
   */
  function showOtherUnits(speed) {

    var i;

    otherUnitsElement.innerHTML = speed.toString() + ' m/s';

  }
}
