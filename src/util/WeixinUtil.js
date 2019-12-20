/****
 微信开发相关的工具类;通用;thinkjs框架;
 @author chrunlee
 @create 2019年11月19日 16:30:59
*****/
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');//token 文件存储
const path = require('path');
const filePath = path.join(__dirname,'../../runtime/config/wx.json');
const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const wsf = require('./wsf');


module.exports = class WeixinUtil{

    /***
        传参:token/appid/appsecret,创建实例
        opts : {
            token : '',
            appid : '',
            secret : ''
        }
    ***/
    constructor(opts){
        this.opts = opts;
        this.url = {
            access_token : `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${opts.appid}&secret=${opts.secret}`,
            create_menu : `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=ACCESS_TOKEN`,
            send_template : `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=ACCESS_TOKEN`,
            upload_media : `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=ACCESS_TOKEN&type=TYPE`,
            download_media : `https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID`,
            user_info : `https://api.weixin.qq.com/cgi-bin/user/info?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN`,
            short_url : `https://api.weixin.qq.com/cgi-bin/shorturl?access_token=ACCESS_TOKEN`
        };
    }

    //=========================access_token===============================


    //校验token
    validateToken(signature,timestamp,nonce){
        return crypto.createHash('sha1').update([this.opts.token,timestamp,nonce].sort().join('')).digest('hex') == signature;
    }

    //获取access_token ,存放在缓存中
    async getToken(){
        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath,'{}');
        }
        let current = fs.readFileSync(filePath);
        current = JSON.parse(current);
        if(!current || !current.access_token || current.timestamp < +new Date()){
            //refresh
            let data = await axios.get(this.url.access_token).then(rs=>rs.data);
            data.timestamp = (+new Date() + data.expires_in*1000);
            current = data;
            fs.writeFileSync(filePath,JSON.stringify(current));
        }
        console.log(current);
        return current;
    }
    //创建公众号菜单
    async createMenu(menuObj){
        let token = await this.getToken();
        let rst = await axios.post(this.url.create_menu.replace('ACCESS_TOKEN',token.access_token),menuObj).then(rs=>rs.data);
        return rst.errcode == 0;
    }

    //===============================消息================================


    //处理微信发送的xml数据，整理成对象
    fixData (post){
        let obj = {};
        for(let key in post.xml){
            obj[key] = post.xml[key][0];
        }
        return obj;
    }

    //创建文本xml
    createText(data,content){
        return  `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${content}]]></Content>
            </xml>
        `;
    }
    //创建图片xml
    createImage (data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[image]]></MsgType>
              <Image>
                <MediaId><![CDATA[${url}]]></MediaId>
              </Image>
            </xml>
        `;
    }

    //创建图片xml
    createVoice (data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[voice]]></MsgType>
              <Voice>
                <MediaId><![CDATA[${url}]]></MediaId>
              </Voice>
            </xml>
        `;
    }

    //创建图片xml
    createVideo (data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[video]]></MsgType>
              <Video>
                <MediaId><![CDATA[${url}]]></MediaId>
                <Title><![CDATA[title]]></Title>
                <Description><![CDATA[description]]></Description>
              </Video>
            </xml>
        `;
    }

    //创建音乐消息
    createMusic(data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[music]]></MsgType>
              <Music>
                <Title><![CDATA[TITLE]]></Title>
                <Description><![CDATA[DESCRIPTION]]></Description>
                <MusicUrl><![CDATA[${url}]]></MusicUrl>
                <HQMusicUrl><![CDATA[${url}]]></HQMusicUrl>
                <ThumbMediaId><![CDATA[media_id]]></ThumbMediaId>
              </Music>
            </xml>
        `;
    }



    //发送莫把那些iaoxi
    async sendTemplate (data){
        let token = await this.getToken();
        let rst = await axios.post(this.url.send_template.replace('ACCESS_TOKEN',token.access_token),data).then(rs=>rs.data);
        return rst.msgid;//返回消息ID
    }

    //==========================素材==================================

    //上传
    upload(url,filePath,stat){
        return new Promise((resolve,reject)=>{
            request({
                url:url,
                method:'POST',
                formData:{
                    media : fs.createReadStream(filePath)
                },
                json:true
            }).then(function(response){
                var _data = response.body;
                if(_data){
                    resolve(_data)
                }else{
                    throw new Error('upload material failed!');
                }
            }).catch(function(err){
                reject(err);
            });
        });
        
    }
    //上传本地文件到微信服务器作为临时素材，获取Media_id
    async uploadMedia (type,filePath){
        let types = {
            'image' : {
                limit : 2 * 1024 * 1024,
                ext : ',.png,.jpeg,.jpg,.gif,'
            },
            'voice' : {
                limit : 2 * 1024 * 1024,
                ext : ',.amr,.mp3,'
            },
            'video' : {
                limit : 10 * 1024 * 1024,
                ext : ',.mp4,'
            },
            'thumb' : {
                limit : 64 * 1024,
                ext : ',.jpg,'
            }
        };
        if(!types[type]){
            throw new Error('素材类型不支持');
        }
        if(!fs.existsSync(filePath)){
            throw new Error('文件路径不正确');
        }       
        let extname = path.extname(filePath).toLowerCase();
        let typeObj = types[type];
        if(typeObj.ext.indexOf(extname) < 0){
            throw new Error('文件类型不支持')
        }
        let stat = fs.statSync(filePath);
        if(stat.size > typeObj.limit){
            throw new Error('文件大小超出限制')
        }
        let token = await this.getToken();
        let url = this.url.upload_media.replace('ACCESS_TOKEN',token.access_token).replace('TYPE',type);
        let rsr = await this.upload(url,filePath,stat);
        return rsr.media_id;
    }

    /****
        根据mediaId下载临时素材：图片
    ***/
    async downloadImage(mediaId,folderPath){
        let token = await this.getToken();
        let url = this.url.download_media.replace('ACCESS_TOKEN',token.access_token).replace('MEDIA_ID',mediaId);
        let realPath = await axios.get(url,{
            responseType : 'stream'
        }).then(async rs=>{
            let disposition = rs.headers['content-disposition'];
            let fileName = disposition.match(/filename="(.*)"/)[1];
            let filePath = path.join(folderPath,fileName);
            let ws = fs.createWriteStream(filePath);
            await wsf(ws,rs.data);
            return filePath;
        })
        return realPath;
    }
    //下载临时素材：视频文件
    async downloadVideo(mediaId){
        let token = await this.getToken();
        let url = this.url.download_media.replace('ACCESS_TOKEN',token.access_token).replace('MEDIA_ID',mediaId);
        let realPath = await axios.get(url).then(rs=>rs.data.video_url);
        return realPath;
    }


    //=======================用户信息========================

    //根据openId获得用户基本信息
    async getUserInfo(openId){
        let token = await this.getToken();
        let url = this.url.user_info.replace('ACCESS_TOKEN',token.access_token).replace('OPENID',openId);
        let data = await axios.get(url).then(rs=>rs.data);
        console.log(data);
        return data;
    }

    //长链接转短链接
    async getShortUrl(url){
        let token = await this.getToken();
        let qurl = this.url.short_url.replace('ACCESS_TOKEN',token.access_token);
        let data = await axios.post(qurl,{
            action : 'long2short',
            'long_url' : url
        }).then(rs=>rs.data);
        return data.short_url;
    }
}