//工具类相关的页面处理
const Base = require('./base.js');
const axios = require('axios');
const {URL} = require('url');
const music163 = require('../util/music163');

module.exports = class extends Base {
    //微信dat转码页面
    async wechatdatAction() {
        this.assign({
            site : this.config('site')
        })
        return this.display('tool/wechatdat');
    }
    //跳转到网易云音乐
    async music163Action(){
        this.assign('site',this.config('site'))
        //检查code
        let code = await this.session('netmusiccode');
        let isFirst = await this.session('netmusicfirst')||1;
        if( (code == null || code == undefined || code == '') && isFirst >= 3){
            //无code
            let codestr = this.post('code')||'';
            //check code
            let codeObj = await this.model('user_code').where({code : codestr.trim(),type : 'netmusic'}).find();
            if(think.isEmpty(codeObj)){
                this.assign('code',false);
                this.assign('msg','当前校验码无效，请重新填写或联系站长!')
                this.assign('success',false);
                return this.display('tool/netmusic');
            }
            await this.session('netmusiccode',codeObj.code);
            this.assign('codestr',codeObj.code);
        }
        if(isFirst < 3){
            console.log('当前为试用状态'+isFirst)
            this.assign('codestr','shiyong');
            this.assign('success',true);
            this.assign('msg','');
        }else{
            this.assign('codestr',code);
        }
        if(this.isPost){
            let urlstr = this.post('url');
            try{
                if(urlstr){
                    //分析url
                    let type = -1;//0 单曲，1 歌单，2 MV
                    let urlObj = new URL(urlstr);
                    let id = urlObj.searchParams.get('id')||'';
                    if(!id){
                        this.assign({success : false,msg : 'url地址不符合规范，无法获取ID数据'})
                    }else{
                        if(urlObj.pathname.indexOf('song') > -1){
                            type = 0;
                        }else if(urlObj.pathname.indexOf('playlist') > -1){
                            type = 1;
                        }else if(urlObj.pathname.indexOf('video') > -1){
                            type = 2;
                        }
                        if(type >= 0){
                            //单首，直接获取数据和url
                            let musicObj = new music163(this.config('site').netmusicapi.value,this.config('site').netmusicphone.value,this.config('site').netmusicpwd.value);
                            let cookie = this.config('netmusiccookie');
                            if(think.isEmpty(cookie)){
                                cookie =await musicObj.login();
                                this.config('netmusiccookie',cookie);
                            }
                            if(isFirst < 3 && type > 0){
                                this.assign({success : false,msg : '试用下不支持歌单和视频'})
                            }else{
                                if(type == 0){
                                    let detail = await musicObj.getSingle(cookie,id);
                                    this.assign('list',[detail]);
                                }else if(type == 1){
                                    let list = await musicObj.getList(cookie,id);
                                    this.assign(list);
                                    this.assign('playlist',true);
                                }else if(type == 2){
                                    let rs = await musicObj.getMV(cookie,id);
                                    this.assign('list',[rs]);
                                }
                                if(isFirst < 3){
                                    isFirst +=1;
                                    await this.session('netmusicfirst',isFirst);
                                }
                            }
                        }else{
                            this.assign({success : false,msg : '无法解析地址或地址不规范，目前只支持:单首/歌单/视频。'})
                        }
                    }
                }else{
                    this.assign({success : true,msg : 'url不能为空'})
                }
            }catch(e){
                console.log(e);
                this.assign({success : false,msg : '网易云API解析服务器无法链接!'})
            }
            this.assign('url',urlstr);
            return this.display('tool/netmusic');

        }else{
            return this.display('tool/netmusic');    
        }
        
    }
    
}