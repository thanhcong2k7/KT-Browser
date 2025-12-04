process.on('message', function (m) {
    process.send(Buffer.alloc(99999999))
});