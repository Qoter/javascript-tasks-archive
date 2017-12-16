
'use strict';

exports.isStar = true;

var DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var DATE_PATTERN = /^([А-Я]{2})? ?(\d{2}):(\d{2})\+(\d)$/;
var MINUTES_IN_HOUR = 60;
var HOURS_IN_DAY = 24;
var MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

function TimeSpan(from, to) {
    this.from = from;
    this.to = to;

    this.isIntersectsWith = function (other) {
        return this.from < other.to && this.to > other.from;
    };

    this.shift = function (minutes) {
        return new TimeSpan(this.from + minutes, this.to + minutes);
    };
}

TimeSpan.fromDates = function (dates, timeZone) {
    return new TimeSpan(normalizeDate(dates.from, timeZone), normalizeDate(dates.to, timeZone));
};

function convertMinutesToDate(minutes) {
    var totalDays = Math.floor(minutes / MINUTES_IN_DAY);
    var totalHours = Math.floor((minutes % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
    var totalMinutes = minutes % MINUTES_IN_DAY % MINUTES_IN_HOUR;

    return {
        day: DAYS_OF_WEEK[totalDays],
        hours: totalHours,
        minutes: totalMinutes
    };
}

function getDateObject(dateString) {
    var dateChunks = dateString.match(DATE_PATTERN);

    return {
        day: DAYS_OF_WEEK.indexOf(dateChunks[1]),
        hours: parseInt(dateChunks[2], 10),
        minutes: parseInt(dateChunks[3], 10),
        timeZone: parseInt(dateChunks[4], 10)
    };
}

function normalizeDate(dateString, timeZone) {
    var date = getDateObject(dateString);

    return Math.max(0, date.day) * MINUTES_IN_DAY +
           date.hours * MINUTES_IN_HOUR +
           date.minutes +
           (timeZone - date.timeZone) * MINUTES_IN_HOUR;
}

function getBusyTimes(schedule, timeZone) {
    return schedule.Danny
          .concat(schedule.Rusty)
          .concat(schedule.Linus)
          .map(function (dates) {
              return TimeSpan.fromDates(dates, timeZone);
          });
}

function canRobIn(timeToRob, busyTimes) {
    return busyTimes.every(function (busyTime) {
        return !busyTime.isIntersectsWith(timeToRob);
    });
}

function findRobberyTime(busyTimes, duration, workingTimeSpan) {
    var timeToRob = new TimeSpan(workingTimeSpan.from, workingTimeSpan.from + duration);

    while (timeToRob.to <= workingTimeSpan.to) {
        if (canRobIn(timeToRob, busyTimes)) {
            return timeToRob;
        }

        timeToRob = timeToRob.shift(1);
    }

    return null;
}

function padLeft(str, padChar, count) {
    str = str.toString();
    while (str.length < count) {
        str = padChar + str;
    }

    return str;
}

function formatDate(date, template) {
    return template.replace(/%DD/, date.day)
                   .replace(/%HH/, padLeft(date.hours, '0', 2))
                   .replace(/%MM/, padLeft(date.minutes, '0', 2));
}

function createMomentObject(timeToRob, busyTime, duration, workingTimeSpan) {
    return {
        timeToRob: timeToRob,
        exists: function () {
            return timeToRob !== null;
        },
        format: function (template) {
            return this.exists()
                ? formatDate(convertMinutesToDate(this.timeToRob.from), template)
                : '';
        },
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }

            busyTime.push(new TimeSpan(this.timeToRob.from, this.timeToRob.from + 30));
            var nextTimeToRob = getTimeToRob(busyTime, duration, workingTimeSpan);
            if (nextTimeToRob) {
                this.timeToRob = nextTimeToRob;

                return true;
            }

            return false;
        }
    };
}

function getTimeToRob(busyTimes, duration, workingTimeSpan) {
    for (var currentDay = 0; currentDay < 3; currentDay++) {
        var timeToRob = findRobberyTime(busyTimes, duration, workingTimeSpan);
        if (timeToRob) {
            return timeToRob;
        }
        workingTimeSpan = workingTimeSpan.shift(MINUTES_IN_DAY);
    }

    return null;
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var globalTimeZone = getDateObject(workingHours.from).timeZone;
    var workingTimeSpan = TimeSpan.fromDates(workingHours, globalTimeZone);
    var busyTimes = getBusyTimes(schedule, globalTimeZone);
    var timeToRob = getTimeToRob(busyTimes, duration, workingTimeSpan);

    return createMomentObject(timeToRob, busyTimes, duration, workingTimeSpan);
};
