//获取齐云代理的数据
let cheerio = require('cheerio');
let axios = require('axios');

let getHtml = function(pageIndex){
    let url = `http://www.qydaili.com/free/?action=china&page=${pageIndex}` ;
    return axios.get(url)
    .then(rs=>{return rs.data});
}

let getTable = function(html){

    let $ = cheerio.load(html);
    let $container = $('.container');
    let $trs = $container.find('tbody tr');
    let arr = [];
    $trs.each((i,item)=>{
        let ip = $(item).find('td[data-title="IP"]').text().replace('IP','');
        let port = $(item).find('td[data-title="PORT"]').text().replace('PORT','');
        let type = $(item).find('td[data-title="类型"]').text().replace('类型','');
        arr.push({
            ip : ip,
            port : port,
            scheme : type.toLowerCase(),
            isHttps : type == 'HTTPS' ? true : false,
            str : ip+':'+port
        });
    })
    return arr;
}


module.exports = async function(pagesize){
    let html = await getHtml(pagesize);
    let arr = getTable(html);
    return arr;
}