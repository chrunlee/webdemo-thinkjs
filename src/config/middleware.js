const path = require('path');
const isDev = think.env === 'development';

module.exports = [
  {
    handle: 'meta',
    options: {
      logRequest: isDev,
      sendResponseTime: isDev
    }
  },
  {
    handle: 'resource',
    enable: true,
    options: {
      root: path.join(think.ROOT_PATH, 'www'),
      gzip : true,
      notFoundNext : true
      // publicPath: /^\/(upload|static|favicon\.ico)/
    }
  },
  {
    handle: 'trace',
    enable: !think.isCli,
    options: {
      debug: isDev
    }
  },
  {
    handle: 'payload',
    options: {
      keepExtensions: true,
      limit: '5mb',
      uploadDir : path.join(think.ROOT_PATH,'www','static','upload','tmp')
    }
  },
  {
    handle: 'router',
    options: {}
  },
  'logic',
  'controller'
];
