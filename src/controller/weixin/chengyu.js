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
        let data = await this.model('wx_chengyu').where({ id: id }).find();
        if (think.isEmpty(data)) {
            this.assign({ title: '查询失败', msg: '地址输入错误，没有该成语哦!<br /><a href="/weixin/story/index">回到首页</a>' })
            return this.display('wechat/tip');
        }
        this.assign("data", data);
        return this.display('wechat/chengyu/detail')
    }

}