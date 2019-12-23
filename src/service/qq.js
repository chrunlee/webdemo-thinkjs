//qq service
const axios = require('axios');

module.exports = class extends think.Service{

    constructor(opts){
        //opts->
        /***
        {
            appId : '',
            appSecret : ''
        }

        ***/

        this.tokenUrl = `https://graph.qq.com/oauth2.0/token`;
        this.openUrl = `https://graph.qq.com/oauth2.0/me`;
        this.infoUrl = `https://graph.qq.com/user/get_user_info`;

    }
    get tokenUrl(){
        return this.tokenUrl+`?grant_type=authorization_code&client_id=${this.appId}&client_secret=${this.appSecret}&code=${this.code}&redirect_uri=${this.redirect}`;
    }
    get openUrl(){
        return this.openUrl+`?access_token=${this.tokenValue}`
    }
    get infoUrl(){
        return this.infoUrl+`?access_token=${this.tokenValue}&oauth_consumer_key=${this.appId}&openid=${this.openIdValue}`;
    }
    async _getToken(){
        let data = await axios.get(this.tokenUrl()).then(rs=>rs.data);
        console.log(`QQLogin:获取到token及相关值`)
        console.log(data);
        this.tokenValue = data.access_token;
    }
    async _getOpenId(){
        let data = await axios.get(this.openUrl()).then(rs=>rs.data);
        console.log(`QQLogin:获取到openId`)
        console.log(data);
        this.openIdValue = '111';
    }
    async _getUserInfo(){
        let userInfo = await axios.get(this.infoUrl()).then(rs=>rs.data);
        console.log(`QQLogin:获取到用户信息`)
        console.log(userInfo);
        return userInfo;
    }
    //qq互联登录
    async login(code,redirect){
        this.code = code;
        this.redirect = redirect;
        await this._getToken(code,redirect);
        await this._getOpenId();
        return await this._getUserInfo();
    }
}