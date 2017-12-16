'use strict';

var https = require('https');

var API_HOST = 'api.github.com';
var USER_AGENT = 'github-api-client';
var PATH_SEPARATOR = '/';

function createRequestOptions(path) {
    return {
        host: API_HOST,
        path: path,
        headers: { 'User-Agent': USER_AGENT }
    };
}

function joinApiPath() {
    return PATH_SEPARATOR + [].slice.call(arguments).join(PATH_SEPARATOR);
}

function fetchJson(path, callback) {
    function fetchJsonCallback(response) {
        var receivedChunks = [];

        response.on('data', function (chunk) {
            receivedChunks.push(chunk);
        });

        response.on('end', function () {
            try {
                callback(null, JSON.parse(receivedChunks.join('')));
            } catch (err) {
                callback(err);
            }
        });
    }

    var options = createRequestOptions(path);
    https.request(options, fetchJsonCallback)
    .on('error', callback)
    .end();
}

exports.getOrgRepos = function (org, callback) {
    var reposPath = joinApiPath('orgs', org, 'repos');
    fetchJson(reposPath, callback);
};

exports.getRepo = function (owner, repoName, callback) {
    var repoPath = joinApiPath('repos', owner, repoName);
    fetchJson(repoPath, callback);
};

exports.getReadme = function (owner, repoName, callback) {
    var readmePath = joinApiPath('repos', owner, repoName, 'readme');

    fetchJson(readmePath, function (err, readme) {
        if (err) {
            callback(err);

            return;
        }

        try {
            var readmeMd = Buffer.from(readme.content, readme.encoding).toString('utf-8');
            callback(null, readmeMd);
        } catch (e) {
            callback(e);
        }
    });
};


