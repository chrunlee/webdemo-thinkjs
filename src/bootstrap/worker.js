// invoked in worker

// 1. 启动的时候获取site 信息，并存储。

think.beforeStartServer(async () => {
    let list = await think.model('site_set').select();
    let links = await think.model('user_links').select();
    console.log('系统设置：获得站点设置信息。')
    //list -> object
    let obj = {};
    list.forEach(item=>{
        item.value = item.strval || item.intval;
        obj[item.name] = item;
    })
    let siteInfo = obj;
    think.config('site',siteInfo);
    think.config('links',links);
})