/*
 * Code for the battery status page.
 * 2026-11-23
 */

/**
 * Initialization, event handlers and other functions.
 * @param {*} options
 * @param {*} texts
 */
function batteryPage(options, texts) {

  'use strict';

  var GRADIENT = [
    { v: 0, rgb: [195, 0, 0] },
    { v: 0.15, rgb: [240, 170, 0] },
    { v: 0.25, rgb: [30, 128, 0] },
    { v: 1, rgb: [30, 128, 0] }
  ];

  var statusTextElement = document.getElementById(options.textElement);
  var statusWidgetElement = document.getElementById(options.widgetElement);


  getBatteryData().then(data => {

    var text = '';

    if (data.errCode) {
      // errors handling
      switch (data.errCode) {
        case 1:
          text = 'Your browser doesn\'t provide the Battery Status API.';
          break;
        case 2:
          text = 'Sorry, an error occurred on this page.';
          break;
      }
    }
    else {
      if (data.level) {
        text = `<div>Level <b>${(data.level * 100).toFixed(0)}%</b></div>` +
          `<div><b>${data.charging ? 'Charging' : 'Not charging'}</b></div>` +
          `<div>Charging Time: <b>${formatDuration(data.chargingTime)}</b></div>` +
          `<div>Estimated Time to Discharge: <b>${formatDuration(data.dischargingTime)}</b></div>`;
      }
    }

    statusTextElement.innerHTML = text;

  });

  /**
   * Returs the battery status.
   * On error the return value contains the errCode parameter.
   */
  async function getBatteryData() {

    const DEFAULT = {
      level: null,
      charging: 'n/a',
      chargingTime: 'n/a',
      dischargingTime: 'n/a'
    };

    if (!navigator.getBattery ||
      typeof navigator.getBattery !== 'function') {
      DEFAULT.errCode = 1;
      return DEFAULT;
    }

    try {
      const battery = await navigator.getBattery();

      return {
        level: Number.isFinite(battery.level)
          ? battery.level : null,
        charging: battery.charging,
        chargingTime:
          Number.isFinite(battery.chargingTime)
            ? battery.chargingTime
            : 'n/a',
        dischargingTime:
          Number.isFinite(battery.dischargingTime)
            ? battery.dischargingTime
            : 'n/a'
      };
    } catch {
      DEFAULT.errCode = 2;
      return DEFAULT;
    }
  }

  /**
   * Returns formatted duration from seconds.
   */
  function formatDuration(totalSeconds) {
    if (
      typeof totalSeconds !== "number" ||
      !Number.isFinite(totalSeconds) ||
      totalSeconds < 0
    ) {
      return 'n/a';
    }

    totalSeconds = Math.floor(totalSeconds);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const dayLabel = days === 1 ? "day" : "days";

    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    }

    return `${days} ${dayLabel} ` +
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

  }

}