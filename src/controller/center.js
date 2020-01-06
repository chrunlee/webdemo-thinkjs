const Base = require('./base.js');
const fs = require('fs');
const path = require('path');
const rename = think.promisify(fs.rename, fs);
const axios = require('axios');
const moment = require('moment');
const mailer = require('../util/mailer');
let qiniuCloud = require('../util/qiniuCloud');
let {downloadPicture} = require('../util/downloader');
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
module.exports = class extends Base {
    constructor(ctx) {
        super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
        // 其他额外的操作
    }
    async __before() {
        let user = await this.session('admin');
        if (!user) {
            return false;
        }
        this.assign('site',this.config('site'));
    }

    //========================首页===================
    indexAction() {
        think.logger.warn(`[后台]-[登录]-登录后台${this.ip}`);
        return this.display('center/home');
    }

    //=====================上传===================
    async uploadAction() {
        let file = this.file('file');
        let ak = this.config('site').qiniuak.value;
        let sk = this.config('site').qiniusk.value;
        let scope  = this.config('site').qiniuscope.value;
        let staticdomain = this.config('site').staticdomain.value;
        let qiniuenable = this.config('site').qiniuenable.value == 1 ? true : false;//是否启用七牛云存储。
        let name = file.name;
        let realPath = "";
        if(qiniuenable){
            let filePath = await qiniuCloud.saveFile(ak,sk,scope,file.path,'static_',path.extname(name));
            realPath = '/'+filePath;
            fs.unlinkSync(file.path);//删除源文件。
        }else{
            realPath = '/static/upload/user/' + name;
            let filePath = path.join(think.ROOT_PATH, 'www', realPath);
            think.mkdir(path.dirname(filePath));
            await rename(file.path, filePath);
        }
        this.json({
            success: true,
            result: {
                name: file.name,
                filePath: realPath,
                size: file.size,
                type: file.type
            }
        });
    }
    //图片地址转换
    async convertHrefAction(){
        let href = this.post('href');
        let ak = this.config('site').qiniuak.value;
        let sk = this.config('site').qiniusk.value;
        let scope  = this.config('site').qiniuscope.value;
        let qiniuenable = this.config('site').qiniuenable.value == 1 ? true : false;//是否启用七牛云存储。
        //保存在本地。
        try{
            let fileName =  (+new Date()) + '-' + Math.floor(Math.random() * 1000) + '.png';
            let absPath = '/static/upload/user/' + fileName;
            let filePath = path.join(think.ROOT_PATH, 'www', absPath);
            await downloadPicture(href,filePath);
            if(qiniuenable){
                let staticPath = await qiniuCloud.saveFile(ak,sk,scope,filePath,'static_');
                fs.unlinkSync(filePath);
                return this.body = '/'+staticPath;
            }else{
                return this.body = absPath;
            }
        }catch(e){
            return this.body = '';
        }
    }
    //=================粘贴上传
    async pasteAction() {
        let ak = this.config('site').qiniuak.value;
        let sk = this.config('site').qiniusk.value;
        let scope  = this.config('site').qiniuscope.value;
        let staticdomain = this.config('site').staticdomain.value;
        let qiniuenable = this.config('site').qiniuenable.value == 1 ? true : false;//是否启用七牛云存储。

        let imgData = this.post('imgData');
        var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
        var dataBuffer = new Buffer(base64Data, 'base64');
        let fileName = (+new Date()) + '-' + Math.floor(Math.random() * 1000) + '.png';
        let absPath = '/static/upload/user/' + fileName;
        let filePath = path.join(think.ROOT_PATH, 'www', absPath);
        fs.writeFileSync(filePath, dataBuffer);
        let finalPath = "";
        if(qiniuenable){
            let staticPath = await qiniuCloud.saveFile(ak,sk,scope,filePath,'static_');
            fs.unlinkSync(filePath);//删除源文件。
            finalPath = '/'+staticPath;
        }else{
            finalPath = absPath;
        }
        this.body = finalPath;
    }
    //====================站点属性设置--edi==========================t
    async siteAction() {
        if (this.isPost) {
            //更新数据
            let body = this.post();
            let data = {};
            if (body.type == '0') {
                data.intval = body.value;
            } else {
                data.strval = body.value;
            }
            await this.model('site_set').where({ name: body.name }).update(data);
            //同步更新site属性
            let site = this.config('site');
            let obj = site[body.name];
            obj.value = data.intval || data.strval;
            site[body.name] = obj;
            this.config('site',site);
            this.json({ success: true });
        } else {
            let list = await this.model('site_set').select();
            this.assign({ list: list });
            return this.display('center/site/list');
        }
    }

    //============banner 设置==================
    async bannerAction() {
        if (this.isPost) {
            this.json({
                success: true,
                rows: await this.model('user_banner').select()
            });
        } else {
            return this.display('center/banner/list');
        }
    }

    //banner 添加
    async bannerAddAction() {
        if (this.isPost) {
            let data = this.post();
            var id = data.id;
            if (id) {
                await this.model('user_banner').where({ id: id }).update(data);
            } else {
                await this.model('user_banner').add(data);
            }
            this.json({ success: true });
        } else {
            if (this.ctx.param('id')) {
                let banner = await this.model('user_banner').where({ id: this.ctx.param('id') }).find();
                this.assign(banner);
            }
            return this.display('center/banner/add');
        }
    }

    //删除 banner
    async bannerDeleteAction() {
        if (this.isPost) {
            let id = this.post('id');
            await this.model('user_banner').where({ id: id }).delete();
            this.json({ success: true });
        }
    }

    //==============友情链接====================
    async linksAction() {
        if (this.isPost) {
            let list = await this.model('user_links').order('id asc').select();
            this.json({ rows: list.length, rows: list });
        } else {
            return this.display('center/links/list')
        }
    }
    //保存友情链接
    async linksSaveAction() {
        let data = this.post();
        if (data.id) {
            //update
            await this.model('user_links').where({ id: data.id }).update(data);
        } else {
            //insert
            await this.model('user_links').add(data);
        }
        this.json({ success: true, msg: 'Save Success' });
    }
    //删除友情链接
    async linksDeleteAction() {
        let id = this.post('id');
        if (id) {
            await this.model('user_links').where({ id: id }).delete();
        }
        this.json({ success: true, msg: 'Delete Success' });
    }


    //=========================文章分类====================
    async categoryAction() {
        if (this.isPost) {
            this.json(await this.model('user_category').select());
        } else {
            this.assign('rows', await this.model('user_category').select());
            return this.display('center/category/list');
        }
    }
    //分类保存
    async categorySaveAction() {
        let name = this.post('name');
        await this.model('user_category').add({ name: name });
        this.json({ success: true });
    }

    //=======================文章相关的处理==============
    async articleAction() {
        if (this.isPost) {
            let data = this.post();
            var page = parseInt(data.page, 10);
            var rows = parseInt(data.rows, 10);
            let list = await this.model('user_article').field('cancomment,category,ctime,enname,id,ismy,ispublish,likenum,link,postpath,readnum,recommend,tags,title,type').order('id desc').page(page, rows).select();
            let total = await this.model('user_article').count();
            this.json({ success: true, rows: list, total: total });
        } else {
            return this.display('center/article/list');
        }
    }
    //文章置顶
    async articleRecommendAction() {
        let id = this.post('id');
        if (id) {
            await this.model('user_article').where({ id: id }).update({ recommend: '1' });
        }
        this.json({ success: true });
    }
    //文章删除
    async articleDeleteAction() {
        let id = this.post('id');
        if (id) {
            await this.model('user_article').where({ id: id }).delete();
        }
        this.json({ success: true })
    }
    //文章取消发布
    async articleCancelAction() {
        let id = this.post('id');
        if (id) {
            await this.model('user_article').where({ id: id }).update({ ispublish: '0' });
        }
        this.json({ success: true })
    }
    //文章发布
    async articlePublishAction() {
        let id = this.post('id');
        if (id) {
            await this.model('user_article').where({ id: id }).update({ ispublish: '1', ctime: moment(new Date()).format('YYYY-MM-DD HH:mm') });
        }
        this.json({ success: true })
    }
    //跳转到文章发布或编辑页面
    async articleAddAction() {
        let id = this.query('id');
        let category = await this.model('user_category').select();
        this.assign('category', category);
        if (id) {
            let article = await this.model('user_article').where({ id: id }).find();
            article.tags = (article.tags || '').split(',');
            article.tags = article.tags.filter(v => {
                return v.trim() != '';
            });
            this.assign('article', article);
        } else {
            this.assign('article', {});
        }
        return this.display('center/article/add');
    }
    //推送文章到百度熊掌号
    async articleBaiduAction() {
        let id = this.post('id');
        if (id) {
            let article = await this.model('user_article').where({ id: id }).find();
            let url = this.config('site').domain.value + article.link;
            let rs = await axios.post(this.config('site').baiduxiongzhangapi.value, url);
            this.json({ success: true, msg: '推送成功<' + JSON.stringify(rs.data) + '>' })
        } else {
            this.json({ success: false });
        }
    }

    //文章保存
    async articleSaveAction() {
        var data = this.post();
        if (data.id) {
            await this.model('user_article').where({ id: data.id }).update(data);
            this.json({ success: true, id: data.id });
        } else {
            let insertId = await this.model('user_article').add(data);
            this.json({ success: true, id: insertId });
        }
    }
    //文章更新内容
    async articleUpdateAction() {
        let id = this.post('id');
        let content = this.post('content');
        if (id) {
            await this.model('user_article').where({ id: id }).update({ content: content });
            this.json({ success: true });
        } else {
            this.json({ success: false });
        }
    }

    //=================文章评论
    async commentAction() {
        if (this.isPost) {

            let data = this.post();
            var page = parseInt(data.page, 10);
            var rows = parseInt(data.rows, 10);
            let list = await this.model('user_comment').alias('t').join('user_article c on c.id=t.articleid').field('t.id,c.link,t.name,t.content,t.ctime,t.email,t.toname,c.title').order('ctime desc').page(page, rows).select();
            let total = await this.model('user_comment').count();
            return this.json({ success: true, rows: list, total: total });
        } else {
            return this.display('center/comment/list');
        }
    }
    //删除评论
    async commentDeleteAction() {
        if (this.post('id')) {
            await this.model('user_comment').where({ id: this.post('id') }).delete();
            return this.json({ success: true });
        } else {
            return this.json({ success: false })
        }
    }


    //=======================商店管理
    //商品列表
    async shopListAction() {
        if (this.isPost) {
            let list = await this.model('order_goods').order('updatetime desc').select();
            let total = list.length;
            return this.json({ success: true, rows: list, total: total })
        } else {
            return this.display('center/shop/list');
        }
    }
    //添加商品
    async shopAddAction() {
        let id = this.query('id');
        let article = {};
        if (id) {
            article = await this.model('order_goods').where({ id: id }).find();
            article.types = (article.type || '').split(',');
            article.types = article.types.filter(function(v) {
                return v != '';
            });
        }
        this.assign('article', article);
        return this.display('center/shop/add');
    }
    //删除商品
    async shopDeleteAction() {
        if (this.post('id')) {
            await this.model('order_goods').where({ id: this.post('id') }).delete();
            return this.json({ success: true });
        }
        return this.json({ success: false });
    }
    //保存商品
    async shopSaveAction() {
        var data = this.post();
        var isnew = false;
        if (!data.id) {
            data.id = think.uuid('v4').toString();
            isnew = true;
        }
        if (isnew) {
            data.updatetime = new Date();
            await this.model('order_goods').add(data);
        } else {
            data.updatetime = new Date();
            await this.model('order_goods').where({ id: data.id }).update(data);
        }
        return this.json({ success: true, id: data.id });
    }
    //更新商品
    async shopUpdateAction() {
        var data = this.post();
        if (data.id) {
            await this.model('order_goods').where({ id: data.id }).update({ description: data.content });
            return this.json({ success: true });

        }
        return this.json({ success: false });
    }
    //购买记录
    async shopSuccessAction() {
        if (this.isPost) {
            let page = this.post('page');
            let limit = this.post('limit');
            let list = await this.model('order_user').alias('t1').join('order_goods t2 on t1.goodid = t2.id').field('t1.*,t2.name,t2.price as goodprice').order('t1.starttime desc').page(page,limit).select();
            let count = await this.model('order_user').count();
            this.json({ success: true, total: count, rows: list });
        } else {
            return this.display('center/shop/success');
        }
    }

    //补发商品
    async shopResendAction() {
        let id = this.post('id');
        let order = await this.model('order_user').where({ id: id }).find();
        if (think.isEmpty(order)) {
            return this.json({ success: false });
        }
        let goodId = order.goodid;
        let goodItem = await this.model('order_goods').where({ id: goodId }).find();
        if (think.isEmpty(goodItem)) {
            return this.json({ success: false });
        }
        let email = order.email;
        let goodName = goodItem.name;
        let sendContent = goodItem.content;
        //对内容进行发送
        let html = marked(sendContent, { renderer: renderer });
        await mailer.sendOrderEmail(this.config('site').email.value, this.config('site').emailpwd.value, email, goodName, html);
        await this.model('order_goods').where({ id: goodId }).increment('sucnum', 1);
        //更新order的状态
        await this.model('order_user').where({ id: id }).update({ status: '1' });
        return this.json({ success: true });
    }
    //删除购买记录
    async shopSuccessDeleteAction() {
        if (this.post("id")) {
            await this.model('order_user').where({ id: this.post('id') }).delete();
            return this.json({ success: true })
        }
        return this.json({ success: false });
    }

    //数据统计分析
    async analysisAction(){
        //1.所有成交金额
        let total = await this.model('order_user').where({status : '1'}).sum('price');
        let countAll = await this.model('order_user').count();
        let countSuccess = await this.model('order_user').where({status : '1'}).count();

        //2.昨日成交金额
        let yesStart = moment().startOf('day').subtract(1,'days').format('YYYY-MM-DD HH:mm:ss');
        let yesEnd = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        let totalYestory = await this.model('order_user').where({status : '1',starttime : ['between',yesStart+','+yesEnd]}).sum('price');
        let countAllYestory = await this.model('order_user').where({starttime : ['between',yesStart+','+yesEnd]}).count();
        let countSuccessYestory = await this.model('order_user').where({status : '1',starttime : ['between',yesStart+','+yesEnd]}).count();

        //3.上周成交金额--从今天往前推7天
        let weekStart = moment().startOf('day').subtract(7,'days').format('YYYY-MM-DD HH:mm:ss');
        let weekEnd = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        let totalWeek = await this.model('order_user').where({status : '1',starttime : ['between',weekStart+','+weekEnd]}).sum('price');
        let countAllWeek = await this.model('order_user').where({starttime : ['between',weekStart+','+weekEnd]}).count();
        let countSuccessWeek = await this.model('order_user').where({status : '1',starttime : ['between',weekStart+','+weekEnd]}).count();

        //4.上月成交金额--从今天往前推30天
        let monthStart = moment().startOf('day').subtract(30,'days').format('YYYY-MM-DD HH:mm:ss');
        let monthEnd = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        let totalMonth = await this.model('order_user').where({status : '1',starttime : ['between',monthStart+','+monthEnd]}).sum('price');
        let countAllMonth = await this.model('order_user').where({starttime : ['between',monthStart+','+monthEnd]}).count();
        let countSuccessMonth = await this.model('order_user').where({status : '1',starttime : ['between',monthStart+','+monthEnd]}).count();

        //5.根据商品进行分类统计
        let list = await this.model().query('select t2.name,sum(t1.price) as total from order_user t1 left join order_goods t2 on t1.goodid = t2.id where t1.status=1 group by t1.goodid,t2.name ');

        this.assign({
            total,countAll,countSuccess,totalYestory,countAllYestory,countSuccessYestory,
            totalWeek,countAllWeek,countSuccessWeek,totalMonth,countAllMonth,countSuccessMonth,list
        });
        return this.display('center/shop/analysis');
    }
    //将本地数据库的文件上传到oss上
    async toossAction(){
        
    }


    //========================笑话集锦=====================
    async jokeListAction(){
        if(this.isPost){
            //分页处理
            let data = this.post();
            var page = parseInt(data.page, 10);
            var rows = parseInt(data.rows, 10);
            let list = await this.model('user_joke').field('id,type,mediatype,likenum,readnum,createtime').order('id desc').page(page, rows).select();
            let total = await this.model('user_joke').count();
            this.json({ success: true, rows: list, total: total });
        }else{
            return this.display('center/joke/list');
        }
    }
    //删除笑话
    async jokeDeleteAction(){
        let id = this.post('id');
        if(id){
            await this.model('user_joke').where({id : id}).delete();
            return this.json({success : true});
        }else{
            return this.json({success : false})
        }
    }

    //添加或编辑笑话
    async jokeAddAction(){
        let id = this.query('id');
        let article = {};
        if (id) {
            article = await this.model('user_joke').where({ id: id }).find();
        }
        this.assign('article', article);
        return this.display('center/joke/add');
    }

    //保存
    async jokeSaveAction(){
        var data = this.post();
        var isnew = false;
        if (!data.id) {
            isnew = true;
        }
        data.content = data.description;//懒癌
        if (isnew) {
            data.createtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            let id = await this.model('user_joke').add(data);
            data.id = id;
        } else {
            data.createtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            await this.model('user_joke').where({ id: data.id }).update(data);
        }
        return this.json({ success: true, id: data.id });
    }
    //update content of joke
    async jokeUpdateAction(){
        var id= this.post('id');
        if(id){
            var content = this.post('content');
            await this.model('user_joke').where({id : id}).update({content : content});
            return this.json({success : true})
        }else{
            return this.json({success : false})
        }
    }


    //全站广播
    async broadAction(){
        return this.display('center/broad/index');
    }

    async broadInfoAction(){
        return this.json({
            account : this.config('site').superaccount.value,
            password : this.config('site').superpwd.value
        });
    }
    async onlineAction(){
        let d = await this.model('site_set').where({name : 'online'}).find();
        return this.body = d.strval;
    }
    async clearOnlineAction(){
        await this.model('site_set').where({name :'online'}).update({strval : '0'})
        return this.body = '';
    }
};