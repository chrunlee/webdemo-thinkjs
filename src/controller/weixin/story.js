const Base = require('./wx');

const path = require('path');

module.exports = class extends Base {


    async indexAction(){
        let data = await this.cache('wx_story_group',()=>{return this.model('wx_story').field('type,count(1) as num').order('num desc').group('type').select();});
        this.assign('list',data);
        return this.display("wechat/story/index")
    }

    async listAction(){
        let q = this.query('type') || this.post('type');
        this.assign('title',q);
        //分页查询?然后检索--random 20
        if(this.isPost){
            //form submit 
            let keywords = this.post('keywords');
            //keywords split - search 
            let words = [];
            keywords.split(' ').forEach(item=>{
                if(item.trim()!=''){
                    words.push(`%${item.trim()}%`);
                }
            })
            let where = {};
            if(words.length > 0){
                where.name = ['like',words];
            }
            if(null != q && q!= ''){
                where.type = q;
            }
            let list = await this.model('wx_story').where(where).order('rand()').limit(20).select();

            this.assign('list',list);
        }else{
            let list = await this.model('wx_story').where({type : q}).order('rand()').limit(20).select();
            this.assign('list',list);
        }
        return this.display('wechat/story/list');
    }

    async detailAction(){
        console.log(this.url);
        let id = this.query('id');
        console.log('id='+id);
        if(!id){
            this.assign({title : '查询失败',msg : '故事地址输入错误，没有该故事哦!<br /><a href="/weixin/story/index">回到首页</a>'})
            return this.display('wechat/tip');
        }
        let data = await this.model('wx_story').where({id : id}).find();
        if(think.isEmpty(data)){
            this.assign({title : '查询失败',msg : '故事地址输入错误，没有该故事哦!<br /><a href="/weixin/story/index">回到首页</a>'})
            return this.display('wechat/tip');
        }
        await this.model('wx_story').where({id : id}).increment('viewnum',1);
        this.assign("data",data);
        return this.display("wechat/story/detail");
    }
    
}
