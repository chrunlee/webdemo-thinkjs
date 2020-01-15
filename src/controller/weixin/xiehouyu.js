const Base = require('./wx');
const https = require('https');
const path = require('path');

module.exports = class extends Base {

    
    async listAction(){
        let szm = this.post('szm');
        szm = szm || 'a';
        //获取首字母
        //获得数据
        let key = this.post('keywords');
        let where = {
            szm : szm
        };
        let page = this.post('page') || 1;
        let limit = this.post('limit') || 50;
        if(key){
            where['name'] = ['like','%'+key+'%'];
        }
        let list = await this.model('wx_xiehouyu').field('id,name').page(page,limit).where(where).select();
        return this.json({
            list : list
        });
    }
    async indexAction(){
        let szm = this.post('szm');
        szm = szm || 'a';
        this.assign('szm',szm);
        let keywords = this.post('keywords');
        this.assign('keywords',keywords);
        let page = this.post('page') || 1;
        let limit = this.post('limit') || 50;
        this.assign({
            page : page,
            limit : limit
        })
        let szmList = await this.model('wx_xiehouyu').group('szm').field('szm').order('szm asc').select();
        this.assign('szmList',szmList);
        return this.display('wechat/xiehouyu/list');
    }
    async detailAction() {
        let id = this.query('id');
        id = id.trim();
        let data = await this.model('wx_xiehouyu').where({ id: id }).find();
        if (think.isEmpty(data)) {
            this.assign({ title: '查询失败', msg: '地址输入错误，没有该成语哦!<br /><a href="/weixin/story/index">回到首页</a>' })
            return this.display('wechat/tip');
        }
        this.assign("data", data);
        //检查是否存在成语小故事
        return this.display('wechat/xiehouyu/detail')
    }

}