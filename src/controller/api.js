//提供一些自己常用的工具类API 

const Base = require('./base.js');
let getProxyIp = require('../util/getProxyIp');
let ipDateMap = {};
let moment = require('moment');
let qiniuCloud = require('../util/qiniuCloud');
let path = require('path');
let fs = require('fs');

module.exports = class extends Base {
    

    __before(){
        let code = this.post('code') || this.query('code');
        if(code != this.config('site').apicode.value){
            return this.fail(10086,'sorry ,wrong code!');
        }
    }
    /***
     * 每次获取一个IP，不论是否可用，IP是从齐云代理获取的免费IP
     * 用于浏览器插件使用-IP可用率不高
     * 每天都从第一页开始抓取，然后返回。
     ***/
    async getIpAction(){
        let startDate = moment().format('YYYY-MM-DD');
        let obj = ipDateMap[startDate] || {
            arr : [],
            page : 0
        };
        if(obj.arr.length == 0){
            //page++
            obj.page++;
            obj.arr = await getProxyIp(obj.page);
        }
        //返回一个数据对象
        let backData = obj.arr.splice(0,1)[0];
        ipDateMap[startDate] = obj;
        return this.json(backData);
    }

    async fileToOssAction(){
        //将本地资源图片，上传到OSS
        try{
            let ak = this.config('site').qiniuak.value;
            let sk = this.config('site').qiniusk.value;
            let scope = this.config('site').qiniuscope.value;
            let staticdomain = this.config('site').staticdomain.value;
            //1.以数据库为基础进行处理。 
            let baseFolder = path.join(think.ROOT_PATH,'www');
            //一、order_goods ： picpath.
            let goodList = await this.model('order_goods').field('id,picpath').select();
            for(let index in goodList){
                let good = goodList[index];
                let picpath = good.picpath;
                let goodId = good.id;
                let realPath = path.join(baseFolder,picpath);
                if(fs.existsSync(realPath) && think.isFile(realPath)){
                    let filePath = await qiniuCloud.saveFile(ak,sk,scope,realPath,'static_');
                    //更新数据库。
                    await this.model('order_goods').where({id : goodId}).update({picpath : staticdomain+'/'+filePath});
                }else{
                    console.log(realPath+' ： 文件不存在。')
                }
            }

            //二、user_article : postpath,content
             let articleList = await this.model('user_article').field('id,postpath,content').select();
             for(let i in articleList){
                let article = articleList[i];
                let articleId = article.id,
                    postpath = article.postpath,
                    content = article.content;
                //(/upload/user/1537336644065-20.png)
                let realPath = path.join(baseFolder,postpath);
                if(fs.existsSync(realPath) && think.isFile(realPath)){
                    let filePath = await qiniuCloud.saveFile(ak,sk,scope,realPath,'static_');
                    //更新数据库。
                    await this.model('user_article').where({id : articleId}).update({postpath : staticdomain+'/'+filePath});
                }
                //查找content内容
                let matchRs = content.match(/\((\/static.*)\)/g);
                if(matchRs){
                    for(let rsIndex in matchRs){
                        let str = matchRs[rsIndex];
                        let tempPath = str.replace('(','').replace(')','');
                        let tempRealPath = path.join(baseFolder,tempPath);
                        if(fs.existsSync(tempRealPath) && think.isFile(tempRealPath)){
                            let tempFinalPath = await qiniuCloud.saveFile(ak,sk,scope,tempRealPath,'static_');
                            //替换
                            content = content.replace(str,'('+staticdomain+'/'+tempFinalPath+')');
                        }else{
                            console.log(tempRealPath+'： 文件不存在');
                        }
                    }
                    await this.model('user_article').where({id : articleId}).update({content : content});
                }
             }
            //三、user_banner : bannerpath
            let bannerList = await this.model('user_banner').field('id,bannerpath').select();
            for(let index in bannerList){
                let good = bannerList[index];
                let picpath = good.bannerpath;
                let goodId = good.id;
                let realPath = path.join(baseFolder,picpath);
                if(fs.existsSync(realPath) && think.isFile(realPath)){
                    let filePath = await qiniuCloud.saveFile(ak,sk,scope,realPath,'static_');
                    //更新数据库。
                    await this.model('user_banner').where({id : goodId}).update({bannerpath : staticdomain+'/'+filePath});
                }else{
                    console.log(realPath+' ： 文件不存在。')
                }
            }
            //四、user_attach : 用于自己的图床。--暂时保留

            return this.json({msg : 'fuck over'});
        }catch(e){
            console.log(e);
            return this.json({msg : 'fuck error'});
        }
    }
}