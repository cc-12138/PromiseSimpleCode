class Promise {
    constructor(executor) {
        this.PromiseState = 'pending';
        this.PromiseResult = null;
        this.callbacks = []
        //保存实例对象的this值 防止this代表window
        const self = this;
        // resolve函数
        function resolve(data) {
            // 保证状态只可以被改变一次
            if (self.PromiseState !== 'pending') return;
            //1. 修改对象的状态(promiseState)
            self.PromiseState = 'fulfilled'
            //2. 设置对象结果值(promiseResult)
            self.PromiseResult = data
            //调用成功的回调函数
            setTimeout(() => {
                self.callbacks.forEach(item => {
                    item.onResolved(data)
                });
            })
        }
        // reject函数
        function reject(data) {
            if (self.PromiseState !== 'pending') return;
            //1. 修改对象的状态(promiseState)
            self.PromiseState = 'rejected'
            //2. 设置对象结果值(promiseResult)
            self.PromiseResult = data
            // 当Promise内部的回调函数执行更慢时先执行then函数，then函数将自身要执行的回调函数保持下来
            // 最终等待异步回调执行完毕后then函数保持的回调函数在该处执行
            setTimeout(() => {
                self.callbacks.forEach(item => {
                    item.onRejected(data)
                });
            })
        }
        try {
            //同步调用【执行器函数】
            executor(resolve, reject);
        } catch (e) {
            reject(e)
        }
    }
    then(onResolved, onRejected) {
        if (typeof onResolved !== 'function') {
            onResolved = value => value
        }
        if (typeof onRejected !== 'function') {
            onRejected = reason => {
                throw reason
            }
        }
        // 保存当前对象 便于内部回调函数使用
        const self = this
        return new Promise((resolve, reject) => {
            function callback(type) {
                try {
                    // 获取回调函数的执行结果
                    let result = type(self.PromiseResult)
                    if (result instanceof Promise) {
                        // 如果是Promise类型的对象 则该对象的状态结果为返回结果
                        result.then(v => {
                            resolve(v)
                        }, r => {
                            reject(r)
                        })
                    } else {
                        // 如果不是Promise对象则结果状态为成功
                        resolve(result)
                    }
                } catch (e) {
                    reject(e);
                }
            }
            // 根据PromiseState属性判断执行哪个回调
            if (this.PromiseState === 'fulfilled') {
                setTimeout(() => {
                    callback(onResolved)
                })
            }
            if (this.PromiseState === 'rejected') {
                setTimeout(() => {
                    callback(onRejected)
                })
            }
            // 判断pending状态
            // 保存当前对象便于在回调中调用
            if (this.PromiseState === 'pending') {
                // 保存回调函数 为异步执行做准备
                // 考虑一次有多个回调，因此设置成数组防止多个回调被覆盖
                this.callbacks.push({
                    onResolved: function () {
                        callback(onResolved)
                    },
                    onRejected: function () {
                        callback(onRejected)
                    },
                })
            }
        })
    }
    catch(onRejected) {
        return this.then(undefined, onRejected)
    }
    static resolve(value) {
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                // 如果是Promise类型的对象 则该对象的状态结果为返回结果
                value.then(v => {
                    resolve(v)
                }, r => {
                    reject(r)
                })
            } else {
                // 如果不是Promise对象则结果状态为成功
                resolve(value)
            }
        })
    }
    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }
    static all(promises) {
        return new Promise((resolve, reject) => {
            // 声明计数变量统计成功对象的个数
            let count = 0
            // 声明数组存储成功的结果
            let arr = []
            for (let i = 0; i < promises.length; i++) {
                promises[i].then(v => {
                    //从此处可以得知对应对象状态是成功的
                    count++
                    //将当前执行的结果存在数组当中
                    arr[i] = v //为防止顺序错乱
                    if (count === promises.length) {
                        resolve(arr)
                    }
                }, r => {
                    reject(r)
                })
            }
        })
    }
    static race(promises) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < promises.length; i++) {
                promises[i].then(v => {
                    resolve(v)
                }, r => {
                    reject(r)
                })
            }
        })
    }
}








