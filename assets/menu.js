/*
 * The site menu functions.
 * 
 * 2020-12-26
 * 2021-12-05 browser compatibility tests added.
 * 2021-12-08 The T library added, T.setExample(), T.getNumber().
 * 2021-12-09 T.getUrlParameters() added.
 * 2021-12-18 T.formatNumber() added.
 * 2022-02-05 The TOP_MENU structure and menu initializetion added.
 * 2022-03-02 T.Db constructor added.
 * 2022-02-11 Keyboard support for the site menu, handles click outside of the menu.
 * 2022-05-10 T.MessageLevel enum and T.Message class added.
 * 2022-06-22 The Install App button added.
 * 2022-06-25 T.log() added.
 * 2022-07-30 conditionnal logging.
 * 2022-08-11 menu keyboard handling corrections.
 * 2022-08-17 file.htm added to menu
 * 2022-09-17 errors handling corrections.
 * 2023-09-12 the Mouse Events Tracker page added to the menu.
 * 2024-06-17 rename the link from White Spaces to Character Code Detector.
 * 2025-03-22 sha256.htm added to menu
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name menu.min.js
// ==/ClosureCompiler==
(function () {

  'use strict';

  var TOP_MENU = [
    {
      header: 'Online Tools',
      items: [
        {url: 'file.htm', name: 'File Type by Content'},
        {url: 'sha256.htm', name: 'File SHA-256 Checksum'},
        {url: 'mouse-events.htm', name: 'Mouse Events Tracker'},
        {url: 'iprange.htm', name: 'IPv4 Ranges'},
        {url: 'regex.htm', name: 'Test Regular Expressions'},
        {url: 'roman-numerals.htm', name: 'Roman Numerals Converter'},
        {url: 'floating-point-representation.htm', name: 'Floating-point Formats'},
        {url: 'floating-point-summation.htm',      name: 'Floating-point Summation'},
        {url: 'speed.htm',   name: 'Speed &amp; Distance'},
        {url: 'ws.htm',      name: 'Character Code Detector'}
      ]},
    {
      header: 'Console Tools',
      items: [
        {url: 'crd-reader.htm', name: 'CRD Reader'}
      ]}
    ];

  var selectedItem = 0,
    itemElements = [],
    menu = {};

  // check for compatibility
  if (document.getElementsByClassName === undefined ||
    window.addEventListener === undefined ||
    window.getComputedStyle === undefined) {

    // just return without any message: the menu without style still works.
    return;

  }

  // initialize
  window.onload = function (event) {

    var menuBtn = document.getElementsByClassName('site-menu-btn')[0];

    menuBtn.setAttribute ('title', 'Open the site menu, Ctrl+M');

    menu = document.getElementsByClassName('site-nav')[0];

    // Initialize menu items
    (function(m, c){

      var block, item, i, j,
        html = '';

      for (i = 0; i < m.length; i++) {

        block = m[i];

        if (block.header !== undefined) {
          html += '<h3 class="site-nav-header">' + block.header + '</h3>';
        }

        html += '<ul>';

        for (j = 0; j < block.items.length; j++) {

          item = block.items[j];
          html += '<li class="site-nav-top-item"><a href="' + item.url + '">' + item.name + '</a></li>';

        }

        html += '</ul>';

      }

      // the Install App button
      html += '<div class="install-app-block" style="display:none;">' +
        '<button type="button">Install App</button>' +
        '</div>';

      c.innerHTML = html;

      itemElements = document.getElementsByClassName ('site-nav-top-item');

    })(TOP_MENU, menu);

    // Handles clicks on the burger-button.
    menuBtn.addEventListener('click', function (e) {
      toggleMenuState ();
      e.stopPropagation(); // prevents hiding menu by click outside function
    });
    
    // Handles keyboard events
    document.addEventListener('keyup', function (e){

      var key = e.key; // also e.which can be used

      if (e.defaultPrevented) {
        return; // Do nothing if the event was already processed
      }

      if (e.ctrlKey && (key === 'm' || key === 'M')) {
        // ctrl+m - show/hide menu.
        toggleMenuState();

        if (isVisible(menu)) {
          focusItem (itemElements [selectedItem]);
        }
      }

      if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
        
        switch (key) {
          
          case 'Escape':

            if (isVisible(menu)) {
              hideMenu ();
            }
            break;

          case 'ArrowUp':
            if (isVisible(menu) && selectedItem >= 0) {
              if (selectedItem > 0) { --selectedItem; }
              focusItem (itemElements [selectedItem]);
            }
            break;

          case 'ArrowDown':
            if (isVisible(menu) && selectedItem < itemElements.length - 1) {
              ++selectedItem;
              focusItem (itemElements [selectedItem]);
            }
            break;
        }

      }

    });

    // Log the page was loaded
    if (typeof _ToolNoLogs === 'undefined' || _ToolNoLogs !== true) {
      T.log ("Page load");
    }

    processBottomMenu ();

    /**
     * Sets the focus on the menu item.
     * @param {any} itemContainer
     */
    function focusItem(itemContainer) {

      itemContainer.getElementsByTagName('a')[0].focus();

    }

  };

  // click outside the menu
  window.addEventListener("click", function(e) {

    if (e.composedPath !== undefined &&
       !e.composedPath().includes(menu)) {

      if (isVisible(menu)) {
        hideMenu();
      }

    }
  });

  /**
   * Returns value indicating whether the element is visible or not.
   * @param {*} element The DOM element.
   */
  function isVisible(element) {
    return (window.getComputedStyle(element).display !== 'none');
  }

  /**
    * Toggles the visibility state of the site menu.
    */
  function toggleMenuState() {

    if (isVisible(menu)) {
      hideMenu ();
    }
    else {
      // show
      menu.style.display = 'block';
    }

  }

  /**
   * Hide the menu and resets the selected item index.
   */
  function hideMenu() {

    // hide
    menu.style.display = 'none';

    // resets selected item
    selectedItem = 0;
  }

  /**
   * Processes the page bottom menu, highlights current page menu item.
   */
  function processBottomMenu () {


    var menu = document.getElementsByClassName('footer-menu');
    var items;
    var i;
    var pageUrl;

    if (menu.length === 0 ||
        window.location === undefined ||
        window.location.pathname === undefined) {
      return;
    }

    pageUrl = window.location.pathname.split('/').pop();
    items = menu[0].getElementsByTagName('a');

    for (i = 0; i < items.length; i++) {
      if (items[i].getAttribute('href') === pageUrl) {
        items[i].classList.add('current');
      }
    }

  }

})();

/**
 * Library functions.
 */
(function(T, undefined){

  'use strict';

  /**
   * Sets the text in the input element and url parameter;
   * @param {DOMElement} elementId the inpuut element identifier.
   * @param {string} text the text of example.
   * @param {string urlParamName the url parameter name.
   */
  T.setExample = function (elementId, text, urlParamName) {

    var element = document.getElementById (elementId);
    var page = location.href.split("/").slice(-1);

    if (element) {

      element.value = text;

      if (window.history.pushState) {
        window.history.pushState(page, 'Title', 
          '/' + page + '?' + urlParamName + '=' + encodeURIComponent(text));
      }
    }

  }

  /**
   * Returns the parsed number.
   * @param {string} text the text.
   * @returns {number}
   */
  T.getNumber = function (text) {

    text = text.replace (',', '.');
    return parseFloat(text); 
  }

  /**
   * Returns object with the url parameters as a key-value pairs.
   * If the url does not contains parameters then an empty object is returned.
   * If the url parameter has no value then the value is null.
   * If the url contain several parameters with the same name then the value is array of values;
   * @returns {*}
   */
  T.getUrlParameters = function () {

    var reQs = /.*\?([^#]*)(#.*)?/gi;
    var qs = (window.location.href).replace (reQs, '$1');
    var rawParameters = qs.split('&');
    var i;
    var p;
    var paramName;
    var value;
    var params = {};

    if (!reQs.test(window.location.href)) {
      // No url parameters
      return {};
    }

    for (i = 0; i < rawParameters.length; i++) {

      value = undefined;
      p = rawParameters[i].split('=');

      if (p.length === 2) {
        value = p[1];
      }
      else if (p.length === 1) {
        value = null;
      }

      paramName = p[0];

      if (value !== undefined &&
          paramName !== '') {

        if (params.hasOwnProperty(paramName)) {
          params[paramName] = [params[paramName]];
          params[paramName].push(value);
        }
        else {
          params[p[0]] = value;
        }
      }

    }

    return params;

  }

  /**
   * Returns localized number. See the Intl.NumberFormat() constructor description.
   * If the number.toLocaleString()  or locale or option not supported,
   * then the number.toString() result is returned.
   * @param {number} n The number.
   * @param {string} locales Optional. A string with a BCP 47 language tag, or an array of such strings. 
   * @param {*} options Optional. An object with some or all of the supported properties.
   * @returns {string}
   */
  T.formatNumber = function (n, locales, options) {

    try {
      return n.toLocaleString (locales, options);
    }
    catch (e) {
      console.log ('T.formatNumber', e);
      return n.toString();
    }

  }

  /**
    * @constructor
    */
  T.Db = function () {

    var KEY_PREFIX = 'tool-site-';

    return {
      set: function(key, value) {
        localStorage.setItem (KEY_PREFIX + key, value)
      },

      get: function(key) {
        return localStorage.getItem (KEY_PREFIX + key);
      },

      remove: function (key) {
        return localStorage.removeItem (KEY_PREFIX + key);
      }

    }

  };

  /**
   * A message level: informational, warning, error.
   */
  T.MessageLevel = {
    INFO:    'page-message--info',
    WARNING: 'page-message--warning',
    ERROR:   'page-message--error'
  };

  /**
   * @constructor
   * Shows and hides messages using the message element.
   * @param {any} options the options.
   * @param {DOMElement} options.element the message element.
   */
  T.Message = function (options) {

    var messageElement = options.element;

    return {

      show: function (text, cssClass) {
      
        removeCss();

        if (cssClass !== undefined) {
          messageElement.classList.add (cssClass);
        }

        messageElement.innerHTML = text;
        messageElement.style.display = 'block';

      },

      hide: function () {
        removeCss();
        messageElement.innerHTML = '';
        messageElement.style.display = 'none';
      }

    };

    /** Remove CSS classes from the message element. */
    function removeCss() {
      messageElement.classList.remove ('page-message--info', 'page-message--warning', 'page-message--error');
    }

  };

  /**
   * Logs the event using external web-service.
   * @param {string} eventName the event name.
   */
  T.log = function (eventName){

    var url = 'https://kleit.ru/tool/?';

    // check used functions
    if (window.fetch === undefined) {
      return;
    }

    // 1. collect
    var data = [
      'e=' + eventName,
      'p=' + encodeURIComponent (window.location.pathname),
      'q=' + encodeURIComponent (window.location.search)];

    if (document.referrer !== '') {
      data.push('r=' + encodeURIComponent (document.referrer));
    }

    // 2. send
    fetch(url + data.join('&'), {method:'GET'})
      .then(function (response) {
        if (!response.ok) { console.log ('HTTP error. Status: ' + response.status); }
          return response.text();
        }
      )
      .then(function (text) { 
        //console.log ('GOT ' + text);
      })
      .catch(function(err) {
        //console.error (err);
      });

  }

}(window.T = window.T || {}));

