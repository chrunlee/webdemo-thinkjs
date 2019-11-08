//登录网易云音乐 获取数据
let axios = require('axios');
let path = require('path');
let url = require('url');
function format(  size, pointLength, units ){
    var unit;
    units = units || [ 'B', 'KB', 'M', 'G', 'TB' ];

    while ( (unit = units.shift()) && size > 1024 ) {
        size = size / 1024;
    }
    return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) + unit;
}
class music {
    constructor (api,phone,password){
        this.api = api;
        this.phone = phone;
        this.password = password;
        this.loginUrl = '/login/cellphone';

        return this;
    }
    //登录获取cookie
    login (){
        return axios.get(`${this.api}/login/cellphone?phone=${this.phone}&password=${this.password}`).then(rs=>{
            let cookie = rs.headers['set-cookie'];
            return cookie[0]+cookie[1];
        });
    }
    //根据ID获取歌曲的名字和基本信息
    getMusicDetail (cookie/**cookie存在其他地方*/,ids/**数组或字符串逗号隔开*/){
        ids = typeof ids == Array ? ids.join(',') : ids;
        return axios.get(`${this.api}/song/detail?ids=${ids}`,{headers : {cookie : cookie}}).then(rs=>{
            let data = rs.data;
            return data.songs.map(item=>{
                return {
                    id : item.id,name : item.name
                }
            });   
        });
    }
    //根据ID获取多个歌曲的url地址信息
    getMusicUrl(cookie,ids){
        ids = typeof ids == Array ? ids.join(',') : ids;
        return axios.get(`${this.api}/song/url?id=${ids}`,{headers : {cookie : cookie}}).then(rs=>{
            let data = rs.data;
            return data.data;
        });
    }
    //获取某个歌单的详情数据，内含多个歌曲URL和详细信息
    getPlayListDetail (cookie,id){
        return axios.get(`${this.api}/playlist/detail?id=${id}`,{headers : {cookie : cookie}})
        .then(rs=>{
            let data = rs.data;
            //处理data获取ID，根据ID获取url，然后组合
            return {
                name : data.playlist.name,
                list : data.playlist.trackIds
            };
        })
    }

    getMvDetail(cookie,id){
        return axios.get(`${this.api}/mv/detail?mvid=${id}`,{headers : {cookie : cookie}})
        .then(rs=>{
            return rs.data;
        })
    }
    getMvUrl (cookie,id){
        return axios.get(`${this.api}/mv/url?id=${id}`,{headers : {cookie : cookie}})
        .then(rs=>{
            return rs.data;
        })
    }
    //获得视频的数据
    async getMv(cookie,id){
        let detail = await this.getMvDetail(cookie,id);
        var name = detail.data.name;
        let urlrs = await this.getMvUrl(cookie,id);
        let urls = urlrs.data.url;
        let size = urlrs.data.size;
        return {
            id : id,
            name : name+path.extname(url.parse(urls||'').pathname||''),
            url : urls,
            size : format(size),
            success : urls == null ? false : true
        }
    }


    getVideoDetail(cookie,id){
        return axios.get(`${this.api}/video/detail?id=${id}`,{headers : {cookie : cookie}})
        .then(rs=>{
            return rs.data;
        })
    }
    getVideoUrl (cookie,id){
        return axios.get(`${this.api}/video/url?id=${id}`,{headers : {cookie : cookie}})
        .then(rs=>{
            return rs.data;
        })
    }
    //获得视频的数据
    async getVideo(cookie,id){
        let detail = await this.getVideoDetail(cookie,id);
        var name = detail.data.title;
        let urlrs = await this.getVideoUrl(cookie,id);
        let urls = urlrs.urls[0].url;
        let size = urlrs.urls[0].size;
        return {
            id : id,
            name : name+path.extname(url.parse(urls||'').pathname||''),
            url : urls,
            size : format(size),
            success : urls == null ? false : true
        }
    }
    //单曲
    async getSingle (cookie,id){
        let detail = await this.getMusicDetail(cookie,id);
        let ids = detail[0].id;
        let urldetail = await this.getMusicUrl(cookie,ids);
        return {
            id : detail[0].id,
            name : detail[0].name+path.extname(url.parse(urldetail[0].url||'').pathname||''),
            url : urldetail[0].url,
            size : format(urldetail[0].size),
            success : urldetail[0].url == null ? false : true
        }
    }
    //歌单
    async getList(cookie,id){
        let playlist = await this.getPlayListDetail(cookie,id);
        let ids = playlist.list.map(item=>item.id);
        let detailList = await this.getMusicDetail(cookie,ids);
        let urlList = await this.getMusicUrl(cookie,ids);
        //组装数据
        let detailMap = {};
        detailList.forEach(item=>{
            detailMap[item.id] = item;
        })
        let urlMap = {};
        urlList.forEach(item=>{
            urlMap[item.id] = item;
        })
        let rs = ids.map(tempId=>{
            let de = detailMap[tempId];
            let ur = urlMap[tempId];
            return {
                id : tempId,
                name : de.name+path.extname(url.parse(ur.url==null||ur.url == undefined ? '' : ur.url.toString()).pathname||''),
                url : ur.url,
                size : format(ur.size),
                success : ur.url == null  ? false : true
            }
        });
        return {
            name : playlist.name,
            list : rs
        };
    }
}
module.exports = music;