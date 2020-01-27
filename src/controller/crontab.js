const Base = require('./base.js');
let mailer = require('../util/mailer');
let moment = require('moment');
let dingding = require('../util/ding');
let axios = require('axios');
let cheerio = require('cheerio');

/***
 * 定时任务
 **/
module.exports = class extends Base {

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

    /***
     * 日志定时清理
     ***/
    async clearLogAction(){
        if(this.isCli){
            think.logger.info('日志清理------------')
            //清理7天前的日志
            let ctime = (+new Date()) - (7 * 24 * 60 * 60 * 1000);
            await this.model('demo_logs').where({ctime : ['<',ctime]}).delete();
            return this.body = '';
        }
    }

    //2020年新型肺炎情况推送。
    async feiyanAction(){
        if(this.isCli){
            let url = `https://zhuanlan.zhihu.com/p/103691078`;
            let data = await axios.get(url).then(rs=>rs.data);
            let $ = cheerio.load(data);
            let html = $('.RichText.ztext.Post-RichText').html();
            await this.model('demo_feiyan').add({
                fetchtime : moment().format('YYYY-MM-DD HH:mm:ss'),
                content : html
            })
            think.logger.info('肺炎最新情况于'+(moment().format('YYYY-MM-DD HH:mm:ss'))+'更新完毕')
        }
    }
};