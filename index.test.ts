// Stupid to use a library for this simple test, but to use hours to write test and debug the tests because
// it can't handle async code and promises is more important than productivity :)

import { retryWrapper } from '.';

test('async-wrapper', done => {
    let maxRetries = 5;
    let retry = {};
    function simulateRequest(req, done) {
        // --- To log retries ---
        retry[req] = retry[req] || 0;
        // ----------------------
        try {
            expect(retry[req]).toBeLessThanOrEqual(maxRetries);
        } catch (e) {
            done.fail(e);
        }
        return new Promise((resolve, reject) => {

            var random = Math.floor(Math.random() * 10);
            // Simulate sending of request
            retry[req]++;
            // Simulate waiting for answer
            setTimeout(() => {
                if (random < 7) {
                    return reject(`${req}, failed at try ${retry[req]}`);
                }
                return resolve(req);
            }, random);
        });
    }
    //Same callback as the default, just lower timeouts to avoid timeout exception from
    // jasmine

    let tryCallBack = (error, tried, lapsed, resolve, reject, retry) => {
        if (tried > maxRetries) {
            return reject(error);
        }
        retry(tried * 1);
    };
    let retryWrapped = retryWrapper(tryCallBack, simulateRequest);
    let promises = [];
    //expect(Promise.reject(4)).reject;
    for (let i = 0, l = 100; i < l; i++) {
        promises.push(retryWrapped(i).catch(e => e))
    }
    return Promise.all(promises)
        .then(res => {
            //console.log(res);
            res.forEach((r: string, i: number) => {
                if (r && r.indexOf && r.indexOf('failed') > -1) {
                    // 1 retry is 2 tries.
                    expect(r).toBe(`${i}, failed at try ${maxRetries + 1}`);
                } else {
                    expect(r).toBe(i);
                }
            });
            done();
        })
        .catch(e => done.fail(e));
});