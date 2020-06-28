## 一、真机调试微信的方式

### 1.安卓手机调试，使用tbs studio
官方指引：[https://x5.tencent.com/tbs/guide/debug/season1.html](https://x5.tencent.com/tbs/guide/debug/season1.html)

但奇怪的是同事的mac不需要tbs客户端，直接连接也可以，只需要打开chrome的`chrome://inspect`就可以看到了，神奇。。。。

tbs的坑在于我完全按照官方的教程来，还是访问不了，结果查了半天资料，发现还得使用微信访问


### 2.ios手机调试
ios比较蛋疼。。。。目前没有官方的调试方法，只找到一个第三方的工具：[spy-debugger](https://github.com/wuchangming/spy-debugger)
这个是使用代理转发的方式进行调试，在公司的网络环境不知道为什么，会卡住无法查看修改dom元素。。。。额外的功能是可以进行移动端的抓包。。。。

## 二、chrome远程调试的坑。

今天使用tbs调试usb连接手机，结果chrome点击inspect弹出的窗口显示404。。。查了半天才发现原来是开发者工具会往两个域名去拉取依赖库，然而这两个域名
大陆被墙（连公司网络都访问不到）。。。。最后就查到了这个[解决方法](https://segmentfault.com/a/1190000011998580)，通过配置hosts的方式访问这两个域名。
同时也发现了这个工具网站: [http://ping.chinaz.com/](http://ping.chinaz.com/)，可以帮助查找可以ping通的ip节点，然后配置hosts访问。