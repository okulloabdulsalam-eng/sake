(function () {
    'use strict';

    var DAY = {
        SUNDAY: 1,
        MONDAY: 2,
        TUESDAY: 3,
        WEDNESDAY: 4,
        THURSDAY: 5,
        FRIDAY: 6,
        SATURDAY: 7
    };

    var STORAGE_KEY = 'kiumaOfflineReminderScheduleV1';
    var REMINDERS = [
        {
            id: 'daily-updates-0600',
            requestCode: 1001,
            hour: 6,
            minute: 0,
            title: 'KIUMA Updates',
            body: 'Check our new KIUMA upcoming events today',
            route: 'events.html'
        },
        {
            id: 'programs-daily-0900',
            requestCode: 1002,
            hour: 9,
            minute: 0,
            title: 'Programs Reminder',
            body: 'Check today’s KIUMA programs',
            route: 'programs.html'
        },
        {
            id: 'ask-learn-daily-1000',
            requestCode: 1003,
            hour: 10,
            minute: 0,
            title: 'Ask & Learn',
            body: 'Do you have a question? Ask using the KIUMA app',
            route: 'ask-question.html'
        },
        {
            id: 'prayer-updates-mon-fri-0600',
            requestCode: 1004,
            hour: 6,
            minute: 0,
            daysOfWeek: [DAY.MONDAY, DAY.FRIDAY],
            title: 'Prayer Updates',
            body: 'Check new prayer time updates today',
            route: 'index.html'
        },
        {
            id: 'support-daily-0800',
            requestCode: 1005,
            hour: 8,
            minute: 0,
            title: 'Support KIUMA',
            body: 'Donate using the KIUMA app and support the community',
            route: 'pay.html'
        },
        {
            id: 'fajr-daily-0500',
            requestCode: 1006,
            hour: 5,
            minute: 0,
            title: 'Fajr Reminder',
            body: 'Start your day with Fajr prayer',
            route: 'index.html'
        },
        {
            id: 'asr-daily-1600',
            requestCode: 1007,
            hour: 16,
            minute: 0,
            title: 'Asr Reminder',
            body: 'Ibn Umar reported: The Messenger of Allah, peace and blessings be upon him, said, “Whoever misses the afternoon prayer, it is as if he had lost his family and his property.”',
            route: 'index.html'
        },
        {
            id: 'evening-reflection-daily-1800',
            requestCode: 1008,
            hour: 18,
            minute: 0,
            title: 'Evening Reflection',
            body: 'Take a moment for reflection and dhikr',
            route: 'dhikr.html'
        },
        {
            id: 'weekly-programs-monday-1800',
            requestCode: 1009,
            hour: 18,
            minute: 0,
            daysOfWeek: [DAY.MONDAY],
            title: 'Programs reminder',
            body: 'Check our weekly KIUMA programs',
            route: 'programs.html'
        }
    ];

    function canUseCapacitor() {
        return typeof window !== 'undefined' && !!window.Capacitor && !!window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    }

    function ensurePluginRegistered() {
        if (!canUseCapacitor()) return null;
        if (window.Capacitor.Plugins && window.Capacitor.Plugins.KiumaReminders) {
            return window.Capacitor.Plugins.KiumaReminders;
        }
        if (typeof window.Capacitor.registerPlugin === 'function') {
            return window.Capacitor.registerPlugin('KiumaReminders');
        }
        return null;
    }

    function getPlugin() {
        return ensurePluginRegistered();
    }

    function getScheduleSignature() {
        return JSON.stringify(REMINDERS);
    }

    async function ensureRemindersScheduled() {
        var plugin = getPlugin();
        if (!plugin || typeof plugin.scheduleReminders !== 'function') return;

        try {
            if (typeof plugin.requestNotificationPermission === 'function') {
                await plugin.requestNotificationPermission();
            }
        } catch (e) {
            console.warn('[OfflineReminders] Notification permission request failed:', e);
        }

        var signature = getScheduleSignature();
        var existing = null;
        try {
            existing = localStorage.getItem(STORAGE_KEY);
        } catch (e) {
        }

        var shouldSchedule = existing !== signature;
        if (!shouldSchedule && typeof plugin.getStatus === 'function') {
            try {
                var status = await plugin.getStatus();
                shouldSchedule = !status || status.scheduledCount !== REMINDERS.length;
            } catch (e) {
                shouldSchedule = true;
            }
        }

        if (!shouldSchedule) return;

        try {
            var result = await plugin.scheduleReminders({ reminders: REMINDERS });
            if (result && result.exactAlarmsAllowed === false && typeof plugin.openExactAlarmSettings === 'function') {
                var exactAlarmPromptKey = STORAGE_KEY + ':exact-alarm-prompted';
                var alreadyPrompted = false;
                try {
                    alreadyPrompted = localStorage.getItem(exactAlarmPromptKey) === '1';
                } catch (storageErr) {
                }
                if (!alreadyPrompted) {
                    try {
                        localStorage.setItem(exactAlarmPromptKey, '1');
                    } catch (storageWriteErr) {
                    }
                    plugin.openExactAlarmSettings();
                }
            }
            try {
                localStorage.setItem(STORAGE_KEY, signature);
            } catch (storagePersistErr) {
            }
        } catch (e) {
            console.warn('[OfflineReminders] Failed to schedule reminders:', e);
        }
    }

    function navigateToRoute(route) {
        if (!route) return;
        if (window.location.pathname.split('/').pop() === route) return;
        window.location.href = route;
    }

    async function consumePendingLaunchRoute() {
        var plugin = getPlugin();
        if (!plugin || typeof plugin.getPendingLaunchRoute !== 'function') return;
        try {
            var result = await plugin.getPendingLaunchRoute();
            if (result && result.route) {
                navigateToRoute(result.route);
            }
        } catch (e) {
            console.warn('[OfflineReminders] Failed to consume launch route:', e);
        }
    }

    function initOfflineReminders() {
        ensureRemindersScheduled();
        consumePendingLaunchRoute();
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            consumePendingLaunchRoute();
        }
    });

    window.addEventListener('focus', function () {
        consumePendingLaunchRoute();
    });

    window.KiumaOfflineReminders = {
        init: initOfflineReminders,
        ensureScheduled: ensureRemindersScheduled,
        consumePendingLaunchRoute: consumePendingLaunchRoute,
        reminders: REMINDERS.slice()
    };
})();
