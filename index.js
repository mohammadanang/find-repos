const express = require("express");
const app = express();
const request = require("superagent");
const redis = require('redis');
const client = redis.createClient();

const respond = (username, repoLength) => {
    let result = {
        status: 'success',
        message: `User: ${username} has ${repoLength} public repositories`
    };

    return result;
};

const getUserRepos = (req, res) => {
    let username = req.query.username;
    request.get(`https://api.github.com/users/${username}/repos`, function (
        err,
        response
    ) {
        if (err) throw err;
        let repoLength = response.body.length;
        // store response to redis with set expiry time
        client.setex(username, 3600, repoLength);

        res.send(respond(username, repoLength));
    });
};

// this function be a middleware of routes
function cache(req, res, next) {
    const username = req.query.username;
    client.get(username, (err, data) => {
        if (err) throw err;

        if (data != null) {
            res.send(respond(username, data));
        } else {
            next();
        }
    });
}

app.get("/", (req, res) => {
    return res.status(200).send("Welcome to the beginning of nothingness.");
});

app.get("/users", cache, getUserRepos);

app.listen(3000, function () {
    console.log("Server listening on port 3000");
});