'use strict';

function Set() {
    this.elements = {};
    this.add = function (value) {
        this.elements[value] = true;
    };
    this.contains = function (value) {
        return this.elements.hasOwnProperty(value);
    };
}

function convertToMapBy(propertyName, objectArray) {
    return objectArray.reduce(function (currentMap, object) {
        currentMap[object[propertyName]] = object;

        return currentMap;
    }, {});
}

function IteratorByCircle(friends) {
    this.nameToFriend = convertToMapBy('name', friends);
    this.visited = new Set();
    this.currentCircle = [];
    this.nextCircle = [];

    var bestFriends = friends.filter(function (friend) {
        return friend.best;
    });

    this.pushNextIfPossible(bestFriends);
    this.currentFriend = this.getNextFriend();
}

IteratorByCircle.prototype.pushNextIfPossible = function (friends) {
    friends.forEach(function (friend) {
        if (typeof friend === 'string') {
            friend = this.nameToFriend[friend];
        }

        if (!this.visited.contains(friend.name)) {
            this.visited.add(friend.name);
            this.nextCircle.push(friend);
        }

    }, this);
};

IteratorByCircle.prototype.moveToNextCircle = function () {
    this.currentCircle = this.nextCircle.sort(function (first, second) {
        return first.name.localeCompare(second.name);
    });
    this.nextCircle = [];
};

IteratorByCircle.prototype.getNextFriend = function () {
    if (this.currentCircle.length === 0 && this.nextCircle.length === 0) {
        return null;
    }

    if (this.currentCircle.length === 0) {
        this.moveToNextCircle();
    }

    var nextFriend = this.currentCircle.shift();
    this.pushNextIfPossible(nextFriend.friends);

    return nextFriend;
};

/**
 * Отдаёт текущего друга и меняет текущего на следующего
 * @returns {Object} текущий друг
 */
IteratorByCircle.prototype.next = function () {
    if (this.done()) {
        return null;
    }

    var friendForReturn = this.currentFriend;
    this.currentFriend = this.getNextFriend();

    return friendForReturn;
};

IteratorByCircle.prototype.done = function () {
    return this.currentFriend === null;
};

/**
 * Итератор по друзьям
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 */
function Iterator(friends, filter) {
    if (!(filter instanceof Filter)) {
        throw new TypeError('Argument "filter" should be instance of Filter');
    }

    this.filter = filter;
    IteratorByCircle.call(this, friends);
}
Iterator.prototype = Object.create(IteratorByCircle.prototype);

Iterator.prototype.getNextFriend = function () {
    for (;;) {
        var friend = IteratorByCircle.prototype.getNextFriend.call(this);
        if (friend === null || this.filter.isAccept(friend)) {
            return friend;
        }
    }
};

/**
 * Итератор по друзям с ограничением по кругу
 * @extends Iterator
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 * @param {Number} maxLevel – максимальный круг друзей
 */
function LimitedIterator(friends, filter, maxLevel) {
    this.maxLevel = maxLevel;
    this.currentLevel = 0;

    Iterator.call(this, friends, filter);
}
LimitedIterator.prototype = Object.create(Iterator.prototype);

LimitedIterator.prototype.moveToNextCircle = function () {
    Iterator.prototype.moveToNextCircle.call(this);
    this.currentLevel++;
};

LimitedIterator.prototype.done = function () {
    return Iterator.prototype.done.call(this) || this.currentLevel > this.maxLevel;
};

/**
 * Фильтр друзей
 * @constructor
 */
function Filter() {
    this.isAccept = function () {
        return true;
    };
}

/**
 * Фильтр друзей
 * @extends Filter
 * @constructor
 */
function MaleFilter() {
    this.isAccept = function (friend) {
        return friend.gender === 'male';
    };
}
MaleFilter.prototype = Object.create(Filter.prototype);


/**
 * Фильтр друзей-девушек
 * @extends Filter
 * @constructor
 */
function FemaleFilter() {
    this.isAccept = function (friend) {
        return friend.gender === 'female';
    };
}
FemaleFilter.prototype = Object.create(Filter.prototype);

exports.IteratorByCircle = IteratorByCircle;
exports.Iterator = Iterator;
exports.LimitedIterator = LimitedIterator;

exports.Filter = Filter;
exports.MaleFilter = MaleFilter;
exports.FemaleFilter = FemaleFilter;
