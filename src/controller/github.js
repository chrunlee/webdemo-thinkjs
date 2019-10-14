const Base = require('./base.js');
const superagent = require('superagent');

module.exports = class extends Base {
    //github 授权登录
    async indexAction() {
        let code = this.query('code');
        let state = this.query('state');
        let site = this.config('site');
        var redirectURL = await this.session('loginRefer');
        let user = await superagent.post('https://github.com/login/oauth/access_token')
            .set('Accept', 'application/json')
            .send({
                "client_id": site.githubclientid.value,
                "client_secret": site.githubsecret.value,
                "code": code,
                "state": state
            })
            .then(function(res2) {
                return JSON.parse(res2.text);
            })
            .then(function(obj) {
                return superagent.get('https://api.github.com/user?access_token=' + obj.access_token).set('User-Agent', 'chrunleeAutoLogin');
            })
            .then(function(res2) {
                return JSON.parse(res2.text);
            });
        let sysUser = await this.model('sys_user').where({ id: user.id }).find();
        if (this.isEmpty(sysUser)) {
            await this.model('sys_user').where({ id: sysUser.id }).update(user);
        } else {
            await this.model('sys_user').add(sysUser);
        }
        await this.session('github', sysUser);
        return this.redirect(redirectURL);

    }

    async loginAction() {
        //获取clientId进行重定向
        let site = this.config('site');
        var redirectURL = this.referer();
        var state = (new Date()).valueOf();
        await this.session('loginRefer', redirectURL);
        var url = `https://github.com/login/oauth/authorize?client_id=${site.githubclientid.value}&scope=${site.githubscope.value}&state=${state}`;
        this.redirect(url);
    }
    //自动登录
    async autoAction() {
        let id = this.ctx.post('id');
        if (think.isEmpty(id)) {
            this.ctx.json({ success: false });
        } else {
            let user = await this.model('sys_user').where({ id: id }).find();
            if (think.isEmpty(user)) {
                this.ctx.json({ success: false })
            } else {
                //更新session
                this.session('github', user);
                this.ctx.json({ success: true })
            }
        }
    }
};