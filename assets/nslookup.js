/*
 * Code for the nslookup page.
 * 2025-09-26
 * 2025-09-28 keyboard events handler updated.
 * 2025-09-29 MX record format.
 */

/**
 * Initialization, event handlers and other functions.
 * @param {*} options
 * @param {*} texts
 */
function nslookupPage(options, texts) {

    'use strict';

    const dohButton = document.getElementById(options.button);
    const domainField = document.getElementById (options.domainField);
    const serverSelector = document.getElementById (options.serverSelector);
    const recTypeSelector = document.getElementById (options.recTypeSelector);
    const resultElement = document.getElementById (options.resultElement);

    let kbdHandler = function(event){
      if(event.key === 'Enter' || event.keyCode === 13) {
        dohButton.click();
      }
    };

    domainField.addEventListener('keydown', kbdHandler);
    serverSelector.addEventListener('change', function(){dohButton.click();});
    recTypeSelector.addEventListener('change', function(){dohButton.click();});

    dohButton.addEventListener('click', function(event){
      testDOH ({
          btn:dohButton, srv:serverSelector, types:recTypeSelector,
          df:domainField, res:resultElement});
    });

    domainField.focus();

    /**
     * Performs the DNS-Over-Https test.
     * @param {*} options the options
     * @param {*} options.btn the block button
     * @param {*} options.df the domain input field element
     * @param {*} options.srv the server selector element
     * @param {*} options.types the record type selector element
     * @param {*} options.res the results element
     */
    function testDOH (options) {

      const btn = options.btn;
      const serverSelector = options.srv;
      const recTypeSelector = options.types;
      const res = options.res;
      const domainField = options.df;
      
      let domain = domainField.value;
      let recType = recTypeSelector.options[recTypeSelector.selectedIndex].value;
      let resolverUrl = (serverSelector.options[serverSelector.selectedIndex])
        .dataset.url
        .replace ('{domain}', domain)
        .replace ('{type}', recType);
      let showPunycode = function(name) {
        if (name) {
          return `<div>Name: ${name}</div>`;
        }
        return '';
      };
      let punycodeName = '';
      let msg = '';

      // Validation
      if (domain === '') {
        res.innerHTML = formatMessage (texts.msgEmptyString, 'warning');
        return;
      }

      if (!isDomainNameValid (domain)) {

        if (containsUnicode (domain)) {

          punycodeName  = toPunycode (domain);

          if (punycodeName  !== null) {
            // converted to Punycode, make the resolver url again
            resolverUrl = (serverSelector.options[serverSelector.selectedIndex])
                    .dataset.url
                    .replace ('{domain}', punycodeName )
                    .replace ('{type}', recType);
          }
          else {
            // valid but not converted to Punicode
            msg = texts.msgPunicode.replace ('{domain}', sanitizeText(domain));
          }
        }
        else {
          msg = texts.msgNotValid.replace ('{domain}', sanitizeText(domain));
        }
      }

      if (msg !== '') {
        // not valid
        res.innerHTML = formatMessage (msg, 'warning');
        return;
      }

      btn.disabled = true;

      fetch(resolverUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/dns-json' }
      })
      .then(response => response.json())
      .then(data => {

          let text = '';
          let reMX = /^(\d+)\s+(.+)/;

          btn.disabled = false;

          if (!data || typeof data.Status === 'undefined') {
            text = formatMessage (texts.msgUnexpected, 'warning');
          }
          else if (data.Status === 3) {
            text = formatMessage (texts.msgNotExists.replace('{domain}', domain), 'warning');
          }
          else if (data.Status === 0 && typeof data.Answer !== 'undefined' && data.Answer.length > 0) {
            for (let i = 0; i < data.Answer.length; i++) {

              let value = sanitizeText(data.Answer[i].data);
              
              switch (data.Answer[i].type) {
                case 15: // MX, format like 10 mail.com
                  value = value.replace (reMX, 'Priority $1, $2');
                  break;
              }

              // type=1 (A, IPv4) and type=28 (AAAA, IPv6)
              text += `<div class="doh-data-row">TTL ${data.Answer[i].TTL} s, ${value}</div>`;
            }
          }
          else {
            text = formatMessage (texts.msgNoRecord, 'warning');
          }
          res.innerHTML = showPunycode (punycodeName) + text;
        })
      .catch(error => {
          btn.disabled = false;
          res.innerHTML = showPunycode (punycodeName) + formatMessage (texts.msgAnError, 'error');
      });
      
    }      

    /* Sanitize the text for HTML code */
    function sanitizeText(text) {
      const element = document.createElement('div');
      element.innerText = text; // Use innerText to escape HTML
      return element.innerHTML; // Get the escaped HTML
    }

    /**
     * Returns value indicating whether the domain name valid or not.
     * @param {string} name The domain name.
     * @returns {boolean}
     */
    function isDomainNameValid (name) {
      // Prevents consecutive dots and leading/trailing hyphens
      // Leading underscore added for service subdomains like _sip.example.com
      const reDomain = /^(?!.*\.\.)(?!-)([_A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,63}$/;
      return reDomain.test (name);
    }      

    /**
     * Tests for any character outside basic ASCII range
     */
    function containsUnicode(name) {
      const regex = /^(?!.*\.\.)(?!-)([a-zA-Z0-9\u0080-\uFFFF-]{1,63}(?<!-)\.)+[a-zA-Z\u0080-\uFFFF]{2,63}$/;
      return regex.test(name) && /[^\x00-\x7F]/.test(name);
    }      

    /**
     * Converts the domain to Punycode
     */
    function toPunycode(domain) {
      try {
        // URL API automatically converts Unicode domains to Punycode
        return new URL(`http://${domain}`).hostname;
      } catch (e) {
        return null; // Invalid domain
      }
    }

    /**
     * Returns html code of the message.
     * @param {string} text the message text.
     * @param {string} messageType the message type, one of {"warning", "error"}
     * @returns {string} html formatted string,
     */
    function formatMessage(text, messageType) {
      return `<div class="page-message page-message--${messageType}">${text}</div>`;
    }

  }
