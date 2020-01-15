module.exports = [
    [/^\/article\/(.*)$/,'/article/detail?id=:1'],
    [/^\/detail\/(.*)$/i,'/article/detail?id=:1'],
    [/^\/shop\/detail\/(.*)$/,'/shop/detail?id=:1'],
    [/^\/shop\/deal\/(.*)$/,'/shop/deal?id=:1'],
    [/^\/login$/,'/index/login'],

    [/^\/weixin\/story\/list\/(.*)$/,'/weixin/story/list?type=:1'],
    [/^\/weixin\/story\/detail\/(.*)$/,'/weixin/story/detail?id=:1'],//关于小故事的页面。

    [/^\/weixin\/book\/list\/(.*)$/,'/weixin/book/list?id=:1'],
    [/^\/weixin\/book\/chapter\/(.*)$/,'/weixin/book/detail?id=:1'],

    [/^\/weixin\/chengyu\/detail\/(.*)$/,'/weixin/chengyu/detail?id=:1'],
    [/^\/weixin\/xiehouyu\/detail\/(.*)$/,'/weixin/xiehouyu/detail?id=:1'],

    //oss
    [/^\/static_(.*)$/,'/index/static?id=:1'],
    [/^\/joke\/(\d*)$/,'/joke/index?id=:1'],
    [/^\/magnet\/detail\/(.*)$/,'/magnet/detail?id=:1']
    // [/^.*$/,'/error']
];
