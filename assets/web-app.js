/*
 * The Site Web Application:
 * detects availability, registers the service worker, installs the web-application.
 */
/*jshint esversion:8 */
/**
 * Define and call the nameless function.
 */
(function(){

  if ('serviceWorker' in navigator) {

    var INSTALL_BLOCK_CSS = 'install-app-block',
      deferredInstalAppPromptEvent,
      installBlocks,
      installBlock,
      installButton;

    window.addEventListener('load', function() {

      installBlocks = document.getElementsByClassName (INSTALL_BLOCK_CSS);
      installBlock = installBlocks? installBlocks[0] : null;

      // Service worker registration
      navigator.serviceWorker.register('/worker.js')
        .then(function(registration) {
          // Registration was successful
          // console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
          // registration failed :(
          // Can happen when the SSL certificate is wrong.
          // console.log('ServiceWorker registration failed: ', err);
      });

      if (installBlock) {
        // If the Install block exists:
        
        installButton = installBlock.getElementsByTagName('button')[0];

        // 1. The app not installed
        window.addEventListener('beforeinstallprompt', (e) => {
          // Stash the event so it can be triggered later.
          installBlock.style.display = 'block';
          deferredInstalAppPromptEvent = e;
          //console.log ('The APP can be installed');
        });
    
        // 2. Hanle Install App event
        installButton.addEventListener('click', function(e){

          installBlock.style.display = 'none'; // hide the buttom
          deferredInstalAppPromptEvent.prompt(); // show the prompt
          // Wait for the user to respond to the prompt
          deferredInstalAppPromptEvent.userChoice
            .then((choiceResult) => {

              //if (choiceResult.outcome === 'accepted') {
                //console.log('User accepted the A2HS prompt');
              //} else {
                //console.log('User dismissed the A2HS prompt');
              //}
              deferredInstalAppPromptEvent = null;

            });

        });

      }

    });

  }

})();
