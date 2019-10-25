module.exports = [
    [/^\/article\/(.*)$/,'/article/detail?id=:1'],
    [/^\/detail\/(.*)$/i,'/article/detail?id=:1'],
    [/^\/shop\/detail\/(.*)$/,'/shop/detail?id=:1'],
    [/^\/shop\/deal\/(.*)$/,'/shop/deal?id=:1'],
    [/^\/login$/,'/index/login']
    // [/^.*$/,'/error']
];
