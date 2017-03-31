// Stupid to use a library for this simple test, but to use hours to write test and debug the tests because
// it can't handle async code and promises is more important than productivity :)
"use strict";
var _1 = require(".");
test('async-wrapper', function (done) {
    var maxRetries = 5;
    var retry = {};
    function simulateRequest(req, done) {
        // --- To log retries ---
        retry[req] = retry[req] || 0;
        // ----------------------
        try {
            expect(retry[req]).toBeLessThanOrEqual(maxRetries);
        }
        catch (e) {
            done.fail(e);
        }
        return new Promise(function (resolve, reject) {
            var random = Math.floor(Math.random() * 10);
            // Simulate sending of request
            retry[req]++;
            // Simulate waiting for answer
            setTimeout(function () {
                if (random < 7) {
                    return reject(req + ", failed at try " + retry[req]);
                }
                return resolve(req);
            }, random);
        });
    }
    //Same callback as the default, just lower timeouts to avoid timeout exception from
    // jasmine
    var tryCallBack = function (error, tried, lapsed, resolve, reject, retry) {
        if (tried > maxRetries) {
            return reject(error);
        }
        retry(tried * 1);
    };
    var retryWrapped = _1.retryWrapper(tryCallBack, simulateRequest);
    var promises = [];
    //expect(Promise.reject(4)).reject;
    for (var i = 0, l = 100; i < l; i++) {
        promises.push(retryWrapped(i).catch(function (e) { return e; }));
    }
    return Promise.all(promises)
        .then(function (res) {
        //console.log(res);
        res.forEach(function (r, i) {
            if (r && r.indexOf && r.indexOf('failed') > -1) {
                // 1 retry is 2 tries.
                expect(r).toBe(i + ", failed at try " + (maxRetries + 1));
            }
            else {
                expect(r).toBe(i);
            }
        });
        done();
    })
        .catch(function (e) { return done.fail(e); });
});
