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
        think.logger.info(`[登录]-[github]${this.ip}登录github用户:${user.name}`)
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
        await this.session('admin',null);
        return this.redirect('/');
    }


    //qq redirect uri
    async qqAction(){
        let qq = think.service('qq',{
            appId : this.config('site').qqappid.value,
            appSecret : this.config('site').qqappkey.value
        });
        let code = this.query('code');
        let redirect = this.config('site').domain.value;
        let redirectUrl = redirect+'/login/qq';
        let userInfo = await qq.login(code,redirectUrl);
        //如果获取信息正常则允许登录，否则登录失败
        try{
            if(userInfo && userInfo.ret > -1 && userInfo.nickname){
                //检查
                let qquser = await this.model('sys_user').where({id : userInfo.openId,from : 'qq'}).find();
                if(think.isEmpty(qquser)){
                    qquser = {
                        id : userInfo.openId,
                        name : userInfo.nickname,
                        avatar : userInfo.figureurl_qq_1,
                        from : 'qq',
                        status : '1'
                    }
                    await this.model('sys_user').add(qquser);
                }
                //存储用户session
                await this.session('user',qquser);
                return this.redirect('/');
            }
        }catch(e){
            console.log(e);
            think.logger.error(e);
        }
        return this.display('home/qqlogin')
    }
    async qqloginAction(){
        //跳转
        let qq = think.service('qq',{
            appId : this.config('site').qqappid.value,
            appSecret : this.config('site').qqappkey.value
        });
        let redirectUrl = qq.getAuthUrl(this.config('site').domain.value);
        return this.redirect(redirectUrl);
    }
};