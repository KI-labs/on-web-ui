// Copyright 2015, EMC, Inc.

const karmaCIConf = require('./karma.ci.conf');

module.exports = (config) => {
  karmaCIConf(config);

  config.browsers = config.browsers.filter(browser => browser !== 'Chrome');
  config.plugins = config.plugins.filter(plugin => plugin !== 'karma-chrome-launcher');
};
