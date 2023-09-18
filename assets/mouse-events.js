/*
 * Javascript code for the mouse-events.htm page.
 *
 * 2023-09-05
 * 2023-09-12 a call to console.log removed
 * 2023-09-18 handle right-button clicks
 */

/**
 * Initialization, event handlers and all functions.
 * @param {*} options
 */

function mouseEvents(options) {

  'use strict';

  const DEFAULT_DBLCLK_THRESHOLD = 100;

  var mouseField = document.getElementById('mouse-event-field');
  var output = document.getElementById('mouse-events-registered');
  var statisticsContainer = document.getElementById('mouse-events-stat');
  var btnReset = document.getElementById('btn-reset');
  var cbOnlyClicks = document.getElementById('settings-only-clicks');
  var inputDblClThreshold = document.getElementById('settings-dblclck-threshold');
  var eventTimes = {};
  var settings = {
    onlyClicks: true,
    clickThreshold: DEFAULT_DBLCLK_THRESHOLD}; // ms

  // show settings and texts
  cbOnlyClicks.checked = settings.onlyClicks;
  inputDblClThreshold.value = settings.clickThreshold;
  updateMouseFieldText ();
      
  // the tool events
  // reset
  btnReset.addEventListener ('click', function(){
    output.innerHTML = '';
    statisticsContainer.innerHTML = '';
  });

  // settings
  cbOnlyClicks.addEventListener('change', function(e){
    settings.onlyClicks = cbOnlyClicks.checked;
    updateMouseFieldText ();
  });

  inputDblClThreshold.addEventListener('keyup', function(e){

    let value = parseInt (inputDblClThreshold.value, 10);

    if (isNaN (value) ||
        value < 1 || value > 9999) {
      settings.clickThreshold = undefined;
    }
    else {
      settings.clickThreshold = value;
    }

  });

  // Monitored events
  mouseField.addEventListener ('click', function(e){
    printMouseEvent (e, 'Click', {threshold: settings.clickThreshold});
  });

  mouseField.addEventListener ('contextmenu', function(e){
    e.preventDefault();
    printMouseEvent (e, 'Right-click', {threshold: settings.clickThreshold});
    return false;
  });

  mouseField.addEventListener ('mouseenter', function(e){
    statCount (e, 'Mouse enter', {x: e.x, y:e.y});
  });
  mouseField.addEventListener ('mouseleave', function(e){
    statCount (e, 'Mouse leave', {x: e.x, y:e.y});
  });
  mouseField.addEventListener ('mousemove', function(e){
    statCount (e, 'Mouse move', {x: e.x, y:e.y});
  });

  mouseField.addEventListener ('mousedown', function(e){ printMouseEvent (e, 'Mouse down'); });
  mouseField.addEventListener ('mouseup', function(e){ printMouseEvent (e, 'Mouse up'); });
  mouseField.addEventListener ('dblclick', function(e){ printMouseEvent (e, 'Double click'); });
  mouseField.addEventListener ('wheel', function(e){ printMouseEvent (e, 'Wheel'); });

  mouseField.addEventListener ('touchstart', function(e){ printMouseEvent (e, 'Touch start'); });
  mouseField.addEventListener ('touchend', function(e){ printMouseEvent (e, 'Touch end'); });
  mouseField.addEventListener ('touchcancel', function(e){ printMouseEvent (e, 'Touch cancel'); });
  mouseField.addEventListener ('touchmove', function(e){ printMouseEvent (e, 'Touch move'); });

  mouseField.addEventListener ('drag', function(e){ printMouseEvent (e, 'Drag'); });
  mouseField.addEventListener ('dragend', function(e){ printMouseEvent (e, 'Drag end'); });
  mouseField.addEventListener ('dragenter', function(e){
    e.stopPropagation();
    e.preventDefault();
    printMouseEvent (e, 'Drag enter');
  });
  mouseField.addEventListener ('dragleave', function(e){
    e.stopPropagation();
    e.preventDefault();
    printMouseEvent (e, 'Drag leave');
  });
  mouseField.addEventListener ('dragover', function(e){
    e.stopPropagation();
    e.preventDefault();
    printMouseEvent (e, 'Drag over');
  });
  mouseField.addEventListener ('dragstart', function(e){ printMouseEvent (e, 'Drag start'); });
  mouseField.addEventListener ('drop', function(e){
    e.stopPropagation();
    e.preventDefault();
    printMouseEvent (e, 'Drop');
  });


  /**
    * Outputs the mouse event
    * 
    */
  function printMouseEvent(e, eventName, options) {

    var keys = [];
    var pointerType = '';
    var coordinates = '';
    var wheelData = '';
    var filesData = '';
    var doubleClickDetected = false;
    var css = '';

    options = options || {};

    if (settings.onlyClicks && e.type !== 'click' &&
        settings.onlyClicks && e.type !== 'contextmenu') {
      return; // skip other events if the checkbox set
    }

    if (e.pointerType !== undefined) {
      pointerType = `, <span>pointer type: ${e.pointerType}</span>`;
    }

    // coordinates
    if (e.x !== undefined && e.y !== undefined) {
      coordinates = `, <span>x: ${e.x}, y: ${e.y}</span>`;
    }

    // keys
    if (e.altKey) { keys.push('alt'); }
    if (e.ctrlKey) { keys.push('ctrl'); }
    if (e.shiftKey) { keys.push('shift'); }
    if (e.metaKey) { keys.push('meta'); }

    if (keys.length > 0) {
      keys = ', <span>keys: ' + keys.join(', ') + '</span>';
    }

    // wheel
    if (e.type === 'wheel') {
      wheelData = `, <span>wheel delta ${e.wheelDelta}</span>, ` +
                  `<span>delta x: ${e.wheelDeltaX}</span>, ` +
                  `<span>delta y: ${e.wheelDeltaY}</span>`;
    }

    // files
    if (e.dataTransfer !== undefined &&
        e.dataTransfer.files.length > 0) {
      filesData = `, <span>file(s): ${e.dataTransfer.files.length}</span> ${e.dataTransfer.files[0].name}`;
    }

    // threshold
    if (options.threshold !== undefined &&
        eventTimes[e.type] !== undefined &&
        e.timeStamp - eventTimes[e.type] < options.threshold) {
      // check the previouse event time
      doubleClickDetected = true;
      css = 'event-warning';
    }

    eventTimes[e.type] = e.timeStamp;

    statCount (e, eventName, {doubleClickDetected: doubleClickDetected});
    prependLine (`${eventName}. <span>Time stamp: ${e.timeStamp.toFixed(3)} ms</span>` +
      `${coordinates}` +
      `${pointerType}${wheelData}${filesData}` +
      `${keys}.`, css);

  }

  /**
    * Shows the event counter.
    */
  function statCount (e, eventName, options) {

    let className = `event-stat-${e.type}`;
    let statBlock = statisticsContainer.getElementsByClassName (className);
    let block;

    options = options || {};

    // double click detected
    let doubleClickDetected = (options.doubleClickDetected !== undefined &&
                                options.doubleClickDetected);

    if (statBlock.length === 0) {
      // add new block
      block = document.createElement('div');
      block.className = className;
      block.innerHTML = `${eventName}: <b>1</b>`;
      block.dataset.value = 1;
          
      statisticsContainer.append (block);
    }
    else {
      // update existing block counter
      block = statBlock[0];
      let newValue = parseInt (block.dataset.value, 10) + 1;
      block.dataset.value = newValue;
      block.getElementsByTagName ('b')[0].innerHTML = newValue;
    }

    // double click detected
    if (doubleClickDetected) {
        let valueBlocks = block.getElementsByTagName ('b');

        if (valueBlocks.length === 1) {
          // new counter
          block.dataset.dblClicks = 1;
          block.innerHTML += `, double click(s): <b class="dblclck-counter">1</b>`;
        }
        else if (valueBlocks.length > 1) {
          // the counter exists
          let value = parseInt (block.dataset.dblClicks, 10) + 1;
          block.dataset.dblClicks = value;
          block.getElementsByTagName ('b')[1].innerHTML = value;
        }

      }

      // coordinates
      if (options.x !== undefined && options.y !== undefined) {

        let xElements = block.getElementsByClassName ('stat-coord-x');
        let yElements = block.getElementsByClassName ('stat-coord-y');

        if (xElements.length === 0) {
          block.innerHTML += `, x: <span class="stat-coord-x">${options.x}</span>`;
        }
        else {
          xElements[0].innerHTML = options.x;
        }

        if (yElements.length === 0) {
          block.innerHTML += `, y: <span class="stat-coord-y">${options.y}</span>`;
        }
        else {
          yElements[0].innerHTML = options.y;
        }

      }

  }

  function updateMouseFieldText () {

    if (settings.onlyClicks) {
      mouseField.innerHTML = 'Click or tap <b>here</b>';
    }
    else {
      mouseField.innerHTML = 'Click, touch or drag and drop a file <b>here</b>';
    }

  }

  /**
    * Prepends the text in the output element.
    */
  function prependLine(text, css) {

    var cls = '';

    if (css !== undefined && css !== '') {
      cls = ` class="${css}"`;
    }

    output.innerHTML = `<div${cls}>${text}</div>` + output.innerHTML;
  }

}