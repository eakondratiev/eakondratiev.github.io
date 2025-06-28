/*
  * 2025-04-12
  * 2025-05-21
  * 2025-06-21
  * TODO:
  * - check for Intl...
  * - Accept Terms and Conditions
  * - Notifications
  */
function countdownPage (options){

  'use strict';

  const EN_US_LOCALE = 'en-us';

  const CURRENT_DATE_FMT = { 
    year: 'numeric', 
    month: 'long', 
    day: '2-digit'
  };

  const CURRENT_TIME_FMT = {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit', 
    second: '2-digit', 
    timeZoneName: 'short' // This will include the timezone abbreviation
  };

  let countdownForm = document.getElementById ('countdown-settings-form');
  let currentTimeElement = document.getElementById ('current-time').getElementsByTagName('b')[0];
  let countdownToTimeElement = document.getElementById ('countdown-to-time');
  let countdownToDateElement = document.getElementById ('countdown-to-date');
  let countdownStartButton = document.getElementById ('countdown-start-btn');

  let countdownContainer = document.getElementById ('countdown-in-process');
  let countdownToElement = document.getElementById ('countdown-to');
  let countdownLeftElement = document.getElementById ('countdown-left');
  let countdownProgressBarElement = document.getElementById ('countdown-progress-bar');
  let countdownProgressIndicatorElement = countdownProgressBarElement.getElementsByTagName('b')[0];
  let countdownResetContainer = document.getElementById ('countdown-reset-button-container');
  let countdownResetButton = countdownResetContainer.getElementsByTagName('button')[0];

  let soundBox = document.getElementById('notification-sound-box');
  let soundTestLink = document.getElementById('notification-sound-text');

  // IMPORTANT: AudioContext should be a persistent instance
  let audioContext = null;
  let isPlayingSequence = false;
  const notes = {
    // Fifth Octave
    C5: 523.25,
    CSharp5: 554.37, // C#5
    D5: 587.33,
    DSharp5: 622.25, // D#5
    E5: 659.25,
    F5: 698.46,
    FSharp5: 739.99, // F#5
    G5: 783.99,
    GSharp5: 830.61, // G#5
    A5: 880.00,
    ASharp5: 932.33, // A#5
    B5: 987.77,

    // Sixth Octave
    C6: 1046.50,
    CSharp6: 1108.73, // C#6
    D6: 1174.66,
    DSharp6: 1244.51, // D#6
    E6: 1318.51,
    F6: 1396.91,
    FSharp6: 1479.98, // F#6
    G6: 1567.98,
    GSharp6: 1661.22, // G#6
    A6: 1760.00,
    ASharp6: 1864.66, // A#6
    B6: 1975.53
  };

  // API check
  if (!window.AudioContext && !window.webkitAudioContext) {
    soundBox.innerHTML = options.messageNoSound;
  }

  let countdown = {
    initialSpanMilliseconds: 0
  };

  (function(){
    let now = new Date();
    const timezoneOffset = now.getTimezoneOffset(); // in minutes
    console.log(timezoneOffset);
    // set today date
    countdownToTimeElement.value = now.toLocaleTimeString(EN_US_LOCALE, {hour: '2-digit', minute: '2-digit', hour12: false});
    countdownToDateElement.value = now.toISOString().replace(/T.*/, '');
  })();

  setInterval (function() {
    showCurrentTime();
    // compare target time if set, show time left and progress
  }, 1000);

  countdownStartButton.addEventListener ('click', processForm);

  countdownResetButton.addEventListener ('click', function(){
  
    countdownForm.style.display = ''; // show
    countdownContainer.style.display = 'none'; // hide

  });

  soundTestLink.addEventListener ('click', playOnTimeSound);

  /**
   * Shows the current date and time in the page element.
   */
  function showCurrentTime() {
    let dt = new Date();
    currentTimeElement.innerHTML = dt.toLocaleDateString (EN_US_LOCALE, CURRENT_DATE_FMT) +
      ', ' + dt.toLocaleTimeString (EN_US_LOCALE, CURRENT_TIME_FMT);
  }

  /**
   * Processes the form and starts countdown if Ok.
   */
  function processForm() {

    let targetDate = getTargetDate();

    if (targetDate) {
      countdownForm.style.display = 'none';
      countdownContainer.style.display = 'block';
      startCountdown(targetDate);
    }

  }

  /**
   * Returns the target date value or null.
   * returns {Date}
   */
  function getTargetDate() {

    let dateString = countdownToDateElement.value; // can be anything
    let timeString = countdownToTimeElement.value; // can be empty string or date in format yyyy-mm-dd

    try {
      return new Date(dateString + 'T' + timeString);
    }
    catch(e) {
      return null;
    }

  }

  function startCountdown (targetDate) {
    
    // show target date if it is not today
    countdownToElement.innerHTML = 'Countdown to ' +
      ((areDatesEqual (targetDate, new Date()))? '' : targetDate.toLocaleDateString (EN_US_LOCALE, CURRENT_DATE_FMT) + ', ') +
      targetDate.toLocaleTimeString (EN_US_LOCALE, CURRENT_TIME_FMT);

    countdownProgressBarElement.style.display = 'block';
    countdownProgressIndicatorElement.style.width = '0%';

    let timerId = setInterval (function() {
      checkTime(targetDate, timerId);
    }, 500);

  }

  function checkTime(dt, timerId) {

    let now = new Date();
    let leftMilliseconds = dt - now;

    if (leftMilliseconds > 0) {
      // Continue
      // show time left
      countdownLeftElement.innerHTML = formatCountdownTime (leftMilliseconds);

      if (countdown.initialSpanMilliseconds === 0) {
        countdown.initialSpanMilliseconds = leftMilliseconds;
      }

      // show progress
      onCountdownProgress (leftMilliseconds);
    }
    else {
      // Done
      countdown.initialSpanMilliseconds = 0;

      // stop the timer
      clearInterval (timerId);

      // show the message
      onCountdownDone ();

      // send notification
    }

  }

  function onCountdownProgress (leftMilliseconds) {

    if (countdown.initialSpanMilliseconds > 0) {
      let pc = leftMilliseconds /countdown.initialSpanMilliseconds;
      countdownProgressIndicatorElement.style.width = (pc*100).toFixed(2) + '%';
    }

  }

  function onCountdownDone () {
    countdownProgressBarElement.style.display = 'none';
    countdownLeftElement.innerHTML = 'It\'s the time!';

    // play sound
    playOnTimeSound();
  }

  /**
   * Returns the value indicating whether the two dates are equal or not.
   */
  function areDatesEqual(date1, date2) {
    // Create new Date objects to avoid mutating the original dates
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Set the time to midnight for both dates
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    // Compare the dates
    return d1.getTime() === d2.getTime();
  }

  /**
   * Returns the formatted countdown time
   * @param {number} ms
   * @returns {string}
   */
  function formatCountdownTime(ms) {
    // Define time unit constants
    const MS_IN_SECOND = 1000;
    const MS_IN_MINUTE = MS_IN_SECOND * 60;
    const MS_IN_HOUR   = MS_IN_MINUTE * 60;
    const MS_IN_DAY    = MS_IN_HOUR * 24;

    // Calculate each unit value
    const days = Math.floor(ms / MS_IN_DAY);
    ms %= MS_IN_DAY;

    const hours = Math.floor(ms / MS_IN_HOUR);
    ms %= MS_IN_HOUR;

    const minutes = Math.floor(ms / MS_IN_MINUTE);
    ms %= MS_IN_MINUTE;

    const seconds = Math.floor(ms / MS_IN_SECOND);

    // Build an array with non-zero time parts
    let time = '';

    if (days) {
      time = '<b>' + days + ' day' + (days !== 1 ? 's ' : '') + '</b>, ';
    }
    else {
      // empasize time when days = 0
      time += '<b>';
    }

    time += prependZero(hours) + ':' +
      prependZero (minutes) + ':' +
      prependZero (seconds);

    if (!days) {
      time += '</b>';
    }

    return time;
  }

  /**
   * Prepends the number with one zero if n < 10.
   * @param {number} n
   * @returns {string}
   */
  function prependZero (n) {

    return (n < 10)? '0' + n.toString() : n.toString();
  }




  function playOnTimeSound() {

    if (isPlayingSequence) {
      return; // Prevent multiple simultaneous sequences
    }

    if (!window.AudioContext && !window.webkitAudioContext) {
      return;
    }

    isPlayingSequence = true; // Set the flag to indicate a sequence is playing

    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }


    /** Function to create the note sound.
     * @param {*} startTime the absolute start time in seconds
     */
    function beep(frequency, duration, startTime) {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine'; // You can change this to 'square', 'sawtooth', etc.
      oscillator.frequency.setValueAtTime(frequency, startTime);

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, startTime); // Start with volume at 0

      // Connect the oscillator to the gain node
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);

      //ADSR-like (Attack-Decay-Sustain-Release) shaping 
      const attackDuration = 0.05 * duration; // Quick rise duration in seconds
      const releaseDuration = 0.9 * duration; // Longer fade duration in seconds
      // Rise to full volume
      gainNode.gain.linearRampToValueAtTime(1, startTime + attackDuration);

      // Release, slow fade from full volume
      // Ensure this ends a little after the intended duration of the note itself
      const fadeOutEnd = startTime + attackDuration + releaseDuration;
      gainNode.gain.exponentialRampToValueAtTime(0.0001, fadeOutEnd);

      // Schedule the oscillator to stop slightly after its gain has faded out
      oscillator.stop(fadeOutEnd + 0.05); // Add a small buffer for cleanup

      // Clean up resources when the sound finishes
      oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
      };

    }

    // Sequence of beeps to mimic a car door warning
    const score = [notes.C6, notes.A5, notes.F5];
    const noteDuration = 1.2; // Duration of each beep in seconds
    const intervalBetweenStarts = 0.3; // Interval between beeps in seconds

    const now = audioContext.currentTime; // Get the current time in seconds
    let lastNoteTrueEndTime = now; // To track when the *last* note in the sequence will truly end

    score.forEach((freq, index) => {

      const currentNoteStartTime = now + (index * intervalBetweenStarts);
      beep(freq, noteDuration, currentNoteStartTime);

      // Calculate the actual end time of this specific note (including its fade-out tail)
      // This value is based on how 'beep' calculates its fadeOutEnd and oscillator.stop() time
      const thisNoteCalculatedEndTime = currentNoteStartTime + noteDuration +intervalBetweenStarts; // 0.1 from fadeOutEnd + 0.05 from oscillator.stop()
      if (thisNoteCalculatedEndTime > lastNoteTrueEndTime) {
          lastNoteTrueEndTime = thisNoteCalculatedEndTime;
      }
    });

    // Set a setTimeout to reset the `isPlayingSequence` flag
    // after the entire sequence (including the fade-out of the last note) has completed.
    // This setTimeout is safe because it's managing UI state, not audio scheduling.
    const totalSequencePlayDuration = lastNoteTrueEndTime - now;
    setTimeout(() => {
        isPlayingSequence = false;
    }, totalSequencePlayDuration * 1000); // Convert seconds to milliseconds
        
  }

}
