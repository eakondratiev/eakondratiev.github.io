/*
 * Service worker script.
 * https://developers.google.com/web/fundamentals/app-install-banners/#criteria
 */
/*jshint esversion:8 */
//var fetchCount = 0;
self.addEventListener('install', function(event) {
  // `install` is fired once per version of service-worker.js.
  // Do **not** use it to manage global state!
  // You can use it to, e.g., cache resources using the Cache Storage API.
});

self.addEventListener('fetch', function(event) {

  //var url = new URL (event.request.url);
  //console.log ('Fetch event for', url.origin);
  //event.respondWith(
  //  fetch(event.request).then(response => {
  //      fetchCount++;
  //      console.log('Handling request for %s at %s, fetch count is %d', url.origin, new Date(), fetchCount);
  //      return response;
  //  })
  //);
  return;

});