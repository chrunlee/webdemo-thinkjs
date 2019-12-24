const Base = require('./wx');
const https = require('https');
const path = require('path');

module.exports = class extends Base {


    constructor(ctx) {
        super(ctx);
        this.assign('site', this.config('site'));
    }
    
    async detailAction() {
        let id = this.query('id');
        id = id.trim();
        let data = await this.model('wx_poem_list').alias(' a ').where({ 'a.id': id }).join({
            table : 'wx_poem_author',
            as : ' b ',
            on : ['authorid','id']
        }).field('a.name,a.content,a.avatar,a.tags,a.description,b.name as authorname,b.avatar as headimg,b.chenghao,b.time,b.id as authorid').find();

        //description -replace a[href]
        data.description = data.description.replace(/href="[\s\S"]*?"/g,'href="javascript:;"');
        if (think.isEmpty(data)) {
            this.assign({ title: '查询失败', msg: '地址输入错误，没有该诗词哦!<br /><a href="/weixin/story/index">回到首页</a>' })
            return this.display('wechat/tip');
        }
        this.assign("data", data);
        return this.display('wechat/poem/detail')
    }

}