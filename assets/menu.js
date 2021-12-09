/*
 * The site menu functions.
 * 
 * 2020-12-26
 * 2021-12-05 browser compatibility tests added.
 * 2021-12-08 The T library added, T.setExample(), T.getNumber().
 * 2021-12-09 T.getUrlParameters() added.
 * 
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name menu.min.js
// ==/ClosureCompiler==
(function () {

  // check for compatibility
  if (document.getElementsByClassName === undefined ||
    window.addEventListener === undefined ||
    window.getComputedStyle === undefined) {

    // just return without any message: the menu without style still works.
    return;

  }

  // initialize
  window.onload = function (event) {

    var menuBtn = document.getElementsByClassName('site-menu-btn')[0],
      menu = document.getElementsByClassName('site-nav')[0];

    // Handles clicks on the burger-button.
    menuBtn.addEventListener('click', function () {

      if (isVisible(menu)) {
        // hide
        menu.style.display = 'none';
      }
      else {
        // show
        menu.style.display = 'block';
      }

    });
    
  };

  /**
   * Returns value indicating whether the element is visible or not.
   * @param {*} element The DOM element.
   */
  function isVisible(element) {
    return (window.getComputedStyle(element).display !== 'none');
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


}(window.T = window.T || {}));

