module.exports = [
    {
        cron : '* * * * *',
        handle : 'crontab/dingding',
        type : 'one',
        enable : true
    },{
        //每天定时清理日志
        cron : '0 0 * * *',
        handle : 'crontab/clearLog',
        type : 'one',
        enable : true
    },{
        //每隔5分钟推送下新型肺炎情况
        cron : '*/5 * * * *',
        handle : 'crontab/feiyan',
        type : 'one',
        enable : true
    }
]