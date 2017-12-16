'use strict';

var github = require('./github_api.js');
var flow = require('flow');


var ORG_URFU = 'urfu-2016';

/**
 * Сделано задание на звездочку
 * Реализовано получение html
 */
exports.isStar = false;

/**
 * Получение списка задач
 * @param {String} category – категория задач (javascript или markup)
 * @param {Function} callback
 */
exports.getList = function (category, callback) {
    var taskNamePattern = new RegExp(category + '-task-\\d+');
    github.getOrgRepos(ORG_URFU, function (err, repos) {
        if (err) {
            callback(err, null);

            return;
        }

        var tasks = repos
        .filter(function (repo) {
            return taskNamePattern.test(repo.name);
        })
        .map(function (repo) {
            return {
                name: repo.name,
                description: repo.description
            };
        });

        callback(null, tasks);
    });
};

function convertToTaskWithReadme(repo, callback) {
    github.getReadme(repo.owner.login, repo.name, function (err, readme) {
        if (err) {
            callback(err);

            return;
        }

        var task = {
            name: repo.name,
            description: repo.description,
            markdown: readme
        };
        callback(null, task);
    });
}

/**
 * Загрузка одной задачи
 * @param {String} task – идентификатор задачи
 * @param {Function} callback
 */
exports.loadOne = function (task, callback) {
    flow.serial([
        github.getRepo.bind(null, ORG_URFU, task),
        convertToTaskWithReadme], callback);
};
