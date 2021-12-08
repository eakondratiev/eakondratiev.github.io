/*
 * The site menu functions.
 * 
 * 2020-12-26
 * 2021-12-05 browser compatibility tests added.
 * 2021-12-08 The T library added, T.setExample(), T.getNumber().
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

      window.history.pushState(page, 'Title', 
        '/' + page + '?' + urlParamName + '=' + encodeURIComponent(text));
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

}(window.T = window.T || {}));
