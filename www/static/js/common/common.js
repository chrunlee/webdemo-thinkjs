//通用函数或工具
byy.define(['jquery','win','store'],function(exports){
	var common = {
		//弹窗登录
		/**/
		login : function(){	
			var html = '<script defer src="https://connect.qq.com/qc_jssdk.js" type="text/javascript" data-appid="101817572" data-redirecturi="http://weixin.byyui.com/qqlogin" ></script><div class="login-div"><p>登录</p><p><img id="QQLOGIN" onclick="QC.Login.showPopup({appId : \'101817572\',redirectURI :\'http://weixin.byyui.com/qqlogin\'})" style="margin-right:30px;" src="/static/images/login-qq.png" /><img onclick="window.location.href=\'/login/githubLogin\'" src="/static/images/login-logo.png" /></p><span>QQ 登录 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; github 登录</span></div>';
			if(!LoginUser){
				byy.win.open({
					type : '1',
					title : false,
					shadeClose : true,
					content : html,
					area : [400,500],
					success : function(){
						setTimeout(function(){
							QC.Login({
								btnId : 'QQLOGIN'
							});
						},1000)
						
					}
				});
			}
		}
	};
	exports('common',common);
})