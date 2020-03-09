//qq service
const axios = require('axios');

module.exports = class extends think.Service{

    constructor(opts){
        super();
       
        this.opts = opts;
        this.url = {
            codeUrl : `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${opts.appId}&redirect_uri=DOMAIN/login/qq&state=123&scope=get_user_info`,
            tokenUrl : `https://graph.qq.com/oauth2.0/token`,
            openUrl : `https://graph.qq.com/oauth2.0/me`,
            infoUrl : `https://graph.qq.com/user/get_user_info`
        };
    }
    getAuthUrl(domain){
        return this.url.codeUrl.replace('DOMAIN',domain);
    }
    tokenUrl(code,redirect){
        return this.url.tokenUrl+`?grant_type=authorization_code&client_id=${this.opts.appId}&client_secret=${this.opts.appSecret}&code=${code}&redirect_uri=${redirect}`;
    }
    openUrl(tokenValue){
        return this.url.openUrl+`?access_token=${tokenValue}`
    }
    infoUrl(tokenValue,openIdValue){
        return this.url.infoUrl+`?access_token=${tokenValue}&oauth_consumer_key=${this.opts.appId}&openid=${openIdValue}`;
    }
    //获取token
    async _getToken(code,redirect){
        let data = await axios.get(this.tokenUrl(code,redirect)).then(rs=>rs.data);
        let dataObj = {};
        data.split('&').forEach(item=>{
            dataObj[item.split('=')[0]] = item.split('=')[1]
        });
        return dataObj.access_token;
    }
    //获取openid
    async _getOpenId(tokenValue){
        let data = await axios.get(this.openUrl(tokenValue)).then(rs=>rs.data);
        //从callback中获取openId
        let openId = /openid":"(.*)"/.exec(data);
        openId = openId[1];
        return openId;
    }
    //获取用户信息
    async _getUserInfo(tokenValue,openId){
        let userInfo = await axios.get(this.infoUrl(tokenValue,openId)).then(rs=>rs.data);
        userInfo.openId =openId;
        return userInfo;
    }
    //qq互联登录--main函数
    async login(code,redirect){
        let tokenValue = await this._getToken(code,redirect);
        let openId = await this._getOpenId(tokenValue);
        return await this._getUserInfo(tokenValue,openId);
    }
}