//工具类相关的页面处理
const Base = require('./base.js');
const axios = require('axios');
const { URL } = require('url');
const music163 = require('../util/music163');

const path = require('path');
const { compress,convertWebpJpg,getBaseStr } = require('../util/Image');
const fs = require('fs');

module.exports = class extends Base {
    //微信dat转码页面
    async wechatdatAction() {
        this.assign({
            site: this.config('site')
        })
        return this.display('tool/wechatdat');
    }
    //跳转到网易云音乐
    async music163Action() {
        this.assign('site', this.config('site'))
        //检查code
        let codestr = this.post('code') || '';
        let hasValid = false;
        if (codestr != null && codestr != '') {
            let codeObj = await this.model('user_code').where({ code: codestr.trim().toLowerCase(), type: 'netmusic' }).find();
            if (!think.isEmpty(codeObj)) {
                hasValid = true;
            }
        }
        this.assign('code', codestr); //返回元数据
        if (this.isPost) {
            let urlstr = this.post('url');
            try {
                if (urlstr) {
                    think.logger.info(`[工具]-[网易云]-${this.ip}检索${urlstr}`)
                    //分析url
                    let type = -1; //0 单曲，1 歌单，2 MV
                    let urlObj = new URL(urlstr);
                    let id = urlObj.searchParams.get('id') || '';
                    if (!id) {
                        this.assign({ success: false, msg: 'url地址不符合规范，无法获取ID数据' })
                    } else {
                        if (urlObj.pathname.indexOf('song') > -1) {
                            type = 0;
                        } else if (urlObj.pathname.indexOf('playlist') > -1) {
                            type = 1;
                        } else if (urlObj.pathname.indexOf('video') > -1) {
                            type = 2;
                        } else if (urlObj.pathname.indexOf('mv') > -1) {
                            type = 3;
                        }
                        if (type >= 0) {
                            //单首，直接获取数据和url
                            let musicObj = new music163(this.config('site').netmusicapi.value, this.config('site').netmusicphone.value, this.config('site').netmusicpwd.value);
                            let cookie = this.config('netmusiccookie');
                            if (think.isEmpty(cookie)) {
                                cookie = await musicObj.login();
                                this.config('netmusiccookie', cookie);
                            }
                            if (!hasValid && type > 0) {
                                this.assign({ success: false, msg: '注册码无效，试用下不支持歌单和视频' })
                            } else {
                                if (type == 0) {
                                    let detail = await musicObj.getSingle(cookie, id);
                                    this.assign('list', [detail]);
                                } else if (type == 1) {
                                    let list = await musicObj.getList(cookie, id);
                                    this.assign(list);
                                    this.assign('playlist', true);
                                } else if (type == 2) {
                                    let rs = await musicObj.getVideo(cookie, id);
                                    this.assign('list', [rs]);
                                } else if (type == 3) {
                                    let rs = await musicObj.getMv(cookie, id);
                                    this.assign('list', [rs]);
                                }
                            }
                        } else {
                            this.assign({ success: false, msg: '无法解析地址或地址不规范，目前只支持:单首/歌单/视频。' })
                        }
                    }
                } else {
                    this.assign({ success: true, msg: 'url不能为空' })
                }
            } catch (e) {
                think.logger.error(e);
                this.assign({ success: false, msg: '网易云API解析服务器无法链接!' })
            }
            this.assign('url', urlstr);
            return this.display('tool/netmusic');

        } else {
            return this.display('tool/netmusic');
        }

    }
    //webp 转其他格式图片
    async webpAction() {
        return this.display('tool/webp');
    }
    async webpCountAction(){
        let obj = await this.model('site_set').where({name : 'webpcount'}).find();
        let c = 0;
        if(!think.isEmpty(obj)){
            c = obj.intval;
        }
        think.logger.info(`[WEBP]-[页面]-${this.ip}`);
        return this.json({
            count : c,
            msg : '已为<span style="color:red;font-weigth:bold;">'+c+'</span>个webp文件提供转化服务'
        });
    }
    //webp 文件上传后进行转jpg 处理。
    async webpUploadAction() {
        let thiz = this;
        let file = thiz.file('file');
        //不能上传超过2M的文件。
        if (file.size > (2 * 1024 * 1024)) {
            fs.unlinkSync(file.path);
            return thiz.json({ success: false, msg: '数据不规范' });
        }
        if (file.type != 'image/webp') {
            fs.unlinkSync(file.path);
            return thiz.json({ success: false, msg: '数据不规范' });
        }
        let currentpath = path.join(path.dirname(file.path),(Math.random()*10000)+path.extname(file.path));
        fs.renameSync(file.path,currentpath);
        let targetpath = file.path+'.jpg';
        try {
            await convertWebpJpg(currentpath,targetpath);
            await compress(targetpath,70);
            let str = await getBaseStr(targetpath);
            if(fs.existsSync(currentpath)){
                fs.unlinkSync(currentpath);
            }
            if(fs.existsSync(targetpath)){
                fs.unlinkSync(targetpath);
            }
            await this.model('site_set').where({name : 'webpcount'}).increment('intval');
            return thiz.json({ success: true, base64 : str});
        } catch (e) {
            think.logger.error(e);
            if(fs.existsSync(currentpath)){
                fs.unlinkSync(currentpath);
            }
            if(fs.existsSync(targetpath)){
                fs.unlinkSync(targetpath);
            }
            return thiz.json({ success: false, msg: '文件转化失败' });
        }
        
    }
}