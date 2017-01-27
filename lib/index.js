export default (files, opts = {}) => (callback) => () => {

  if (!files || (Array.isArray(files) && !files.length)) {
    throw new Error('Need files to watch');
  }
  if (!callback || typeof callback !== 'function') {
    throw new Error('Need a callback function');
  }

  return function watch(log) {
    const chokidar = require('chokidar');

    const events = opts.events || ['add', 'change'];

    return new Promise((resolve, reject) => {

      log('Globbing files...');

      const initialFileList = [];
      const initialListener = (file) => initialFileList.push(file);

      const watcher = chokidar.watch(files, { persistent: true, ...opts });

      watcher.once('error', reject);

      watcher.on('add', initialListener);
      watcher.once('ready', () => {
        watcher.removeListener('add', initialListener);

        log('initial scan complete, running task...');

        console.log({ callback: callback.toString() });
        const callbackPromise = callback(initialFileList);
        console.log({ callbackPromise });

        if (!callbackPromise || !callbackPromise.then || typeof callbackPromise.then !== 'function') {
          return reject(new Error('Callback did not return a promise.'));
        }

        callbackPromise.then(() => {
          log('watching for changes, press ctrl-c to exit');
          events.forEach((event) => watcher.on(event, callback));
          resolve();
        }).catch((err) => {
          if (opts.bail) {
            reject(err);
          } else {
            log('reject', err)
            resolve();
          }
        });
      });
    });
  };
};
