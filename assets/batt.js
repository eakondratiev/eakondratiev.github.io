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
  var widgetPercentElement = document.getElementById(options.widgetPercentElement);
  var widgetBatteryElement = document.getElementById(options.widgetBatteryElement);


  getBatteryData().then(data => {

    var text = '';

    widgetPercentElement.textContent = '';
    widgetBatteryElement.textContent = '';

    if (data.errCode) {
      // errors handling
      switch (data.errCode) {
        case 1:
          text = texts.errNotSupported;
          break;
        case 2:
          text = texts.error;
          break;
      }
    }
    else {
      if (data.level) {

        let color = getColor(GRADIENT, data.level);

        text = `<div>Charging Time: <b>${formatDuration(data.chargingTime)}</b></div>` +
          `<div>Estimated Time to Discharge: <b>${formatDuration(data.dischargingTime)}</b></div>`;

        widgetPercentElement.textContent = `${(data.level * 100).toFixed(0)}% ${data.charging ? ', charging' : ''}`;

        widgetBatteryElement.innerHTML = `<div class="batt-widget-wrap" style="border-color: ${color};">` +
          `<b style="width: ${(data.level * 100).toFixed(0)}%; background-color: ${color};"></b>` +
          `</div>`
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

    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    }

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let daysText;

    switch (days) {
      case 0:
        daysText = '';
        break;
      case 1:
        daysText = '1 day ';
        break;
      default:
        daysText = `${days} days `;
    }

    return `${daysText}` +
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

  }

  /**
   * Returns rgb() string with the color specific to the percent in the gradient data.
   * @param {[*]} gradient array of stop values like { v: 0,   rgb: [255, 0, 0] }
   * @param {number} percent the percent value from 0.0 to 1.0
   * @return {string} rgb(...) string
   */
  function getColor(gradient, percent) {
    // Sort by position in case the stops aren't in order
    const stops = [...gradient].sort((a, b) => a.v - b.v);

    // Clamp to the first and last stop
    if (percent <= stops[0].v) return `rgb(${stops[0].rgb.join(", ")})`;
    const last = stops[stops.length - 1];
    if (percent >= last.v) return `rgb(${last.rgb.join(", ")})`;

    // Find the two stops that surround the percentage
    let i = 0;
    while (percent > stops[i + 1].v) i++;
    const from = stops[i];
    const to = stops[i + 1];

    // Position between the two stops, from 0 to 1
    const t = (percent - from.v) / (to.v - from.v);

    // Interpolate each channel and round to whole numbers
    const [r, g, b] = from.rgb.map((c, idx) => Math.round(c + (to.rgb[idx] - c) * t));

    return `rgb(${r}, ${g}, ${b})`;
  }


}