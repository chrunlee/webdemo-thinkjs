const moment = require('moment');

module.exports = class extends think.Controller {
  async __before() {
    //日志功能
    let ip = this.ip;
    let userAgent = this.userAgent || '';
    let pathurl = this.ctx.path;
    let ctime = (+new Date());
    this.assign('site',this.config('site'));
    //首先是黑名单
    let recorder = await this.model('wx_iprecord').where({ip : ip}).find();
    if(!think.isEmpty(recorder)){
        if(recorder.expiretime < ctime){//超时24小时
            await this.model('wx_iprecord').where({ip : ip}).delete();
        }else{
            think.logger.info(`该IP：${ip}已被阻止请求.`);
            //ip被封。
            let msg = '您的IP地址:['+ip+']违反了本站反爬虫规则，已被封禁24小时!如需解禁，请发email至'+(this.config('site').email.value)+'!';
            this.assign('msg',msg);
            this.display('error/400');
            return false;
        }
    }

    let excludes = this.config('exclude');
    let nonelog = false;
    for(let i=0;i<excludes.length;i++){
        if(pathurl.startsWith(excludes[i].path)){
            nonelog = true;
            break;
        }
    }
    if(!nonelog){
        //记录日志
        await this.model('demo_logs').add({
            url : pathurl,
            ip : ip,
            browser : userAgent,
            ctime : ctime
        });
        think.logger.info(`${ip} : ${pathurl}`);
    }

    let rules = this.config('rules');
    //做遍历
    let currentRule = null;
    for(let i =0;i<rules.length;i++){
        if(pathurl.startsWith(rules[i].path)){
            currentRule = rules[i];
            break;
        }
    }
    if(currentRule){
        //获得时间和次数
        let count = await this.model('demo_logs').where({ip : ip,ctime : ['>',ctime - currentRule.time]}).count();
        if(count > currentRule.max){
            await this.model('wx_iprecord').add({
                ip : ip,
                expiretime : ctime + (24*60*60*1000)
            });
        }
        if(count > currentRule.limit){
            let str = '您的请求过于频繁，请等待一会再进行访问!';
            this.assign('msg',str);
            this.display('error/400')
            return false;
        }
    }

    //检查当天总次数
    let total = await this.model('demo_logs').where({ip : ip,ctime : ['>',ctime - (24*60*60*1000)]}).count();
    if(total > this.config('maxlimit')){//当天同一个IP请求超过1000次，则加入黑名单。
        //检查所有数量
        let alltotal = await this.model('demo_logs').where({ip : ip}).count();
        await this.model('wx_iprecord').add({
            ip : ip,
            expiretime : ctime + ((alltotal > 2000 ? 10 : 1) * 24*60*60*1000)
        });
    }
    
    
  }

  __call (){
    this.assign('site',this.config('site'));
    return this.display('error/404');
  }
};
