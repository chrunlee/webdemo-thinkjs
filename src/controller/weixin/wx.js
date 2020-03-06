const Base = require('../base');
const path = require('path');

module.exports = class extends Base {

    async __before(){
        const flag = await super.__before();
        if(flag == false){
            return false;
        }
        //监测源，必须从微信端打开，打开的同时，必须关注公众号才可以打开。否则跳转到其他页面tip
        //TODO : 从页面获取用户权限和信息
        // if(flag){
        //     this.assign({title : '查看失败',msg : '请使用微信客户端登录查看'})
        //     return this.display("wechat/tip");
        // }
        let site = this.config('site');
        this.wx = this.service('weixin',{
            token : site.wxtoken.value,
            appid : site.wxappid.value,
            secret : site.wxappsecret.value
        });
        let pd = this.post();
        let data = this.wx.fixData(pd);
        this.post(data);
        this.assign('site',this.config('site'));
        let user = await this.session('user');
        if(think.isEmpty(user)  && !this.ctx.url.startsWith('/weixin/api')){
            //跳转到授权页面
            let code = this.query('code');//获取code ,from weixin.qq.com
            let state = this.query('state');
            if(code){
                let userData = await this.wx.getWebToken(code);
                console.log(userData);
                if(userData.openid){
                    //获得openId
                    let openId = userData.openid;
                    //根据openId获取用户信息
                    let user = await this.model('sys_user').where({id : openId}).find();
                    if(think.isEmpty(user)){
                        //用户未关注
                        //跳转到tip
                        this.assign({title : '温馨提示',msg : '请关注公众号后，再查看该页面!'})
                        return this.display('wechat/tip');
                    }else{
                        console.log(user);
                        await this.session('user',user);
                    }
                }else{
                    this.assign({title : '温馨提示',msg : '请关注公众号后，再查看该页面!'})
                    return this.display('wechat/tip');  
                }
            }else{
                return this.redirect(this.wx.getPageAuthUrl(this.config('site').domain.value+this.ctx.url));    
            }
        }
    }
    tipAction(){
        return this.display("wechat/tip");
    }

    __call(){
        this.assign({title : '温馨提示',msg : '您查看的数据有误，请关闭后重新打开!'});
        return this.display('wechat/tip');
    }
}