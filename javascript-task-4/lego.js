'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var OPERATORS_PRIORITY = {
    filterIn: 0,
    or: 0,
    and: 0,
    sortBy: 1,
    select: 2,
    limit: 3,
    format: 4
};

function compareBy(propertyName, order) {
    order = order || 'asc';
    var orderFactor = order === 'asc' ? 1 : -1;

    return function (first, second) {
        if (first[propertyName] < second[propertyName]) {
            return -1 * orderFactor;
        }
        if (first[propertyName] > second[propertyName]) {
            return orderFactor;
        }

        return 0;
    };
}

function clone(object) {
    return Object.keys(object).reduce(function (objectClone, key) {
        objectClone[key] = object[key];

        return objectClone;
    }, {});
}

/**
 * Запрос к коллекции
 * @param {Array} collection
 * @params {...Function} – Функции для запроса
 * @returns {Array}
 */
exports.query = function (collection) {
    collection = collection.map(clone);

    var compareOperators = function (first, second) {
        return OPERATORS_PRIORITY[first.name] < OPERATORS_PRIORITY[second.name] ? -1 : 1;
    };
    var orderedOperators = [].slice.call(arguments, 1)
                                   .sort(compareOperators);

    return applyAll(orderedOperators, collection);
};

function applyAll(operators, collection) {
    return operators.reduce(function (currentCollection, operator) {
        return operator(currentCollection);
    }, collection);
}

/**
 * Выбор полей
 * @params {...String}
 * @returns {Function}
 */

exports.select = function () {
    var keysToSelect = [].slice.call(arguments);

    return function select(collection) {
        return collection.map(selectByKeys.bind(null, keysToSelect));
    };
};

function selectByKeys(keysToSelect, object) {
    return Object.keys(object).reduce(function (selectedObject, currentKey) {
        if (keysToSelect.indexOf(currentKey) !== -1) {
            selectedObject[currentKey] = object[currentKey];
        }

        return selectedObject;
    }, {});
}

/**
 * Фильтрация поля по массиву значений
 * @param {String} property – Свойство для фильтрации
 * @param {Array} values – Доступные значения
 * @returns {Function}
 */
exports.filterIn = function (property, values) {
    return function filterIn(collection) {
        return collection.filter(containsProperty.bind(null, property, values));
    };
};

function containsProperty(property, values, object) {
    return object.hasOwnProperty(property) &&
           values.indexOf(object[property]) !== -1;
}

/**
 * Сортировка коллекции по полю
 * @param {String} property – Свойство для фильтрации
 * @param {String} order – Порядок сортировки (asc - по возрастанию; desc – по убыванию)
 * @returns {Function}
 */
exports.sortBy = function (property, order) {
    return function sortBy(collection) {
        return collection.sort(compareBy(property, order));
    };
};

/**
 * Форматирование поля
 * @param {String} property – Свойство для фильтрации
 * @param {Function} formatter – Функция для форматирования
 * @returns {Function}
 */
exports.format = function (property, formatter) {
    return function format(collection) {
        collection.forEach(function (object) {
            object[property] = formatter(object[property]);
        });

        return collection;
    };
};

/**
 * Ограничение количества элементов в коллекции
 * @param {Number} count – Максимальное количество элементов
 * @returns {Function}
 */
exports.limit = function (count) {
    return function limit(collection) {
        return collection.slice(0, count);
    };
};

if (exports.isStar) {
    var convertToOneObjectFilter = function (collectionFilter) {
        return function (object) {
            return collectionFilter([object]).length === 1;
        };
    };

    var isAcceptSomeFilter = function (objectFilters, object) {
        return objectFilters.some(function (filter) {
            return filter(object);
        });
    };

    /**
     * Фильтрация, объединяющая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Function}
     */
    exports.or = function () {
        var oneObjectFilters = [].slice.call(arguments).map(convertToOneObjectFilter);

        return function or(collection) {
            return collection.filter(isAcceptSomeFilter.bind(null, oneObjectFilters));
        };
    };

    /**
     * Фильтрация, пересекающая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Function}
     */
    exports.and = function () {
        var filters = [].slice.call(arguments);

        return function and(collection) {
            return applyAll(filters, collection);
        };
    };
}
