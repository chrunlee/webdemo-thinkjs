// production config, it will load in production enviroment
module.exports = {
    workers: 0,
    port: 5300,
    stickyCluster: true,
    //请求规则
    maxlimit : 1000,
    rules: [{
        path: '/weixin', //路径开头
        time: 10 * 1000, //限制时间，10s 内 不能超过10次
        limit: 10,
        max : 50
    }],
    //不记录日志
    exclude: [{
        path : '/weixin/api'
    },{
        path: '/index/uploadDat'
    }, {
        path: '/index/dingding'
    }, {
        path: '/index/clearLog'
    }]
};