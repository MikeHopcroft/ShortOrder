const {loadNycConfig} = require('@istanbuljs/load-nyc-config');

(async () => {
  console.log(await loadNycConfig());
})();
