export const hideGtmConsole = () => {
  document.querySelectorAll('iframe').forEach((element, index) => {
    if (element.style.zIndex === '2147483647') {
      element.style.height = '0px';
      element.nextSibling.style.height = '0px';
    }
  });
};

export const run = (...args) => {
  const ga = window[window.GoogleAnalyticsObject || 'ga'];
  if (typeof ga === 'function') {
    ga(...args);
  }
};

export const captureLog = (testId) => {
  const ga = window[window.GoogleAnalyticsObject || 'ga'];
  if (typeof ga === 'function') {
    ga((tracker) => {
      tracker.set('sendHitTask', (model) => {
        const hitIndex = +(localStorage.getItem('hitcounter') || -1) + 1;
        const hitTime = +new Date() - (model.get('queueTime') || 0);
        const hitPayload =
          `${model.get('hitPayload')}&time=${hitTime}&index=${hitIndex}`;
        if ('sendBeacon' in navigator) {
          navigator.sendBeacon(`/collect/${testId}`, hitPayload);
        } else {
          const beacon = new Image();
          beacon.src = `/collect/${testId}?${hitPayload}`;
        }
        localStorage.setItem('hitcounter', hitIndex);
      });
    });
  }
};

export const sendEvent = (category, action, label) => {
  const ga = window[window.GoogleAnalyticsObject || 'ga'];
  if (typeof ga === 'function') {
    ga('send', 'event', category, action, label);
  }
};

export const trackers = () => {
  const ga = window[window.GoogleAnalyticsObject || 'ga'];
  if (typeof ga === 'function') {
    return ga.getAll();
  }
};

export const spy = () => {
  window.gaSpy = window.gaSpy || function(listnerCallbackOrConfigObj) {
    let q;
    let i;

    /**
     * gaSpyの設定情報
     */
    const config = ((config) => {
      listnerCallbackOrConfigObj = null;
      config.debugLogPrefix = config.debugLogPrefix || 'gaSpy';
      config.debug = !!config.debug;
      if (!config.callback || typeof(config.callback) !== 'function') {
        if (config.debug) {
          throw new Error( '[' + config.debugLogPrefix +
            '] Aborting; No listener callback provided.' );
        }
        config.callback = () => {};
      }
      config.gaObjName = config.gaObjName
        || window.GoogleAnalyticsObject || 'ga';
      return config;
    })(typeof(listnerCallbackOrConfigObj) === 'function'
      ? {'callback': listnerCallbackOrConfigObj}
      : listnerCallbackOrConfigObj);

    const gaObjName = config.gaObjName;
    let ga = window[gaObjName];

    const log = window.console && config.debug
      ? (...args) => {
        const a = [].slice.call(...args);
        a.unshift('['+config.debugLogPrefix+']');
        window.console.log(...a);
      } : () => {};

    const processArgs = (a) => {
      let _commandParts;
      let ev = {
        args: a,
        the: {},
      };
      let the = ev.the;
      // Parse command according to https://developers.google.com/analytics/devguides/collection/analyticsjs/command-queue-reference
      if ('function' === typeof a[0]) {
        the.callback = a[0];
      } else if ( a[0] && a[0].split) {
        _commandParts = a[0].split( '.' );
        the.trackerName = _commandParts.length > 1 ? _commandParts[0] : 't0';
        the.command = _commandParts.length > 1
          ? _commandParts[1]
          : _commandParts[0];
        _commandParts = _commandParts[_commandParts.length - 1].split(':');
        the.pluginName = _commandParts.length > 1
          ? _commandParts[0]
          : undefined;
        the.pluginMethodName = _commandParts.length > 1
          ? _commandParts[1]
          : undefined;
        if (the.command === 'require' || the.command === 'provide') {
          the.pluginName = a[1];
        }
        if (the.command === 'provide') {
          the.pluginConstructor = a[2];
        }
      } else {
        if (the.command === 'send') {
          the.hitType = ( a[a.length-1] && a[a.length-1].hitType ) || a[1];
        }
        if ('object' === typeof a[a.length-1]) {
          the.trackerName = a[a.length-1].name || the.trackerName;
        }
      }
      log( 'Run listener callback', the );
      if( false === config.callback( ev ) ) {
        return false;
      } else {
        return true;
      }
    };

    const proxy = function() {
      const a = [].slice.call(arguments);
      try {
        if (!processArgs(a)) return;
      } catch(ex) {
        // Do nothing
      }
      log('Command allowed: ', a);
      return proxy._gaOrig.apply(proxy._gaOrig, a);
    };

    const hijack = () => {
      let k;
      const gaOrig = proxy._gaOrig = window[gaObjName];
      log('Hijack', gaOrig._gaOrig ? '(already hijacked)' : '');
      window[gaObjName] = proxy;
      for (k in gaOrig) {
        if (gaOrig.hasOwnProperty(k)) {
          window[gaObjName][k] = gaOrig[k];
        }
      }
    };

    log('Config: ', config);

    if (!ga) {
      log('Instantiate GA command queue');
      ga = window[gaObjName] = (...args) => {
        (window[gaObjName].q = window[gaObjName].q || []).push(...args);
      };
      ga.l = 1 * new Date();
    }

    if (ga.getAll) {
      log('GA already loaded; cannot see previous commands');
      hijack();
    } else if (ga.l) {
      log('Command queue instantiated, but library not yet loaded');
      if (ga.q && ga.q.length) {
        log('Applying listener to', ga.q.length, ' queued commands');
        for (q = [], i = 0; i < ga.q.length; i++) {
          if (processArgs([].slice.call(ga.q[i]))) {
            q.push(ga.q[i]);
          }
        }
        ga.q = q;
      } else {
        ga.q = [];
      }
      ga(hijack);
      hijack();
    } else if (config.debug) {
      throw new Error('[' + config.debugLogPrefix + '] Aborting; `'
          + gaObjName + '` not the GA object.');
    }
  };
};

export const spyCaptureLog = (testId) => {
  window.gaSpy((evt) => {
    const gaCommand = evt.the.command;
    const trackerName = evt.the.trackerName;
    const ga = window[window['GoogleAnalyticsObject']];
    let tracker;
    if (typeof(ga) === 'function' && trackerName && gaCommand === 'send') {
      ga(() => {
        tracker = ga.getByName(trackerName);
        tracker.set('sendHitTask', (model) => {
          const hitIndex = +(localStorage.getItem('hitcounter') || -1) + 1;
          const hitTime = +new Date() - (model.get('queueTime') || 0);
          const hitPayload =
            `${model.get('hitPayload')}&time=${hitTime}&index=${hitIndex}`;
          if ('sendBeacon' in navigator) {
            navigator.sendBeacon(`/collect/${testId}`, hitPayload);
          } else {
            const beacon = new Image();
            beacon.src = `/collect/${testId}?${hitPayload}`;
          }
          localStorage.setItem('hitcounter', hitIndex);
        });
      });
    }
  });
};

