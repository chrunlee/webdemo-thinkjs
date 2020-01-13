const Base = require('./base.js');
let path = require('path');
let fs = require('fs');
let datConvert = require('../util/getBase64');
let mailer = require('../util/mailer');
let moment = require('moment');
let dingding = require('../util/ding');
/***
 * 前台展示
 **/
module.exports = class extends Base {

    __before(){
        this.assign('site', this.config('site'));
    }
    /***
     * 首页：获取对应的文章和banner
     **/
    async indexAction() {
        let banner = await this.cache('user_banner',()=>{return this.model('user_banner').where({ type: '1', isenable: '1' }).select()});
        let articles = await this.cache('user_article_first',()=>{return this.model('user_article').where({ ispublish: '1', type: '0', recommend: 1 }).order('ctime desc').limit(8).select();});
        let user = await this.session('user');
        this.assign('user', user);
        this.assign('banners', banner);
        this.assign('articles', articles);
        this.assign('links', this.config('links'));
        this.assign('d', {
            header: 'home'
        })
        return this.display('home/index');
    }

    //OSS 302
    async staticAction(){
        let id = this.query('id');
        let fileName = 'static_'+id;
        let staticdomain = this.config('site').staticdomain.value;
        let realPath = staticdomain+'/'+fileName;
        return this.redirect(realPath);
    }

    //dat count
    async datCountAction(){
        let obj = await this.model('site_set').where({name : 'datcount'}).find();
        let c = 0;
        if(!think.isEmpty(obj)){
            c = obj.intval;
        }
        think.logger.info(`[DAT]-[页面]-${this.ip}`);
        return this.json({
            count : c,
            msg : '已为<span style="color:red;font-weigth:bold;">'+c+'</span>个dat文件提供转化服务'
        });
    }
    /***
     * dat文件上传处理。
     ***/
    async uploadDatAction(){
        //1.文件大小超过20M 且不是dat的即刻删除;
        //2.转码完成后删除;
        //3.解码完成后生成base64,删除；
        var file = this.file('file');
        var maxSize = 1 * 1024 * 1024;
        var extName = '.dat';
        try{
            var coder = this.post('coder');
            //检查是否可用
            let xulie = await this.model('user_code').where({type : 'dat2m',code : coder}).find();
            if(!think.isEmpty(xulie)){
                maxSize = 2 * 1024 * 1024;
            }
            if(file.size == 0 || file.size > maxSize || path.extname(file.name).toLowerCase() != extName){
                try{
                    fs.unlinkSync(file.path);
                }catch(e){}
                return this.json({success : false,msg : '文件不符合规范，已经删除.'});
            }else{
                await this.model('site_set').where({name : 'datcount'}).increment('intval',1);
                // let base64 = await datConvert(file.path);
                if(fs.existsSync(file.path)){
                    fs.unlinkSync(file.path);
                }
                return this.json({success : true,msg : 'convert success'});
            }
        }catch(e){
            return this.json({success : false,msg : '数据不规范'});   
        }
    }
    /***
     * 跳转关于
     ***/
    async aboutAction() {
        let user = await this.session('user');
        this.assign({
            links: this.config('links'),
            user: user,
            d: {
                header: 'about'
            }
        });
        return this.display('home/about');
    }
    /***
     * 登录
     ***/
    async loginAction() {
        let user = await this.session('admin');
        think.logger.info(`[登录]-${this.ip}进入登录页面`);
        if (user) {
            return this.redirect('/center/index');
        } else {
            //判断是get还是post
            if (this.isPost) {
                //这里为了方便后台修改密码，不做md5加密。
                let data = this.post();
                let user = data.user.trim();
                let pwd = data.pwd.trim();
                if (this.config('site').superaccount.value === user && this.config('site').superpwd.value === pwd) {
                    //登录成功
                    this.session('admin', {
                        name: this.config('site').authorname.value,
                        email: this.config('site').email.value
                    });
                    return this.redirect('/center/index');
                } else {
                    this.assign({
                        msg: '登录失败，用户名或密码不正确',
                        user: user,
                        pwd: pwd
                    })
                    return this.display('home/login');
                }
            } else {
                return this.display('home/login');
            }
        }
    }
    /***
     * 跳转到pdf
     ***/
    async pdfAction() {
        //查询pdf
        let user = await this.session('admin');
        let user = await this.session('user');
        let cId = this.ctx.param('c');
        //根据第一个类别来处理
        let categoryList = await this.model().query('select t1.categoryid as id,t2.name,count(1) as num from user_pdf_pdf_category t1 left join user_pdf_category t2 on t1.categoryid = t2.id group by t1.categoryid order by t1.categoryid');
        let optionList = await this.model().query('select * from user_pdf_category');

        let firstCateId = cId || ((categoryList[0] || {}).id || '');
        let list = await this.model().query('select t2.* from user_pdf_pdf_category t1 left join user_pdf t2 on t1.pdfid= t2.id where t1.categoryid="' + firstCateId + '" ');
        this.assign({
            pdf: list,
            categoryId: firstCateId,
            categoryList: categoryList,
            optionList: optionList,
            user: user,
            user: user,
            d: {
                header: 'pdf'
            }
        });
        return this.display('home/pdf');
    }

    /***
     * 跳转到demo
     ***/
    async demoAction() {
        let site = this.config('site');
        let user = await this.session('user');
        this.assign({
            user: user,
            d: {
                header: 'demo'
            }
        });
        return this.display('home/demo');
    }

    //============================文章路由变更
    async articleAction() {
        let page = this.ctx.param('p'), //页码
            category = this.ctx.param('c'); //类别

        let user = await this.session('user');
        try {
            page = parseInt(page || '1', 10);
            page = Math.max(page, 1);
        } catch (e) {
            page = 1;
        }
        var start = (page - 1) * 20;
        let banner = await this.cache('user_banner',()=>{return this.model('user_banner').where({ type: '1', isenable: '1' }).select();});
        let categoryList = await this.cache('user_category',()=>{return this.model('user_category').select();});
        let articleWhere = { ispublish: 1, type: 0 };
        if (category) {
            articleWhere.category = category;
        }
        let articles = await this.cache(`user_article_${category}_${start}`,()=>{return this.model('user_article').where(articleWhere).order('ctime DESC').limit(start,20).select();});
        let counts = await this.cache(`user_article_${category}_${start}_count`,()=>{return this.model('user_article').where(articleWhere).count();});
        this.assign({ page:page,banner: banner, category: categoryList, c: category, article: articles, total: counts, site: this.config('site'), user: user, d: { header: 'article' } });

        return this.display('home/article');
    }
    /***
     * 获得评论内容
     ***/
    async getCommentAction() {
        let id = this.ctx.post('id');
        if (id) {
            id = id.replace(/["'&;)(]/gi, '');
            let sql = `select t1.*,t2.avatar,t2.blog as blog from user_comment t1 left join sys_user t2 on t1.userid=t2.id where t1.articleid='${id}' order by t1.ctime desc`;
            let list = await this.model().query(sql);
            this.json(list);
        } else {
            this.json([]);
        }
    }
    /***
     * 点赞操作
     ***/
    async zanAction() {
        let id = this.ctx.post('id');
        if (id) {
            await this.model('user_article').where({ id: id }).increment('likenum', 1);
            this.json({ success: true })
        } else {
            this.json({ success: false })
        }
    }
    /***
     * 保存评论
     ***/
    async saveCommentAction() {
        let data = this.ctx.post();
        let site = await this.config('site');
        let user = await this.session('user');
        data.name = user.name;
        data.email = user.email || '';
        data.userid = user.id;
        data.toname = data.toname || '';
        data.toid = data.toid || '';
        if (data.articleId && data.content.length <= 1000 && data.name.length <= 20 && data.email.length <= 50 && data.toname.length <= 50) {
            //评论后，立刻发邮件给我...
            //此处评论根据目标人来发送如果是评论的文章，直接发给我，如果是回复的某人，则发给某人（根据数据库的设置，是否发送。）
            data.articleId = data.articleId.replace(/["'&;)(]/gi, '');
            let article = await this.model('user_article').where({id : data.articleId}).find();
            //还得查询文章的地址
            let title = article.title || '某些文章';
            let fromName = data.name;
            let content = data.content;
            let link = site.domain.value+article.link;

            //此处发送邮件
            await mailer.sendCommentEmail(site.email.value,site.emailpwd.value,site.email.value,fromName,title,link);
            //插入评论数据
            let insertId = await this.model('user_comment').add({
                articleid: data.articleId,
                name: data.name,
                content: data.content,
                toid: data.toid,
                ctime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                toname: data.toname,
                email: data.email,
                commentid: data.commentid,
                userid: data.userid
            });
            this.json({ success: true, id: insertId });
        } else {
            this.json({ success: false, msg: '数据不符合规范' })
        }
    }

    /****
     * 增加阅读次数
     ***/
    async readAction() {
        if (this.ctx.post('id')) {
            let id = this.ctx.post('id');
            await this.model('user_article').where({ id: id }).increment('readnum', 1);
            this.json({ success: true })
        } else {
            this.json({ success: true });
        }
    }

    /****
     * 关键字检索
     ***/
    async searchAction() {
        let referer = this.header('referer');
        let q = this.ctx.param('q') || '';
        think.logger.info(`[检索]-[关键字]-${this.ip}检索关键字:${q}`);
        let user = await this.session('user');
        q = q.replace(/[";'&)(=%]/gi, '');
        if (q.trim() == '') {
            //重新返回来源网页
            return this.redirect(referer);
        } else {

            let strs = q.split(' ');
            let paramsSql = '',
                params = [];
            strs.forEach(a => {
                a = a.trim();
                paramsSql += '  title like "%s" or content like "%s" or ';
                params.push('%' + a + '%');
                params.push('%' + a + '%');
            });
            paramsSql = paramsSql.substr(0, paramsSql.length - 3);
            //对sql进行处理，空格分开的话重新处理
            let sql = 'select * from user_article where ispublish=1 and type=0 and (' + paramsSql + ')';
            let sqlOpt = this.model().parseSql({ sql }, ...params);
            let list = await this.model().query(sqlOpt);
            this.assign({ site: this.config('site'), user: user, d: { q: q, header: 'article', data: list } });
            return this.display('home/search');
        }
    }

    /***
     * 钉钉定时提醒
     ***/
    async dingdingAction(){
        if(this.isCli){
            let api = this.config('site').dingding.value;
            //查找比当前时间小的数据，如果有则依次进行
            let now = moment().format('YYYY-MM-DD HH:mm:ss');
            let list = await this.model('user_task').where({createtime : ['<',now],send : 0}).select();
            let ding = new dingding(api);
            let fns = ['sendText','sendLink','sendMd','sendCard'];
            for(let i in list){
                let obj = list[i];
                await ding[fns[obj.type]](obj.title,obj.content,obj.picpath,obj.url);
                await this.model('user_task').where({id : obj.id}).update({send : 1});
            }
        }
    }

    /**统计在线人数**/
    async onlineAction(){
        await this.model('site_set').where({name : 'online'}).increment('strval');
        return this.body = '';
    }
};