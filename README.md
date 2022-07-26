# BossASTDecode
Boss控制流反混淆


 
1、boss_ast.js下载到放入到文件夹内，在文件夹下新建一个code.js,将需要反混淆的文件放入到code.js中,反混淆之后会生成反混淆后的文件-> decode.js ==> 代码没有被压缩，放在本地调试


2、执行compact_ast.js文件生成replace_code.js文件，replace_code.js是在fiddler中进行替换使用的，代码被压缩防止检测代码被格式化


具体逆向流程可以查看[公众号文章](http://mp.weixin.qq.com/s?__biz=MzU5NDc4NDcxNQ==&mid=2247484112&idx=1&sn=128be4f451677c61a52bcb8c37f65110&chksm=fe7aba74c90d33625d5ff9a5f690c06ddeddc286260185b06c0d424deaad609bbc3976b18dd7#rd "某聘__zp_stoken__分析")。
也可以直接关注公众号查看


![](https://files.mdnice.com/user/20236/61171f58-8486-492a-8b2e-73d22f1a5ed9.jpg)
