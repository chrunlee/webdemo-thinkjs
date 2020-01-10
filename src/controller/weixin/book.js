let base = require('./wx');

module.exports = class extends base{

    //书籍
    async indexAction(){
        //列出书名
        let list  = await this.model('wx_book').order('id asc').select();
        this.assign('list',list);
        return this.display('wechat/book/index');
    }

    async listAction(){
        let id = this.query('id');
        if(id){
            let chapterList = await this.model('wx_book_chapter').field('id,name,seq').where({bookid : id}).order('seq asc').select();
            let book = await this.model('wx_book').where({id : id}).find();
            this.assign('book',book);
            this.assign('list',chapterList);
            return this.display('wechat/book/list');
        }
        this.assign({title : '查询失败',msg : '书籍地址输入错误，没有该书籍哦!<br /><a href="/weixin/book">回到首页</a>'})
        return this.display('wechat/tip');
    }


    async detailAction(){
        let id = this.query('id');
        if(id){
            let chapter = await this.model('wx_book_chapter').where({id : id}).find();
            if(!think.isEmpty(chapter)){
                //获得上一个和下一个的地址。
                let prev = await this.model('wx_book_chapter').where({seq : ['<',chapter.seq],bookid : chapter.bookid}).order('seq desc').find();
                let next = await this.model('wx_book_chapter').where({seq : ['>',chapter.seq],bookid : chapter.bookid}).order('seq asc').find();
                let book = await this.model('wx_book').where({id : chapter.bookid}).field('id,name').find();
                if(!think.isEmpty(prev)){
                    this.assign('prev',prev.id);
                }
                if(!think.isEmpty(next)){
                    this.assign('next',next.id);
                }
                this.assign('book',book);
                this.assign('data',chapter);
                return this.display('wechat/book/detail');
            }
        }
        this.assign({title : '查询失败',msg : '书籍地址输入错误，没有该书籍哦!<br /><a href="/weixin/book">回到首页</a>'})
        return this.display('wechat/tip');
    }
}