const Base = require('./base.js');
let marked = require('marked');
//markdown 解析器
var renderer = new marked.Renderer();
//重写解析规则
renderer.link = function(href, title, text) {
    return '<a href="' + href + '" title="' + text + '" target="_blank">' + text + '</a>';
}
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false, //消毒：意思是将html转义成&xxx等。
    silent: true,
    smartLists: true,
    smartypants: false

});
/***
 * 笑话集锦
 **/
module.exports = class extends Base {

    async __before(){
        let id = await this.session('id');
        if(!id){
            let sid = think.uuid('v4');
            await this.session('id',sid);
        }
    }
    //首页
    async indexAction() {
        let id = this.query('id');
        let joke = {};
        if(id){
            joke = await this.model('user_joke').where({id : id}).find();
        }
        let jokeId = await this.session('jokeId');
        jokeId = jokeId || [];
        if(think.isEmpty(joke)){
            //此处需要随机获取。
            if(jokeId && jokeId.length > 0){
                joke = await this.model('user_joke').where({id : ['notin',jokeId||[]]}).limit(0,1).order('likenum desc,id desc').find();
            }else{
                joke = await this.model('user_joke').limit(0,1).order('rand(),id desc').find();
            }
        }
        if(think.isEmpty(joke)){
            this.assign('empty',true);
        }else{
            let sesId = joke.id;
            jokeId.push(sesId)
            await this.session('jokeId',jokeId);
            joke.html = marked(joke.content||'',{renderer : renderer});    
        }
        this.assign('joke',joke);
        this.assign('d', {
            header: 'joke'
        })
        this.assign('site', this.config('site'));
        this.assign('links', this.config('links'));

        return this.display('home/joke')
    }

    async likeAction(){
        let id = this.post('id');
        if(id){
            await this.model('user_joke').where({id : id}).increment('likenum',1);
            let joke = await this.model('user_joke').where({id : id}).find();
            return this.body = joke.likenum;
        }
        return this.body = '0';
    }

    async clearAction(){
        //清掉重看
        await this.session('jokeId',[]);
        return this.body = '缓存已清理，刷新页面即可！';
    }

};