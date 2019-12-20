const Base = require('./base.js');
const superagent = require('superagent');

module.exports = class extends Base {
    //github 授权登录
    async githubAction() {
        let code = this.query('code');
        let state = this.query('state');
        let site = this.config('site');
        var redirectURL = await this.session('loginRefer');
        let githubService = think.service('github');
        let github = await githubService.getUser(site.githubclientid.value,site.githubsecret.value,code,state);
        let user = await this.model('sys_user').where({ id: github.id }).find();
        if (!think.isEmpty(user)) {
            await this.model('sys_user').where({ id: user.id }).update({
                avatar : github.avatar_url,
                name : github.name,
                json : JSON.stringify(github),
                email : github.email
            });
        } else {
            user = {
                id : github.id,
                avatar : github.avatar_url,
                name : github.name,
                login : '',
                password : '',
                from : 'github',
                json : JSON.stringify(github),
                email : github.email,
                phone : ''
            }
            await this.model('sys_user').add(user);
        }
        await this.session('user', user);
        return this.redirect(redirectURL);

    }

    async githubLoginAction() {
        //获取clientId进行重定向
        let site = this.config('site');
        var redirectURL = this.referer();
        var state = (new Date()).valueOf();
        await this.session('loginRefer', redirectURL);
        let url = this.service('github').getLogin(site.githubclientid.value,site.githubscope.value,state);
        this.redirect(url);
    }

    //用户退出
    async logoutAction(){
        await this.session('user',null);
        return this.redirect('/');
    }


    //qq redirect uri
    async qqAction(){
        return this.display('home/qqlogin')
    }
};