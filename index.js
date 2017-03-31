"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function retryWrapper(retries, fn) {
    var tryCallBack;
    if (typeof (retries) != 'function') {
        //If no function and no number, retry 5 times.
        if (!retries || isNaN(retries)) {
            retries = 5;
        }
        tryCallBack = function (error, tried, lapsed, resolve, reject, retry) {
            if (tried > retries) {
                return reject(error);
            }
            retry(tried * 200);
        };
    }
    else {
        tryCallBack = retries;
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var started = Date.now();
        var tried = 0;
        return new Promise(function (resolve, reject) {
            function execute(timeOut) {
                tried++;
                setTimeout(function () { return fn.apply(void 0, args).then(function (result) { return resolve(result); })
                    .catch(function (e) { return tryCallBack(e, tried, Date.now() - started, resolve, reject, execute); }); }, timeOut);
            }
            execute(0);
        });
    };
}
exports.retryWrapper = retryWrapper;
exports.default = retryWrapper;
