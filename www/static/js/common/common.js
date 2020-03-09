//通用函数或工具
byy.define(['jquery','win','store'],function(exports){
	var common = {
		//弹窗登录
		/**/
		login : function(){	
			var html = '<div class="login-div"><p>登录</p><p><img id="QQLOGIN" style="margin-right:30px;" src="/static/images/login-qq.png" /><img id="GITHUB"  src="/static/images/login-logo.png" /></p><span>QQ 登录 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; github 登录</span></div>';
			if(!LoginUser){
				byy.win.open({
					type : '1',
					title : false,
					shadeClose : true,
					content : html,
					area : [400,500],
					success : function(){
						$('#QQLOGIN').on('click',function(){
							window.open(baseUrl+'/login/qqlogin');
						})		
						$('#GITHUB').on('click',function(){
							window.location.href='/login/githubLogin';
						})				
					}
				});
			}
		}
	};
	exports('common',common);
})