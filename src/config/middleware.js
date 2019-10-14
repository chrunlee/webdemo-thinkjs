const path = require('path');
const isDev = think.env === 'development';

module.exports = [{
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
            gzip: true,
            maxage: 7 * 24 * 60 * 60 * 1000, //浏览器缓存
            notFoundNext: true
            // publicPath: /^\/(upload|static|favicon\.ico)/
        }
    },
    {
        handle: 'trace',
        enable: !think.isCli,
        options: {
            debug: isDev,
            error(err, ctx) {
                let url = ctx.originalUrl;
                if (ctx.isPost) { //
                    ctx.fail(10086, 'sorry,you found a big error box');
                } else if (url.indexOf('.php') > -1) { //someone who want get somthing
                    ctx.fail(10086, 'hey man,please let me go!')
                } else {
                    if (ctx.status == '404') {
                        ctx.redirect('/error/notFound');
                    } else {
                        ctx.redirect('/error/serverError');
                    }
                }
                return false;
            }
        }
    },
    {
        handle: 'payload',
        options: {
            keepExtensions: true,
            limit: '25mb',
            uploadDir: path.join(think.ROOT_PATH, 'www', 'static', 'upload', 'tmp')
        }
    },
    {
        handle: 'router',
        options: {}
    },
    'logic',
    'controller'
];