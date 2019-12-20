/***
 微信公众号对接
 1. 相关的页面；
 2. 相关的校验及配置；
 3. 数据接口
****/
const Base = require('./base');
const Weixin = require('../util/WeixinUtil');
const path = require('path');

module.exports = class extends Base {

    __before(){
        let wxtoken = this.config('site').wxtoken.value;
        let wxappid = this.config('site').wxappid.value;
        let wxsecret = this.config('site').wxappsecret.value;
        this.wx = new Weixin({
            token : wxtoken,
            appid : wxappid,
            secret : wxsecret
        });
    }

    //token校验/消息接受回复/
    async indexAction(){
        if(this.isPost){
            console.log(this.post())
            let content = this.wx.fixData(this.post());//接受消息
            //判断什么类型的消息
            console.log(content);
            let openId = content.FromUserName;
            if(content.MsgType === 'text'){
                console.log('文本消息')
            }else if(content.MsgType === 'image'){
                console.log('图片消息')
            }else if(content.MsgType === 'voice'){
                console.log('语音消息')
            }else if(content.MsgType === 'video'){
                console.log('视频消息')
            }else if(content.MsgType === 'shortvideo'){
                console.log('小视频消息')
            }else if(content.MsgType === 'location'){
                console.log('地理位置消息')
            }else if(content.MsgType === 'link'){
                console.log('链接消息')
            }else if(content.MsgType === 'event'){
                console.log('事件消息')
                let eventType = content.Event;
                if(eventType === 'subscribe'){
                    console.log('关注公众号')
                    //业务:关注后获取信息，进行保存或更新用户记录
                    let data = await this.wx.getUserInfo(openId);
                    let user = await this.model('sys_user').where({id : openId}).find();
                    if(think.isEmpty(user)){
                        //新增
                        user = {
                            id : openId,
                            name : data.nickname,
                            avatar : data.headimgurl,
                            from : 'wechat',
                            json : JSON.stringify(data)
                        }
                        await this.model('sys_user').add(user);
                    }
                    return this.body = this.wx.createText(content,'谢谢您的关注!\r\n回复:诗词，可以查看骚人墨客的经典诗词!\r\n回复:故事，有大量的睡前故事等着你!')
                }else if(eventType === 'unsubscribe'){
                    console.log('取消关注')
                }else if(eventType === 'TEMPLATESENDJOBFINISH'){
                    console.log('模版消息发送后的反馈');
                }else if(eventType){
                    console.log(eventType);
                }
            }
            return this.body =this.wx.createText(content,'你好啊，i am server 007');
        }else{
            // let token = await this.wx.getToken(this);
            let signature = this.query('signature');
            let echostr = this.query('echostr');
            let timestamp = this.query('timestamp');
            let nonce = this.query('nonce');
            if(this.wx.validateToken(...[signature,timestamp,nonce])){
                return this.body = echostr;    
            }
            return this.body = '';
        }
    }


    //创建菜单
    async menuAction(){
        let menu = {
            button : [
                {
                    type : 'view',
                    name : '睡前故事',
                    url : 'https://chrunlee.cn/wechat/story_index'
                }
            ]
        };
        let rs = await this.wx.createMenu(menu)
        return this.body = rs ? '菜单创建成功' : '菜单创建失败,请检查配置!';
    }

    //Test : 发送模版消息给我自己
    async sendTemplateAction(){
        let data = {
            touser : 'ouvrPvsyvLk5l0iR9RC4mUnX2uOo',
            template_id : '_2BZzlHvWolkoDhmufjMGGoQkL5YEGsVsHBtO6Pbxig',
            url : 'https://chrunlee.cn',
            data : {
                first : {
                    value : '封神之战开启了',
                    color : '#ffff000'
                },
                keyword1 : {
                    value : '蚩尤',
                    color : '#ff6600'
                },
                keyword2 : {
                    value : '共工',
                    color : '#25ca92'
                },
                keyword3 : {
                    value : '孙悟空',
                    color : '#4499ee'
                },
                remark : {
                    value : '请尽快进入战场，展示你惊人的战力吧！',
                    color : '#4499ee'
                }
            }
        };
        let msgid = await this.wx.sendTemplate(data);
        console.log(msgid);
        return this.body = '发送成功'
    }
    //测试上传媒体素材
    async uploadMediaAction (){
        let filePath = path.join(think.ROOT_PATH,'www/static/upload/tmp/aaa.mp4');
        let mediaId = await this.wx.uploadMedia('video',filePath);
        return this.body = '上传完毕：'+mediaId;
    }
    //测试下载媒体素材
    async downloadMediaAction(){
         let id = 'DmGBrlRup5ofHkTKsyYZOHpZoLqAVfIj3nXvWgP_56atRCIwOF-CqgdnkJ9lHmQb';
         let filePath = await this.wx.downloadVideo(id);
         return this.body = 'download suc:'+filePath;
    }

    //场链接转短链接测试
    async getShortAction(){
         let url = 'http://chrunlee.cn/article/abclslslslslslslsls.html';
         let short = await this.wx.getShortUrl(url);
         return this.body = 'short url : '+short;
    }






    //=============================Bussiness=================

    async story_indexAction(){
        console.log('income')
        return this.display("wechat/story/index");
    }
}