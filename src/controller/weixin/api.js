/***
 微信公众号对接
 1. 相关的页面；
 2. 相关的校验及配置；
 3. 数据接口
****/
const Base = require('./wx');
const path = require('path');

module.exports = class extends Base {

    //token校验/消息接受回复/
    async indexAction(){
        if(this.isPost){
            let content = this.post();
            let domain = this.config('site').domain.value;
            //判断什么类型的消息
            let openId = content.FromUserName;
            if(content.MsgType === 'text'){
                let arr = content.Content.split(' ');
                let parr = [];
                arr.forEach(v=>{
                    if(null != v && v.trim() != '')parr.push(v.trim());
                })
                if(content.Content.indexOf('故事') > -1){//
                    let story = null;
                    if(parr.length > 1){
                        let keys = parr.splice(1,parr.length-1);
                        //检查类别
                        let item = keys[0];
                        let count = await this.model('wx_story').where({type : ['like','%'+item+'%']}).count();
                        if(count > 0){
                            //继续查看是否有关键词
                            let w = {type : ['like','%'+item+'%']};
                            if(keys.length > 1){
                                w['name'] = ['like','%'+keys[1]+'%'];
                            }
                            story = await this.model('wx_story').where(w).field('id,name,type').order('rand() ').find();
                        }else{
                            story = await this.model('wx_story').where({name : ['like','%'+item+'%']}).field('id,name,type').order('rand()').find();
                            
                        }
                    }else{
                        let p = Math.round(Math.random()* 1000);
                        let m = Math.round(Math.random()* 1000);
                        let n = Math.round(Math.random()* 1000);
                        story = await this.model('wx_story').field('id,name,type').where({id : ['like',['%'+p+'%','%'+m+'%','%'+n+'%']]}).limit(0,1).find();
                    }
                    if(think.isEmpty(story)){
                        return this.body = this.wx.createText(content,`小采然没有检索到<${content.Content}>相关的小故事!请尝试其他关键词...`)
                    }else{
                        return this.body = this.wx.createText(content,`小采然给您找到了一个小故事,<a href="${domain}/weixin/story/detail?id=${story.id}">${story.type}-${story.name}</a>`)
                    }
                }else if(content.Content.indexOf('音乐') > -1){
                    let music = null;
                    if(parr.length == 1){
                        let a = Math.round(Math.random()*1000)//1000以内三位数
                        let b = Math.round(Math.random()*1000)//1000以内三位数
                        let c = Math.round(Math.random()*1000)//1000以内三位数
                        music = await this.model('music_music').where({sid : ['like',['%'+a+'%','%'+b+'%','%'+c+'%']]}).field('sid,artist,title').limit(0,1).find();
                    }else if(parr.length > 1){
                        music = await this.model('music_music').where({'title|artist' : ['like','%'+parr[1]+'%']}).field('sid,artist,title').order('rand()').limit(0,1).find();
                    }
                    if(think.isEmpty(music)){
                        return this.body = this.wx.createText(content,`小采然没有检索到<${content.Content}>相关的音乐!请尝试其他关键词...`)
                    }else{
                        return this.body = this.wx.createText(content,`小采然给您找到了一首音乐,<a href="${domain}/weixin/music/detail?id=${music.sid}">${music.artist}-${music.title}</a>`)
                    }
                }else if(content.Content.indexOf('图片') > -1){
                    return this.body = this.wx.createText(content,`图片资源正在搜集中....`)
                }else if(content.Content.indexOf('电影') > -1){
                    let magnet = null;
                    //TODO : 优化数据或全文检索。
                    // if(parr.length < 1){
                    //     return this.body = this.wx.createText(content,`电影检索请提供关键字....`)    
                    // }else{
                    //     magnet = await this.model('demo_magnet').where({name : ['like','%'+parr[1]+'%']}).order('rand()').limit(0,1).find();
                    // }
                    // if(think.isEmpty(magnet)){
                    //     return this.body = this.wx.createText(content,`小采然没有检索到<${content.Content}>相关的电影!请尝试其他关键字....`)    
                    // }else{
                    //     return this.body = this.wx.createText(content,`小采然给您找到了一部电影,<a href="${domain}/weixin/move/detail?id=${magnet.id}">${magnet.name}</a>`)
                    // }
                    return this.body = this.wx.createText(content,`电影资源正在搜集中....`)
                }else if(content.Content.indexOf('诗词') > -1){
                    return this.body = this.wx.createText(content,`诗词资源正在搜集中....`)
                }else if(content.Content.indexOf('歇后语') > -1){
                    let xiehouyu = null;
                    if(parr.length == 1){
                        let a = Math.round(Math.random()*100);
                        let b = Math.round(Math.random()*100);
                        let c = Math.round(Math.random()*100);
                        let list = await this.model('wx_xiehouyu').where({id : ['like',['%'+a+'%','%'+b+'%','%'+c+'%']]}).select();
                        xiehouyu = list[Math.floor(Math.random()*list.length)];
                    }else{
                        let key = parr[1];
                        xiehouyu = await this.model('wx_xiehouyu').where({name : key}).find();
                        if(think.isEmpty(xiehouyu)){
                            let list = await this.model('wx_xiehouyu').where({name : ['like','%'+key+'%']}).select();
                            if(list.length > 0){
                                xiehouyu = list[Math.floor(Math.random()*list.length)];
                            }
                        }
                    }
                    if(think.isEmpty(xiehouyu)){
                        return this.body = this.wx.createText(content,`小采然没有检索到<${content.Content}>相关的歇后语！请尝试其他关键字....`)
                    }else{
                        return this.body = this.wx.createText(content,`歇后语:${parr[1] || ''}\r\n${xiehouyu.name}\r\n${xiehouyu.answer}`)    
                    }
                }else if(content.Content.indexOf('成语') > -1){
                    let chengyu = null;
                    if(parr.length > 1){
                        let key = parr[1];
                        chengyu = await this.model('wx_chengyu').where({name : key}).find();
                    }
                    if(think.isEmpty(chengyu)){
                        return this.body = this.wx.createText(content,`小采然没有检索到<${content.Content}>相关的成语!请尝试其他关键字....`)
                    }else{
                        let story = await this.model('wx_story').where({name : chengyu.name,type : '成语故事'}).find();
                        let str = `您要找的成语是<a href="${domain}/weixin/chengyu/detail?id=${chengyu.id}">${chengyu.name}</a>,点击查看释义`;
                        if(!think.isEmpty(story)){
                            str += `,与它相关的小故事<a href="${domain}/weixin/story/detail?id=${story.id}">成语故事-${story.name}</a>`;
                        }
                        return this.body = this.wx.createText(content,str);
                    }
                    
                }else if(content.Content.indexOf('接龙') > -1){
                    let chengyu = null;
                    if(parr.length > 1){
                        let key = parr[1];
                        let first = key.trim().split('').reverse().splice(0,1);
                        chengyu = await this.model('wx_chengyu').where({name : ['like',first+'%']}).find();
                    }
                    if(think.isEmpty(chengyu)){
                        return this.body = this.wx.createText(content,`小采然接不上来了...求放过`)
                    }else{
                        return this.body = this.wx.createText(content,`接龙 ${chengyu.name}`);
                    }
                }else if(content.Content.indexOf('秘籍') > -1){
                    return this.body = this.wx.createText(content,`公众号玩法秘籍:
 故事系列:
   回复"故事" : 给您随机推荐一个小故事. 
   回复"故事 睡前" : 给您随机推荐一个睡前小故事.
   回复"故事 睡前 小矮人" : 给您推荐睡前故事中有小矮人的故事.
 音乐系列:
   回复"音乐" : 给您随机推荐一首音乐.
 成语系列:
   回复"成语 一石二鸟":给您回复关于一石二鸟的释义.
 接龙系列:
   回复"接龙 一石二鸟":给您回复关于一石二鸟的成语接龙.
`);
                }
            }else if(content.MsgType === 'image'){
                think.logger.info('图片消息')
            }else if(content.MsgType === 'voice'){
                think.logger.info('语音消息')
            }else if(content.MsgType === 'video'){
                think.logger.info('视频消息')
            }else if(content.MsgType === 'shortvideo'){
                think.logger.info('小视频消息')
            }else if(content.MsgType === 'location'){
                think.logger.info('地理位置消息')
            }else if(content.MsgType === 'link'){
                think.logger.info('链接消息')
            }else if(content.MsgType === 'event'){
                think.logger.info('事件消息')
                let eventType = content.Event;
                if(eventType === 'subscribe'){
                    think.logger.info('关注公众号')
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
                    return this.body = this.wx.createText(content,'谢谢您的关注!\r\n回复:秘籍\r\n更多惊喜等你开启....')
                }else if(eventType === 'unsubscribe'){
                    think.logger.info('取消关注')
                }else if(eventType === 'TEMPLATESENDJOBFINISH'){
                    think.logger.info('模版消息发送后的反馈');
                }else if(eventType){
                    think.logger.info(eventType);
                }
            }
            return this.body =this.wx.createText(content,'谢谢关注哦，更多玩法请回复:秘籍');
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
                    name : '故事系列',
                    url : 'http://weixin.byyui.com/weixin/story/index'
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