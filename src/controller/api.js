//提供一些自己常用的工具类API 

const Base = require('./base.js');
let getProxyIp = require('../util/getProxyIp');
let ipDateMap = {};
let moment = require('moment');
let qiniuCloud = require('../util/qiniuCloud');
let path = require('path');
let fs = require('fs');
let dirfile = require('dirfile')

module.exports = class extends Base {


    __before() {
        let code = this.post('code') || this.query('code');
        if (code != this.config('site').apicode.value) {
            return this.fail(10086, 'sorry ,wrong code!');
        }
    }
    /***
     * 每次获取一个IP，不论是否可用，IP是从齐云代理获取的免费IP
     * 用于浏览器插件使用-IP可用率不高
     * 每天都从第一页开始抓取，然后返回。
     ***/
    async getIpAction() {
        let startDate = moment().format('YYYY-MM-DD');
        let obj = ipDateMap[startDate] || {
            page: 0
        };
        obj.page++;
        let rst = await getProxyIp(obj.page);
        ipDateMap[startDate] = obj;
        return this.json(rst);
    }

    async fileToOssAction() {
        //将本地资源图片，上传到OSS
        try {
            let ak = this.config('site').qiniuak.value;
            let sk = this.config('site').qiniusk.value;
            let scope = this.config('site').qiniuscope.value;
            let staticdomain = this.config('site').staticdomain.value;
            //1.以数据库为基础进行处理。 
            let baseFolder = path.join(think.ROOT_PATH, 'www');
            //一、order_goods ： picpath.
            let goodList = await this.model('order_goods').field('id,picpath').select();
            for (let index in goodList) {
                let good = goodList[index];
                let picpath = good.picpath;
                let goodId = good.id;
                let realPath = path.join(baseFolder, picpath);
                if (fs.existsSync(realPath) && think.isFile(realPath)) {
                    let filePath = await qiniuCloud.saveFile(ak, sk, scope, realPath, 'static_');
                    //更新数据库。
                    await this.model('order_goods').where({ id: goodId }).update({ picpath: staticdomain + '/' + filePath });
                } else {
                    console.log(realPath + ' ： 文件不存在。')
                }
            }

            //二、user_article : postpath,content
            let articleList = await this.model('user_article').field('id,postpath,content').select();
            for (let i in articleList) {
                let article = articleList[i];
                let articleId = article.id,
                    postpath = article.postpath,
                    content = article.content;
                //(/upload/user/1537336644065-20.png)
                let realPath = path.join(baseFolder, postpath);
                if (fs.existsSync(realPath) && think.isFile(realPath)) {
                    let filePath = await qiniuCloud.saveFile(ak, sk, scope, realPath, 'static_');
                    //更新数据库。
                    await this.model('user_article').where({ id: articleId }).update({ postpath: staticdomain + '/' + filePath });
                }
                //查找content内容
                let matchRs = content.match(/\((\/static.*)\)/g);
                if (matchRs) {
                    for (let rsIndex in matchRs) {
                        let str = matchRs[rsIndex];
                        let tempPath = str.replace('(', '').replace(')', '');
                        let tempRealPath = path.join(baseFolder, tempPath);
                        if (fs.existsSync(tempRealPath) && think.isFile(tempRealPath)) {
                            let tempFinalPath = await qiniuCloud.saveFile(ak, sk, scope, tempRealPath, 'static_');
                            //替换
                            content = content.replace(str, '(' + staticdomain + '/' + tempFinalPath + ')');
                        } else {
                            console.log(tempRealPath + '： 文件不存在');
                        }
                    }
                    await this.model('user_article').where({ id: articleId }).update({ content: content });
                }
            }
            //三、user_banner : bannerpath
            let bannerList = await this.model('user_banner').field('id,bannerpath').select();
            for (let index in bannerList) {
                let good = bannerList[index];
                let picpath = good.bannerpath;
                let goodId = good.id;
                let realPath = path.join(baseFolder, picpath);
                if (fs.existsSync(realPath) && think.isFile(realPath)) {
                    let filePath = await qiniuCloud.saveFile(ak, sk, scope, realPath, 'static_');
                    //更新数据库。
                    await this.model('user_banner').where({ id: goodId }).update({ bannerpath: staticdomain + '/' + filePath });
                } else {
                    console.log(realPath + ' ： 文件不存在。')
                }
            }
            //四、user_attach : 用于自己的图床。--暂时保留

            return this.json({ msg: 'fuck over' });
        } catch (e) {
            console.log(e);
            return this.json({ msg: 'fuck error' });
        }
    }


    /***
     * 添加定时任务-添加后定时执行，全都为一次性的。为日程类的。
     ***/
    async addTimerAction() {
        let data = this.post();
        data.send = 0;
        let iid = await this.model('user_task').add(data);
        think.logger.info(`[接口]-[添加定时任务]-${data.content}`);
        return this.json({ success: true, msg: '添加成功' });
    }


    /**
    同步静态资源文件-非图片
    /static/plugins/byy/default/byy.css 等
    **/
    async syncPluginAction() {
        //将 /www/static/css  images js plugins 文件夹下的上传的七牛oss
        let ak = this.config('site').qiniuak.value;
        let sk = this.config('site').qiniusk.value;
        let scope = this.config('site').qiniufilescope.value;
        let dir = this.query('dir')||'';
        //1.以数据库为基础进行处理。 
        let baseFolder = path.join(think.ROOT_PATH, 'www');
        let realFolder = path.join(baseFolder,dir);
        let folders = [];
        let fileList = dirfile(realFolder,false,true,function(filePath,stat){
            return filePath.indexOf('static\\upload\\') < 0 ;//不包含upload文件夹
        },function(filePath,stat){
            let name = filePath.replace(baseFolder,'');
            name = name.replace(/\\/g,'/')
            name = name.substr(1,name.length);
            return {
                idx : Math.random() * 1000,
                filePath : filePath,
                name : name
            }
        });
        fileList.sort((a,b)=>a.idx-b.idx);
        let str = '';
        try{
            for(let ldx in fileList){
                let file = fileList[ldx];
                think.logger.info('[七牛云]-静态资源上传:'+file.name);
                let filePath = await qiniuCloud.saveFile(ak, sk, scope, file.filePath, '',file.name);    
            }
            str = '上传成功'
        }catch(e){
            think.logger.error(e);
            str = '上传失败,'+e.message;
        }
        return this.body = str;
    }
}