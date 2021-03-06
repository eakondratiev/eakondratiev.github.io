﻿/*
 * The site menu functions.
 * 
 * 2020-12-26
 */

(function () {

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