const Base = require('./base.js');
/***
 * 文章相关的处理
 * 1.文章列表；2.文章详情；3.文章评论等。
 **/
let marked = require('marked');
//markdown 解析器
var renderer = new marked.Renderer();
//重写解析规则
renderer.link = function(href,title,text){
    return '<a href="'+href+'" title="'+text+'" target="_blank">'+text+'</a>';
}
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,//消毒：意思是将html转义成&xxx等。
    silent : true,
    smartLists: true,
    smartypants: false

});

module.exports = class extends Base {
  async indexAction() {
    let page = this.ctx.param('p'),//页码
        category = this.ctx.param('c');//类别

    let github = await this.session('github');
    try{
        page = parseInt(page||'1',10); 
        page = Math.max(page,1);
    }catch(e){
        page = 1;
    }
    var start = (page-1)*20;
    let banner = await this.model('user_banner').where({type : '1',isenable : '1'}).select();
    let categoryList = await this.model('user_category').select();
    let articleWhere = {ispublish : 1,type : 0};
    if(category){
        articleWhere.category = category;
    }
    let articles = await this.model('user_article').where(articleWhere).order('ctime desc').limit(start,start+20).select();
    let counts = await this.model('user_article').where(articleWhere).count();
    this.assign({banner : banner,category : categoryList,c : category,article : articles,total : counts,site : this.config('site'),github : github ,d : {header : 'article'}});
    
    return this.display('home/article');
  }
  /***
   * 详情页面
   ***/
  async detailAction(){

    let id = this.ctx.param('id');
    let github = await this.session('github');
    if(id === 'index'){
        return this.ctx.redirect('/article/index');
    }
    id = (id||'').toLowerCase();
    let article = await this.model('user_article').where({enname : id}).find();//获得。
    if(think.isEmpty(article)){
        return this.display('error/404');
    }
    article.html = marked(article.content,{renderer : renderer});
    article.tags = article.tags ? article.tags.split(',') : [];
    let links = await this.model('user_article').where({ispublish : 1,type : 0,enname : ['!=',id],category:article.category}).order(' rand() ').limit(0,8).select();
    this.assign({article : article,site : this.config('site'),github : github,link : links,d : {header : 'article'},links : this.config('links')});
    return this.display('home/detail');
    
  }
  
};
