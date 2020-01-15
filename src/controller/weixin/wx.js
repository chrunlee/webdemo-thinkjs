const Base = require('../base');
const path = require('path');

module.exports = class extends Base {

    __before(){
        //监测源，必须从微信端打开，打开的同时，必须关注公众号才可以打开。否则跳转到其他页面tip
        //TODO : 从页面获取用户权限和信息
        let flag = false;
        if(flag){
            this.assign({title : '查看失败',msg : '请使用微信客户端登录查看'})
            return this.display("wechat/tip");
        }
        let site = this.config('site');
        this.wx = this.service('weixin',{
            token : site.wxtoken.value,
            appid : site.wxappid.value,
            secret : site.wxappsecret.value
        });
        let pd = this.post();
        let data = this.wx.fixData(pd);
        //header查看下
        let header = this.header();
        //作频率限制
        let ip = this.ip;
        think.logger.info(header);
        think.logger.info(ip+'：'+JSON.stringify(data));
        let check = await this.model('wx_iprecord').where({ip : ip}).find();
        if(!think.isEmpty(check)){
            this.assign({title : '查看失败',msg : '请使用微信客户端登录查看'})
            return this.display('wechat/tip');
        }
        
        this.post(data);
        this.assign('site',this.config('site'));
    }
    tipAction(){
        return this.display("wechat/tip");
    }

    __call(){
        this.assign({title : '温馨提示',msg : '您查看的数据有误，请关闭后重新打开!'});
        return this.display('wechat/tip');
    }
}