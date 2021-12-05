/*
 * The site menu functions.
 * 
 * 2020-12-26
 * 2021-12-05 browser compatibility tests added.
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name menu.min.js
// ==/ClosureCompiler==
(function () {

  // initialize
  window.onload = function (event) {

    // check for compatibility
    if (document.getElementsByClassName === undefined ||
        window.addEventListener === undefined ||
        window.getComputedStyle === undefined) {

      document.getElementById('incompatible-browser').style.display = 'block';
      return;

    }

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