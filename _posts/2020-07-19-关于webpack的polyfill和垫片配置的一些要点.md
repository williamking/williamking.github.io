# 一、序言
最近给项目排查一些打包的问题，然后就牵扯到了webpack打包里的一些垫片的配置，查了不少文章，才逐渐理清里面的一些坑点，这里做一下记录。

# 二、什么是垫片(polyfill)
垫片其实就是为了在低版本浏览器里面支持新的标准api，而作的一些兼容实现代码。
目前我所知道的有两种垫片的实现方式：
* 直接在全局环境里面插入垫片，缺点是会污染全局环境
* 通过babel等编译工具替换代码里面的新api为局部polyfill的api模块，不污染全局。

## 1）全局环境插入垫片
最原始暴力的方法就是直接在html里面插入`polyfill`的脚本，但问题在于这样会新旧浏览器都引入了同样的代码，在新版的浏览器，可能部分的Polyfill是不必要的，此时就引入了多余的代码。

于是后面就有了通过浏览器版本动态引入，这里就要说到babel的插件`@babel/preset-env`了，这个原理其实就是基于`browserlist`的查询语法，来定位出需要垫片的接口，从而只引入这部分
的接口实现，关于`browserlist`的语法可以查看[这里](https://github.com/browserslist/browserslist)，这里可以查看语法对应的浏览器占比[https://browserl.ist/?q=defaults](https://browserl.ist/?q=defaults)，在`@babel/perset-env`出来之前，更多是手动引入`@babel/transform-xxx`的插件去进行编译转换兼容。

`browserlist`配置方式：
1） `package.json`配置:
```
{
  "browserslist": [
    "last 2 version",
    "> 5%",
    "not ie < 9"
  ]
}
```
2) 工程根目录添加`.browserlistsrc`文件：
```
last 2 version
> 5%
not ie < 9
```
3）直接在`@babel/preset-env`的options参数配置：
```
[
  '@babel/preset-env',
  {
    modules: false,
    targets: {
      browsers: ['last 2 versions', '> 5%', 'not ie < 9']
    },
    // include: [require.resolve('@babel/plugin-transform-spread')]
  }
]
```

通过babel编译的方式决定引入哪些垫片局限性在于仍然是在编译阶段决定引入的代码而不是运行时决定，如果需要运行时决定引入代码则需要`polyfill.io`的服务，这个
原理是基于浏览器的userAgent判断版本引入的垫片，但听说不太靠谱（国内一些浏览器内核经过定制不一定能通过userAgent判别）。。。

这里说明一下全局垫片通过`@babel/preset-env`插件引入的方式：

### 1.webpack打包全量引入
该方式的配置参数:
```
[
  '@babel/preset-env',
  {
    modules: false,
    targets: {
      browsers: ['last 2 versions', '> 5%', 'not ie < 9']
    },
    useBuiltIns: false
    // include: [require.resolve('@babel/plugin-transform-spread')]
  }
]
```
关键参数为`useBuiltIns`，默认参数为auto，设置为false代表babel只会转语法，但对于接口对象这些依赖不会引入垫片。
因此需要我们自己在打包的时候引入垫片，webpack的entry配置：
```
{
  entry: ['@babel/polyfill', 'src/index.js']
}
```
也可以在打包的入口文件添加import语句引入:
```
import '@babel/polyfill';
```
这里其实是将polyfill注入到了全局环境，因此像对`Promise`这项依赖不需要进行转译，直接浏览器全局环境就已经能获取到了，也就是污染了全局环境。

### 2.webpack打包局部引入
上面的方法其实是将垫片全量引入了，和script标签引入整个polyfill的垫片库是一样的，没有利用到`browserlist`的特性选择引入。
如果要开启这个功能，只需要在上面的基础上，将`useBuiltIns`改为'entry'即可。

举个例子，像`import @babel/polyfill`会根据`browserlist`编译成多个import的语句，保证只引入`browserlist`覆盖浏览器
的版本不支持的特性，减少打包的代码量。

### 3.自动局部引入
这个方式最简单，连手动引入polyfill都不用，直接`useBuiltIns`设为'usage'即可，这里会自动分析每个代码文件用到的`browserlist`不支持的特性，
自动往每个代码的开头加import语句，缺点是每个文件都加import，可能会有重复的import语句，加大一点编译后的代码量（垫片都是全局
注入，只需要import一次就够了，这点entry方式就比较好）。

usage和entry的区别：
* usage: 引入`browserlist`不支持，且代码中有用到的特性（只能覆盖编译的代码，一般像第三方包是不经过编译的）
* entry：引入`browserlist`不支持的特性（不能保证代码一定会用到）

### 4.垫片库的选择。
实际上`@babel/polyfill`在后面的更新已经过时，后续被拆分成了`core-js`和`regenerator/runtime`库，因此前面的引入`@babel/polyfill`，如果要用新版的垫片，
则需要更改corejs的参数（只有usage和entry模式需要，这两种模式默认是2）：
```
[
  '@babel/preset-env',
  {
    modules: false,
    corejs: 2,
    targets: {
      browsers: ['last 2 versions', '> 5%', 'not ie < 9']
    },
    useBuiltIns: 'entry'
    // include: [require.resolve('@babel/plugin-transform-spread')]
  }
]
```
以2为例，则我们需要引入:
```
import 'core-js';
import 'regenerator-runtime/runtime'; // 用到async必定要引入
```
然后会编译成对应corejs选择的垫片库。
因此我们需要安装`regenerator-runtime`和`core-js@2`或`core-js@3`库。

## 2）通过编译转换成局部的垫片引用
上面的全局插入垫片的方式，缺陷是污染环境，因此这里还有一种方式，就是在编译时，将用到新的api的语句转换成局部变量的实现，比如用到`Promise`，则可以定义一个
局部的`_Promise`的垫片模块，然后引用转换成`_Promise`（全局环境没有_Promise变量，因此没有污染全局环境）。这里问题在于对于一些实例的新的api方法，如`array.includes`
没有做垫片处理。

配置方式，使用babel的插件`@babel/plugin-transform`：
```
plugins: {
  require.resolve('@babel/plugin-transform-runtime'),
  {
    helpers: true,
    corejs: false,
    regenerator: false,
    // moduleName: require.resolve('babel-runtime/package')
  },
}
这里的坑点在于要理解里面几个参数的意义：
### 1.helpers

helpers其实是一些辅助函数，比如toArray,asyncToGenerator，是指编译高特性api时候需要用到的一些函数，如果该参数为false，则helpers会直接编译为静态的函数代码。
如果参数为true，则对应的辅助函数会通过`import xxx from '@babel/runtime/helpers'`的方式引入，这样的好处是减少重复的代码，不然每个文件编译后都会生成重复的
静态helper代码。

### 2.corejs
这个参数其实就是决定要使用的垫片版本库，该参数有三种：false, 2和3
* false：使用false，则引入的库为`@babel/runtime`，并且默认polyfill已经引入，因此像`Promise`这些新的特性都不会被编译。
* 2：引入垫片库`@babel/runtime-corejs2`，这个库提供了局部的垫片模块，编译后可以发现像代码的`Promise`会被编译为`_Promise`，
然后多出了一个引用语句`import _Promise from "@babel/runtime-corejs2/core-js/promise";`。
* 3：引入垫片库`@babel/runtime-corejs3`，相对于2多了新支持的浏览器特性api。并且支持了对象实例的方法polyfill。

### 3.regenerator
这个是对async函数特性的一个编译配置，async转换成es5的时候会转换成generator的实现，如果该参数为false，则转换成全局变量
`reGeneratorRuntime`，这里默认环境已经引入了该全局变量（polyfill库提供）。如果不想依赖全局环境的`regeneratorRuntime`，
则将该参数设置为true，async会转换成非全局的`regeneratorRuntime`模块，当然会在代码开头加一个局部generatorRuntime的import语句，
也就是打包会多引入regenerator模块：
```
import _regeneratorRuntime from "@babel/runtime/regenerator";
```

# 三、垫片的引入配置选择
上面讲了两种的垫片引入方式，主要就涉及几个维度：全局和非全局，垫片版本，垫片局部按需引入。

垫片版本来说，还是推荐最新的core-js@3，引入方式entry和usage方式都可以选，false感觉没有利用到
按需引入的优化，当然如果像保证全浏览器都能兼容那也可以使用。

这里要讨论的是全局和非全局引用的区别和使用场景。

这里其实就是使用`@babel/preset-env`还是使用`@babel/transform-runtime`，他们都使用了`core-js`库，
区别在于是全局注入还是引用。

全局注入会污染环境，但其实在一个根应用的层次上，其实全局注入是无法避免的，
像script标签引入第三方库，必定会注入模块到window对象，不然我们的应用代码无法拿到这个模块。这种方式
的好处在于所有的代码都能引用第三方模块，少了依赖注入的流程。

局部引用的方式，不会污染环境，而且`@babel/transform-runtime`的方式不依赖全局的垫片，属于“自给自足”的方式，
保证不同的环境引入了这个模块都能顺利运行，缺点在于引入的垫片不能共享，因此如果引入了两种该方式的模块，可能就
重复引入了相同的垫片代码，因为两者的垫片依赖不能共享，造成打包的代码可能会偏大。

因此经过多篇文章的查询，一个比较好的实践方式是，根应用的打包使用全局注入的方式，第三方模块使用`@babel/transform-runtime`的模式。

但第三方模块的配置可能我们还得分场景：
1）开源给外面用的模块
这种不能保证引用模块的环境，因此我们还是需要选择自行打包所有需要的垫片的方式，自给自足，尽管这样可能会导致项目引入重复垫片。

2）只有自己项目用的模块
这种情况，我们对自己项目用的特性是比较清楚的，最好的方式就是所有的垫片依赖由引用的应用提供，也就是将`corejs`和`regenerator`设置为false,
这样其实就完全使用了应用本身的全局垫片，让自己的模块只包含语法编译和业务的代码，减少最终的打包大小。当然这种方式也可以开源给第三方使用，
只是需要提醒开发者做好兼容垫片提供处理。

看了这些配置，只能感慨程序开发真的是“没有银弹”。。。。不同场景有不同的实践方案。