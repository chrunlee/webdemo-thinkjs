module.exports = [
    {
        cron : '* * * * *',
        handle : 'index/dingding',
        type : 'one',
        enable : true
    },{
        //每天定时清理日志
        cron : '0 0 * * *',
        handle : 'index/clearLog',
        type : 'one',
        enable : true
    }
]