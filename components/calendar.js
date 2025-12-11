// ============================================
// D&D VAULT - DOLMENWOOD CALENDAR
// Full calendar with lunar phases, events, and time controls
// ============================================

import { router } from '../utils/router.js';
import { clipboard } from '../utils/clipboard.js';

let calendarData = null;
let currentDate = {
    year: 376,
    month: 11, // Obthryme (1-indexed in data, 11th month)
    day: 4,
    hour: 12,
    activeSeasons: [],
    customEvents: [
        { month: 11, day: 28, name: "Azelach Contract Due!", type: "urgent" }
    ],
    yearWeather: {}, // { year: { month: { day: weatherObj } } }
    yearMoonEffects: {}, // { year: { month: { day: effectObj } } }
    logs: {} // { "year-month-day": [ { type, text, timestamp } ] }
};

const MOON_PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
const MOON_NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

// Weather tables by season (2d6)
const WEATHER_TABLES = {
    winter: {
        2: { desc: "Deep freeze, hoarfrost", effects: [] },
        3: { desc: "Snow storm", effects: ['I', 'V', 'W'] },
        4: { desc: "Relentless wind", effects: [] },
        5: { desc: "Bitter, silent", effects: [] },
        6: { desc: "Frigid, icy", effects: [] },
        7: { desc: "Clear, cold", effects: [] },
        8: { desc: "Freezing rain", effects: ['V', 'W'] },
        9: { desc: "Cold wind, gloomy", effects: [] },
        10: { desc: "Frigid mist", effects: ['V'] },
        11: { desc: "Icy, steady snow", effects: ['V', 'W'] },
        12: { desc: "Relentless blizzard", effects: ['I', 'V', 'W'] }
    },
    spring: {
        2: { desc: "Cold, gentle snow", effects: ['W'] },
        3: { desc: "Chilly, damp", effects: ['W'] },
        4: { desc: "Windy, cloudy", effects: [] },
        5: { desc: "Brisk, clear", effects: [] },
        6: { desc: "Clement, cheery", effects: [] },
        7: { desc: "Warm, sunny", effects: [] },
        8: { desc: "Bright, fresh", effects: [] },
        9: { desc: "Blustery, drizzle", effects: ['W'] },
        10: { desc: "Pouring rain", effects: ['V', 'W'] },
        11: { desc: "Gloomy, cool", effects: [] },
        12: { desc: "Chill mist", effects: ['V'] }
    },
    summer: {
        2: { desc: "Cool winds", effects: [] },
        3: { desc: "Low cloud, mist", effects: ['V'] },
        4: { desc: "Warm, gentle rain", effects: ['W'] },
        5: { desc: "Brooding thunder", effects: [] },
        6: { desc: "Balmy, clear", effects: [] },
        7: { desc: "Hot, humid", effects: [] },
        8: { desc: "Overcast, muggy", effects: [] },
        9: { desc: "Sweltering, still", effects: [] },
        10: { desc: "Baking, dry", effects: [] },
        11: { desc: "Warm wind", effects: [] },
        12: { desc: "Thunder storm", effects: ['V', 'W'] }
    },
    autumn: {
        2: { desc: "Torrential rain", effects: ['V', 'W'] },
        3: { desc: "Rolling fog", effects: ['V'] },
        4: { desc: "Driving rain", effects: ['V', 'W'] },
        5: { desc: "Bracing wind", effects: [] },
        6: { desc: "Balmy, clement", effects: [] },
        7: { desc: "Clear, chilly", effects: [] },
        8: { desc: "Drizzle, damp", effects: ['W'] },
        9: { desc: "Cloudy, misty", effects: ['V'] },
        10: { desc: "Brooding clouds", effects: [] },
        11: { desc: "Frosty, chill", effects: [] },
        12: { desc: "Icy, gentle snow", effects: ['W'] }
    },
    hitching: {
        2: { desc: "Torrential rain", effects: ['V', 'W'] },
        3: { desc: "Clear, fresh dew", effects: ['W'] },
        4: { desc: "Sleepy, purple mist", effects: ['V'] },
        5: { desc: "Interminable drizzle", effects: ['W'] },
        6: { desc: "Balmy mist", effects: ['V'] },
        7: { desc: "Thick fog, hot", effects: ['V'] },
        8: { desc: "Misty, seeping damp", effects: ['V', 'W'] },
        9: { desc: "Hazy fog, dripping", effects: ['V', 'W'] },
        10: { desc: "Sticky dew drips", effects: ['W'] },
        11: { desc: "Gloomy, shadows drip", effects: [] },
        12: { desc: "Befuddling green fog", effects: ['V'] }
    },
    vague: {
        2: { desc: "Hoarfrost, freezing fog", effects: ['V'] },
        3: { desc: "Steady snow, icy mist", effects: ['V', 'W'] },
        4: { desc: "Low mist, writhing soil", effects: [] },
        5: { desc: "Sickly, yellow mist", effects: ['V'] },
        6: { desc: "Thick, rolling fog", effects: ['V'] },
        7: { desc: "Freezing fog", effects: ['V'] },
        8: { desc: "Chill mist, winds wail", effects: ['V'] },
        9: { desc: "Icy mist, eerie howling", effects: ['V'] },
        10: { desc: "Violet mist rises", effects: ['V'] },
        11: { desc: "Blizzard, earth tremors", effects: ['I', 'V', 'W'] },
        12: { desc: "Blizzard, dense fog", effects: ['I', 'V', 'W'] }
    }
};

const EFFECT_DESCRIPTIONS = {
    'I': { name: 'Travel Impeded', desc: 'Travel Points reduced by 2', icon: '🚷' },
    'V': { name: 'Poor Visibility', desc: 'Encounter distance halved, +1-in-6 lost chance', icon: '🌫️' },
    'W': { name: 'Wet Conditions', desc: 'Building campfire is difficult', icon: '💧' }
};

const MOON_SIGNS_DATA = {
    'Grinning': {
        waxing: '50% chance of guardian undead ignoring the character’s presence. (Though they act normally if provoked.)',
        full: '+1 bonus to Saving Throws against the powers of undead monsters.',
        waning: '+1 Attack bonus against undead monsters.'
    },
    'Dead': {
        waxing: '+1 bonus to Attack and Damage Rolls the Round after killing a foe.',
        full: 'If killed by non-magical means, the character returns to life after 1 Turn with 1 Hit Point. Their Constitution and Wisdom are permanently halved. Once ever.',
        waning: 'Undead monsters attack all others in the party before attacking the character.'
    },
    'Beast': {
        waxing: '+2 bonus to Charisma (maximum 18) when interacting with dogs and horses.',
        full: 'Wild animals attack all others in the party before attacking the character.',
        waning: '+1 Attack bonus against wolves and bears.'
    },
    'Squamous': {
        waxing: 'Effects of poison are delayed by 1 Turn.',
        full: '+2 bonus to Saving Throws against the breath attacks and magical powers of wyrms and dragons.',
        waning: '+1 Attack bonus against serpents and wyrms.'
    },
    'Knight’s': {
        waxing: '+2 bonus to Charisma (maximum 18) when interacting with nobles.',
        full: '+1 AC bonus against attacks with metal weapons.',
        waning: 'On a tied Initiative roll when in melee with knights or soldiers, the character acts first.'
    },
    'Rotting': {
        waxing: '+2 bonus to Charisma (maximum 18) when interacting with sentient fungi.',
        full: '+2 AC bonus against attacks by fungal monsters.',
        waning: 'In the character’s presence, fungal monsters suffer a –1 penalty to Attack and Damage Rolls.'
    },
    'Maiden’s': {
        waxing: '+2 bonus to Charisma (maximum 18) when interacting with demi-fey.',
        full: '+2 bonus to Saving Throws against charms and glamours.',
        waning: '+1 bonus to Attack and Damage Rolls against shape-changers and those cloaked with illusions.'
    },
    'Witch’s': {
        waxing: 'When the character receives magical healing, they gain 1 additional Hit Point. (Max once per day/type).',
        full: '+1 bonus to Saving Throws against holy magic.',
        waning: '+1 bonus to Attack Rolls against witches and holy spell casters.'
    },
    'Robber’s': {
        waxing: '+2 bonus to Charisma (maximum 18) when interacting with Chaotic mortals.',
        full: '+1 AC bonus against attacks by Chaotic mortals, fairies, or demi-fey.',
        waning: '+1 Attack bonus against Chaotic mortals, fairies, and demi-fey.'
    },
    'Goat': {
        waxing: '+2 bonus to Charisma (maximum 18) when interacting with breggles (including crookhorns).',
        full: 'Breggles (including crookhorns) attack all others in the party before attacking the character.',
        waning: '+1 Attack bonus against breggles (including crookhorns).'
    },
    'Narrow': {
        waxing: '+2 bonus to Charisma (maximum 18) when interacting with fairies, but suffer a –1 penalty to all Saving Throws against fairy magic.',
        full: 'If the character is afflicted by a curse or a Geas spell, there is a 1-in-4 chance of the caster also being affected by their own magic.',
        waning: '+1 Attack bonus against fairies and demi-fey.'
    },
    'Black': {
        waxing: '+1 bonus to Search Checks to find secret doors.',
        full: '+2 bonus to AC and Saving Throws when surprised.',
        waning: '+2 bonus to Saving Throws versus illusions and glamours.'
    }
};

const MOON_SIGN_NAMES = Object.keys(MOON_SIGNS_DATA);

export async function renderCalendar() {
    console.log("Starting renderCalendar...");
    const content = document.getElementById('content');
    const header = document.getElementById('header');

    // Load calendar data
    if (!calendarData) {
        const res = await fetch('dolmenwood-calendar.json');
        calendarData = await res.json();
    }

    // Load saved date
    loadDateState();

    // Initialize weather for current year if not present
    if (!currentDate.yearWeather || !currentDate.yearWeather[currentDate.year]) {
        generateYearWeather(currentDate.year);
    }

    // Initialize moon effects for current year if not present or invalid schema
    let moonDataInvalid = true;
    if (currentDate.yearMoonEffects && currentDate.yearMoonEffects[currentDate.year]) {
        // Check if data has new structure (e.g., month 1 has 'waxing' property)
        // We check month 1 (Obthryme is 11, strictly speaking we can just check the current month or any valid month)
        const checkMonth = currentDate.yearMoonEffects[currentDate.year][1] || currentDate.yearMoonEffects[currentDate.year][11];
        if (checkMonth && checkMonth.waxing) {
            moonDataInvalid = false;
        }
    }

    if (moonDataInvalid) {
        console.log("Regenerating moon effects (schema update)...");
        generateYearMoonEffects(currentDate.year);
    }

    // Ensure logs object exists
    if (!currentDate.logs) {
        currentDate.logs = {};
    }

    // Ensure customEvents exists (prevent crash on old data)
    if (!currentDate.customEvents) {
        currentDate.customEvents = [];
    }

    // Ensure activeSeasons exists (prevent crash on old data)
    if (!currentDate.activeSeasons) {
        currentDate.activeSeasons = [];
    }

    // Ensure current day has weather
    if (!getWeatherForDate(currentDate.year, currentDate.month, currentDate.day)) {
        const weather = rollWeather(calendarData.months[currentDate.month - 1]);
        setWeatherForDate(currentDate.year, currentDate.month, currentDate.day, weather);
    }

    // Set current weather and moon effect for display
    currentDate.weather = getWeatherForDate(currentDate.year, currentDate.month, currentDate.day);
    currentDate.moonEffect = getMoonEffectForDate(currentDate.year, currentDate.month, currentDate.day);
    saveDateState();

    const month = calendarData.months[currentDate.month - 1];
    const dayName = getDayName(currentDate.day, month);
    const moonPhase = getMoonPhase(month, currentDate.day);
    const daysUntilAzelach = getDaysUntil(11, 28);

    // Render header - show moon name from data
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-4);">
            <h1 class="header-title">📅 ${month.name} ${currentDate.day}, Year ${currentDate.year}</h1>
            <span class="day-name-badge">${dayName}</span>
            <span class="moon-badge">${moonPhase.icon} ${month.moonName || moonPhase.name}</span>
        </div>
        <div style="display: flex; gap: var(--space-2); align-items: center;">
            ${daysUntilAzelach > 0 ? `<span class="deadline-badge urgent">⚠️ Azelach: ${daysUntilAzelach} days</span>` : ''}
            <button class="btn btn-ghost" id="prev-month">◀</button>
            <button class="btn btn-ghost" id="next-month">▶</button>
        </div>
    `;

    // Render content
    try {
        console.log("Rendering body content...");
        content.innerHTML = `
            <div class="calendar-layout">
                <!-- Month Grid -->
                <div class="calendar-grid-container">
                    <div class="calendar-header-row">
                        <span class="season-badge" style="background: ${getSeasonColor(month.season)}">${month.season}</span>
                    </div>
                    
                    <!-- Week day headers -->
                    <div class="calendar-weekdays">
                        ${calendarData.weekDays.map(d => `<div class="weekday-header">${d}</div>`).join('')}
                    </div>
                    
                    <!-- Day grid -->
                    <div class="calendar-days" id="calendar-days">
                        ${renderDaysGrid(month)}
                    </div>
                    
                    <div class="calendar-legend">
                        <span>● New Moon</span>
                        <span>○ Full Moon</span>
                        <span class="legend-saint">★ Saint Feast</span>
                        <span class="legend-festival">◆ Festival</span>
                        <span class="legend-wysenday">■ Wysenday</span>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="calendar-sidebar">
                    <!-- Time Controls -->
                    <div class="card calendar-panel">
                        <div class="card-header">
                            <h3 class="card-title">🕐 Time Controls</h3>
                        </div>
                        <div class="card-body">
                            <div class="time-display">
                                <span class="current-time">${formatTime(currentDate.hour)}</span>
                            </div>
                            <div class="time-buttons">
                                <button class="time-btn" data-action="hour">+1 Hour</button>
                                <button class="time-btn" data-action="sunset">→ Sunset</button>
                                <button class="time-btn" data-action="dawn">→ Dawn</button>
                                <button class="time-btn" data-action="day">+1 Day</button>
                                <button class="time-btn" data-action="week">+1 Week</button>
                                <button class="time-btn" data-action="rest">Long Rest</button>
                            </div>
                        </div>
                    </div>

                    <!-- Weather Panel -->
                    <div class="card calendar-panel weather-panel">
                        <div class="card-header">
                            <h3 class="card-title">☁️ Today's Weather</h3>
                            <button class="btn btn-xs btn-ghost" id="roll-weather-btn">🎲 Re-roll</button>
                        </div>
                        <div class="card-body">
                            ${renderWeatherPanel()}
                        </div>
                    </div>

                    <!-- This Month's Events -->
                    <div class="card calendar-panel">
                        <div class="card-header">
                            <h3 class="card-title">🎉 Events This Month</h3>
                            <button class="btn btn-xs btn-ghost" id="copy-month-btn">📋 Copy</button>
                        </div>
                        <div class="card-body">
                            ${renderMonthEvents(month)}
                        </div>
                    </div>

                    <!-- Active Seasons -->
                    <div class="card calendar-panel">
                        <div class="card-header">
                            <h3 class="card-title">🌀 Special Seasons</h3>
                        </div>
                        <div class="card-body">
                            ${renderActiveSeasons()}
                        </div>
                    </div>

                    <!-- Upcoming Deadlines -->
                    <div class="card calendar-panel">
                        <div class="card-header">
                            <h3 class="card-title">⚠️ Deadlines</h3>
                            <button class="btn btn-xs btn-ghost" id="add-event-btn">+ Add</button>
                        </div>
                        <div class="card-body">
                            ${renderDeadlines()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Event Modal -->
            <div id="event-modal" class="modal hidden">
                <div class="modal-content" style="max-width: 350px;">
                    <div class="modal-header">
                        <h3>Add Event</h3>
                        <button class="btn btn-ghost modal-close" data-modal="event-modal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Event Name</label>
                            <input type="text" id="event-name" class="panel-input" placeholder="e.g., Azelach Deadline">
                        </div>
                        <div class="form-group">
                            <label>Month</label>
                            <select id="event-month" class="panel-select">
                                ${calendarData.months.map(m => `<option value="${m.id}" ${m.id === currentDate.month ? 'selected' : ''}>${m.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Day</label>
                            <input type="number" id="event-day" class="panel-input" value="${currentDate.day}" min="1" max="31">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select id="event-type" class="panel-select">
                                <option value="custom">Custom</option>
                                <option value="urgent">Urgent Deadline</option>
                                <option value="quest">Quest Related</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="save-event-btn" style="width: 100%;">Add Event</button>
                    </div>
                </div>
            </div>

            <!-- Day Detail Modal -->
            <div id="day-modal" class="modal hidden">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 id="day-modal-title">DATE</h3>
                        <button class="btn btn-ghost modal-close" data-modal="day-modal">✕</button>
                    </div>
                    <div class="modal-body" id="day-modal-body">
                        <!-- Dynamic Content -->
                    </div>
                    <div class="modal-footer">
                         <button class="btn btn-ghost" id="copy-day-btn">📋 Copy Day</button>
                         <button class="btn btn-primary modal-close" data-modal="day-modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        attachCalendarHandlers();
    } catch (err) {
        console.error("CRITICAL RENDER ERROR:", err);
        header.innerHTML += `<div style="background:red; color:white; padding:10px; margin-top:10px;">ERROR: ${err.message}</div>`;
    }
}

// ============================================
// RENDERING
// ============================================

function renderDaysGrid(month) {
    let html = '';
    const standardDays = 28; // 4 weeks of 7 days
    const wysendays = month.wysendays || [];
    const numWysendays = wysendays.length;

    // Render 4 standard weeks (28 days)
    for (let day = 1; day <= standardDays; day++) {
        const isToday = day === currentDate.day;
        const moon = getMoonPhase(month, day);
        const events = getEventsForDay(month, day);
        const customEvents = currentDate.customEvents.filter(e => e.month === currentDate.month && e.day === day);
        const significantEvents = events.filter(e => e.type !== 'wysenday');
        const hasUrgent = customEvents.some(e => e.type === 'urgent');

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (events.some(e => e.type === 'festival')) classes += ' has-festival';
        if (events.some(e => e.type === 'saint')) classes += ' has-saint';
        if (hasUrgent) classes += ' has-urgent';

        // Limit shown events to avoid overflow
        const displayEvents = [...significantEvents, ...customEvents].slice(0, 3);
        const moreCount = (significantEvents.length + customEvents.length) - displayEvents.length;

        html += `
            <div class="${classes}" data-day="${day}">
                <span class="day-number">${day}</span>
                <span class="moon-marker-daily" title="${moon.name}">${moon.icon}</span>
                ${events.length > 0 ? '<span class="event-marker">★</span>' : ''}
                ${customEvents.length > 0 ? '<span class="event-marker urgent">⚠</span>' : ''}
            </div>
        `;
    }

    // Render Wysendays (days 29, 30, 31 depending on month)
    for (let i = 0; i < numWysendays; i++) {
        const day = standardDays + 1 + i;
        const wysendayName = wysendays[i];
        const isToday = day === currentDate.day;
        const moon = getMoonPhase(month, day);
        const events = getEventsForDay(month, day);
        const customEvents = currentDate.customEvents.filter(e => e.month === currentDate.month && e.day === day);

        let classes = 'calendar-day wysenday';
        if (isToday) classes += ' today';
        if (events.some(e => e.type === 'festival')) classes += ' has-festival';
        if (customEvents.some(e => e.type === 'urgent')) classes += ' has-urgent';

        html += `
            <div class="${classes}" data-day="${day}" title="${wysendayName}">
                <span class="day-number">${day}</span>
                <span class="wysenday-name">${wysendayName.length > 8 ? wysendayName.substring(0, 7) + '…' : wysendayName}</span>
                <span class="moon-marker-daily" title="${moon.name}">${moon.icon}</span>
                ${events.some(e => e.type !== 'wysenday') ? '<span class="event-marker">★</span>' : ''}
                ${customEvents.length > 0 ? '<span class="event-marker urgent">⚠</span>' : ''}
            </div>
        `;
    }

    return html;
}

function renderMonthEvents(month) {
    const allEvents = [...month.events];
    const customForMonth = currentDate.customEvents.filter(e => e.month === currentDate.month);

    // Add moon events
    allEvents.push({ day: month.newMoon, name: 'New Moon', type: 'moon' });
    allEvents.push({ day: month.fullMoon, name: 'Full Moon', type: 'moon' });

    // Add custom events
    customForMonth.forEach(e => allEvents.push(e));

    // Sort by day
    allEvents.sort((a, b) => a.day - b.day);

    return allEvents.map(e => {
        const isPast = e.day < currentDate.day;
        const isToday = e.day === currentDate.day;
        return `
            <div class="event-item ${isPast ? 'past' : ''} ${isToday ? 'today' : ''} ${e.type === 'urgent' ? 'urgent' : ''}">
                <span class="event-day">${e.day}</span>
                <span class="event-name">${e.name}</span>
                <span class="event-type-badge ${e.type}">${e.type}</span>
            </div>
        `;
    }).join('');
}

function renderActiveSeasons() {
    if (currentDate.activeSeasons.length === 0) {
        return '<p class="empty-text">No special seasons active</p>';
    }

    return currentDate.activeSeasons.map(id => {
        const season = calendarData.specialSeasons[id];
        return `
            <div class="active-season" style="border-left: 3px solid ${season.color};">
                <div class="season-name">${season.name}</div>
                <div class="season-desc">${season.description}</div>
                <button class="btn btn-xs btn-ghost end-season-btn" data-season="${id}">End Season</button>
            </div>
        `;
    }).join('');
}

function renderDeadlines() {
    const deadlines = currentDate.customEvents.filter(e => e.type === 'urgent' || e.type === 'quest');

    if (deadlines.length === 0) {
        return '<p class="empty-text">No deadlines set</p>';
    }

    return deadlines.map(e => {
        const daysUntil = getDaysUntil(e.month, e.day);
        const monthName = calendarData.months[e.month - 1].name;
        return `
            <div class="deadline-item ${daysUntil <= 3 ? 'critical' : ''}">
                <div class="deadline-info">
                    <span class="deadline-name">${e.name}</span>
                    <span class="deadline-date">${monthName} ${e.day}</span>
                </div>
                <span class="deadline-countdown">${daysUntil > 0 ? `${daysUntil} days` : 'TODAY!'}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// DATE CALCULATIONS
// ============================================

function getDayName(day, month) {
    // Days 1-28 cycle through the week
    if (day <= 28) {
        const dayIndex = (day - 1) % 7;
        return calendarData.weekDays[dayIndex];
    }
    // Days 29+ are Wysendays
    const wysendays = month?.wysendays || [];
    const wysendayIndex = day - 29;
    if (wysendayIndex >= 0 && wysendayIndex < wysendays.length) {
        return wysendays[wysendayIndex] + ' (Wysenday)';
    }
    return 'Wysenday';
}

function getStartDayOfWeek(year, month) {
    // Simple calculation - can be adjusted for accuracy
    let totalDays = 0;
    for (let m = 1; m < month; m++) {
        totalDays += calendarData.months[m - 1].days;
    }
    totalDays += (year - 1) * 365; // Approximate
    return totalDays % 7;
}

function getMoonPhase(month, day) {
    const newMoon = month.newMoon;
    const fullMoon = month.fullMoon;

    // Simple phase calculation
    const cycleLength = 29;
    let daysSinceNew = (day - newMoon + 30) % 30;
    let phaseIndex = Math.floor((daysSinceNew / cycleLength) * 8) % 8;

    return {
        icon: MOON_PHASES[phaseIndex],
        name: MOON_NAMES[phaseIndex]
    };
}

function getEventsForDay(month, day) {
    return month.events.filter(e => e.day === day);
}

function getDaysUntil(targetMonth, targetDay) {
    if (targetMonth === currentDate.month) {
        return targetDay - currentDate.day;
    }

    let days = 0;
    // Days left in current month
    const currentMonthData = calendarData.months[currentDate.month - 1];
    days += currentMonthData.days - currentDate.day;

    // Full months between
    for (let m = currentDate.month + 1; m < targetMonth; m++) {
        days += calendarData.months[m - 1].days;
    }

    // Days in target month
    days += targetDay;

    return days;
}

function getSeasonColor(season) {
    const colors = {
        'Winter Onset': '#3B82F6',
        'Deep Winter': '#1E40AF',
        "Winter's Fading": '#60A5FA',
        'Spring Onset': '#10B981',
        'High Spring': '#34D399',
        "Spring's Fading": '#6EE7B7',
        'Summer Onset': '#F59E0B',
        'High Summer': '#FBBF24',
        "Summer's Fading": '#FCD34D',
        'Autumn Onset': '#DC2626',
        'Deep Autumn': '#B91C1C',
        "Autumn's Fading": '#F87171'
    };
    return colors[season] || '#6B7280';
}

function generateYearWeather(year) {
    if (!currentDate.yearWeather) currentDate.yearWeather = {};
    if (!currentDate.yearWeather[year]) currentDate.yearWeather[year] = {};

    calendarData.months.forEach(month => {
        currentDate.yearWeather[year][month.id] = {};
        for (let d = 1; d <= month.days; d++) {
            currentDate.yearWeather[year][month.id][d] = rollWeather(month);
        }
    });

    saveDateState();
}

function getWeatherForDate(year, month, day) {
    if (currentDate.yearWeather &&
        currentDate.yearWeather[year] &&
        currentDate.yearWeather[year][month]) {
        return currentDate.yearWeather[year][month][day];
    }
    return null;
}

function getMoonEffectForDate(year, monthId, day) {
    if (!currentDate.yearMoonEffects ||
        !currentDate.yearMoonEffects[year] ||
        !currentDate.yearMoonEffects[year][monthId]) {
        return null; // Should trigger generation if called from top level
    }

    const monthData = calendarData.months.find(m => m.id === parseInt(monthId));
    if (!monthData) return null;

    const fullMoon = monthData.fullMoon;
    const newMoon = monthData.newMoon;
    // Simple phase determination
    // Full Phase = Full Moon Day +/- 1
    // Waxing = After New Moon, Before Full Phase
    // Waning = Everything else (Pre-New Moon, Post-Full Phase)

    let phase = 'waning'; // Default

    // Check Full Phase (3 days center on Full Moon)
    if (day >= fullMoon - 1 && day <= fullMoon + 1) {
        phase = 'full';
    }
    // Check Waxing Phase
    // Starts at New Moon. Ends before Full Phase starts (fullMoon - 1)
    else if (day >= newMoon && day < fullMoon - 1) {
        phase = 'waxing';
    }
    // Waning is the rest (days < newMoon OR days > fullMoon + 1)

    // Retrieve the rolled sign for this phase
    const signName = currentDate.yearMoonEffects[year][monthId][phase];
    const effectDesc = MOON_SIGNS_DATA[signName][phase];

    return {
        sign: signName,
        phase: phase.charAt(0).toUpperCase() + phase.slice(1),
        desc: effectDesc,
        roll: 'N/A' // No specific daily roll anymore
    };
}

function setWeatherForDate(year, month, day, weather) {
    if (!currentDate.yearWeather) currentDate.yearWeather = {};
    if (!currentDate.yearWeather[year]) currentDate.yearWeather[year] = {};
    if (!currentDate.yearWeather[year][month]) currentDate.yearWeather[year][month] = {};

    currentDate.yearWeather[year][month][day] = weather;
    saveDateState();
}

function formatTime(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${period}`;
}

function renderWeatherPanel() {
    const weather = currentDate.weather;
    if (!weather) return '<p class="text-muted">No weather data</p>';

    const seasonName = weather.season.charAt(0).toUpperCase() + weather.season.slice(1);
    const hasEffects = weather.effects && weather.effects.length > 0;

    let effectsHtml = '';
    if (hasEffects) {
        effectsHtml = `
            <div class="weather-effects">
                ${weather.effects.map(e => {
            const effect = EFFECT_DESCRIPTIONS[e];
            return `
                        <div class="weather-effect" title="${effect.desc}">
                            <span class="effect-icon">${effect.icon}</span>
                            <span class="effect-name">${effect.name}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    return `
        <div class="weather-current">
            <div class="weather-desc">${weather.desc}</div>
            <div class="weather-meta">
                <span class="weather-season">${seasonName} weather</span>
                <span class="weather-roll">(rolled ${weather.roll})</span>
            </div>
        </div>
        ${effectsHtml}
    `;
}

function changeMonth(delta) {
    currentDate.month += delta;

    if (currentDate.month > 12) {
        currentDate.month = 1;
        currentDate.year++;
    } else if (currentDate.month < 1) {
        currentDate.month = 12;
        currentDate.year--;
    }

    // Clamp day to month's max
    const month = calendarData.months[currentDate.month - 1];
    if (currentDate.day > month.days) {
        currentDate.day = month.days;
    }

    saveDateState();
    renderCalendar();
}

// ============================================
// EVENT HANDLERS
// ============================================

function attachCalendarHandlers() {
    // Time buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => advanceTime(btn.dataset.action));
    });

    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month')?.addEventListener('click', () => changeMonth(1));

    // Day clicks
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            const dayNum = parseInt(day.dataset.day);
            if (dayNum) {
                openDayModal(currentDate.year, currentDate.month, dayNum);
            }
        });
    });

    // Modal closers
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal; // Use data attribute
            if (modalId) {
                document.getElementById(modalId).classList.add('hidden');
            } else {
                // Fallback for generic close
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            }
        });
    });

    // Add event modal
    document.getElementById('add-event-btn')?.addEventListener('click', () => {
        document.getElementById('event-modal').classList.remove('hidden');
    });

    document.getElementById('save-event-btn')?.addEventListener('click', () => {
        const name = document.getElementById('event-name').value;
        const month = parseInt(document.getElementById('event-month').value);
        const day = parseInt(document.getElementById('event-day').value);
        const type = document.getElementById('event-type').value;

        if (name && month && day) {
            currentDate.customEvents.push({ name, month, day, type });
            saveDateState();
            document.getElementById('event-modal').classList.add('hidden');
            renderCalendar();
            clipboard.showToast('Event added!');
        }
    });

    // End season buttons
    document.querySelectorAll('.end-season-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const seasonId = btn.dataset.season;
            currentDate.activeSeasons = currentDate.activeSeasons.filter(s => s !== seasonId);
            saveDateState();
            renderCalendar();
        });
    });

    // Copy Day Button
    document.getElementById('copy-day-btn')?.addEventListener('click', () => {
        // Revised approach: use data attributes we will add to openDayModal
        const container = document.querySelector('#day-modal .modal-content');
        const dYear = parseInt(container.dataset.year);
        const dMonth = parseInt(container.dataset.month);
        const dDay = parseInt(container.dataset.day);

        if (dYear && dMonth && dDay) {
            const summary = generateDailySummary(dYear, dMonth, dDay);
            clipboard.copyToClipboard(summary);
            clipboard.showToast('Day summary copied to clipboard!');
        } else {
            // Fallback
            const titleVal = document.getElementById('day-modal-title').innerText;
            clipboard.copyToClipboard(`**${titleVal}**\n\n${document.getElementById('day-modal-body').innerText}`);
            clipboard.showToast('Day details copied!');
        }
    });

    // Copy Month Button
    document.getElementById('copy-month-btn')?.addEventListener('click', () => {
        const summary = generateMonthlySummary(currentDate.year, currentDate.month);
        clipboard.copyToClipboard(summary);
        clipboard.showToast('Month summary copied to clipboard!');
    });

    // Log Actions (delegated)
    const modalBody = document.getElementById('day-modal-body');
    if (modalBody) {
        modalBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-log-btn')) {
                const input = document.querySelector('.log-input');
                const typeSelect = document.querySelector('.log-type-select');
                const day = e.target.dataset.day;
                const month = e.target.dataset.month;
                const year = e.target.dataset.year;

                if (input && input.value) {
                    addLogEntry(year, month, day, input.value, typeSelect.value);
                    // Refresh modal
                    openDayModal(year, month, day);
                }
            }

            if (e.target.classList.contains('delete-log-btn')) {
                const day = e.target.dataset.day;
                const month = e.target.dataset.month;
                const year = e.target.dataset.year;
                const index = e.target.dataset.index;

                deleteLogEntry(year, month, day, index);
                openDayModal(year, month, day);
            }

            if (e.target.classList.contains('set-active-day-btn')) {
                const day = parseInt(e.target.dataset.day);
                currentDate.day = day;
                saveDateState();
                renderCalendar();
                document.getElementById('day-modal').classList.add('hidden');
                clipboard.showToast(`Active day set to ${day}`);
            }
        });
    }

    // Roll weather button
    document.getElementById('roll-weather-btn')?.addEventListener('click', () => {
        currentDate.weather = rollWeather();
        saveDateState();
        renderCalendar();
        clipboard.showToast('Weather re-rolled!');
    });
}

function openDayModal(year, monthId, day) {
    const modal = document.getElementById('day-modal');
    const container = modal.querySelector('.modal-content');

    // Store context for actions
    container.dataset.year = year;
    container.dataset.month = monthId;
    container.dataset.day = day;

    const title = document.getElementById('day-modal-title');
    const body = document.getElementById('day-modal-body');

    // Get Data
    const month = calendarData.months.find(m => m.id === parseInt(monthId));
    const dayName = getDayName(day, month);
    const moon = getMoonPhase(month, day);
    const weather = getWeatherForDate(year, monthId, day) || { desc: "Unknown", effects: [] };
    const moonEffect = getMoonEffectForDate(year, monthId, day) || { sign: 'Unknown', phase: '', desc: 'No effect', roll: 0 };
    const dateKey = `${year}-${monthId}-${day}`;
    const logs = currentDate.logs[dateKey] || [];
    const events = getEventsForDay(month, day);
    const customEvents = currentDate.customEvents.filter(e => e.month === parseInt(monthId) && e.day === day);

    const allEvents = [...events, ...customEvents];
    if (day === month.newMoon) allEvents.push({ name: 'New Moon', type: 'moon' });
    if (day === month.fullMoon) allEvents.push({ name: 'Full Moon', type: 'moon' });

    title.innerText = `${month.name} ${day}, Year ${year} (${dayName})`;

    // Build Content
    let html = `
        <div class="day-modal-grid">
            <div class="day-info-section">
                <h4>🌙 Moon Phase</h4>
                <p class="modal-text">${moon.icon} ${month.moonName || moon.name}</p>
                
                <h4>✨ Moon Sign</h4>
                <div class="modal-weather" style="margin-bottom: var(--space-4);">
                    <p class="weather-desc-lg" style="font-size: 1.1rem; margin-bottom: 0.5rem;">${moonEffect.sign} (${moonEffect.phase})</p>
                    <p class="modal-text" style="font-size: 0.9rem;">${moonEffect.desc}</p>
                    <div class="weather-meta-sm" style="margin-top: 0.5rem;">
                        <span>Rolled: ${moonEffect.roll}</span>
                    </div>
                </div>

                <h4>☁️ Weather</h4>
                <div class="modal-weather">
                    <p class="weather-desc-lg">${weather.desc}</p>
                    <div class="weather-meta-sm">
                        <span class="badge badge-outline">${weather.season}</span>
                        <span>Rolled: ${weather.roll}</span>
                    </div>
                </div>
            </div>
            
            <div class="day-events-section">
                <h4>📜 Events</h4>
                ${allEvents.length === 0 ? '<p class="text-muted">No events</p>' :
            `<ul class="modal-event-list">
                    ${allEvents.map(e => `
                        <li class="modal-event-item ${e.type}">
                            <span class="badgex ${e.type === 'urgent' ? 'urgent' : ''}">${e.type === 'saint' ? 'Saint' : e.type === 'festival' ? 'Festival' : 'Event'}</span> 
                            ${e.name}
                            ${e.description ? `<br><small>${e.description}</small>` : ''}
                        </li>
                    `).join('')}
                   </ul>`
        }
            </div>
        </div>
        
        <hr class="modal-divider">
        
        <div class="day-logs-section">
            <h4>📝 Captain's Log</h4>
            <div class="log-list">
                ${logs.length === 0 ? '<p class="text-muted">No logs recorded.</p>' :
            logs.map((log, idx) => `
                    <div class="log-entry ${log.type}">
                        <div class="log-header">
                            <span class="log-type-badge ${log.type}">${log.type.toUpperCase()}</span>
                            <span class="log-time">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <button class="btn-xs delete-log-btn" data-year="${year}" data-month="${monthId}" data-day="${day}" data-index="${idx}">×</button>
                        </div>
                        <div class="log-text">${log.text}</div>
                    </div>
                  `).join('')
        }
            </div>
            
            <div class="add-log-form">
                <select class="log-type-select panel-select" style="width: auto;">
                    <option value="travel">Travel</option>
                    <option value="event">Event</option>
                    <option value="combat">Combat</option>
                    <option value="note">Note</option>
                </select>
                <input type="text" class="log-input panel-input" placeholder="Enter log entry...">
                <button class="btn btn-sm btn-primary add-log-btn" data-year="${year}" data-month="${monthId}" data-day="${day}">Add</button>
            </div>
        </div>
        
        <div class="day-actions-row">
            <button class="btn btn-sm btn-secondary set-active-day-btn" data-day="${day}">📅 Jump to this Day</button>
        </div>
    `;

    body.innerHTML = html;
    modal.classList.remove('hidden');
}

function addLogEntry(year, month, day, text, type) {
    const key = `${year}-${month}-${day}`;
    if (!currentDate.logs[key]) currentDate.logs[key] = [];

    currentDate.logs[key].push({
        text,
        type,
        timestamp: Date.now()
    });
    saveDateState();
}

function deleteLogEntry(year, month, day, index) {
    const key = `${year}-${month}-${day}`;
    if (currentDate.logs[key]) {
        currentDate.logs[key].splice(index, 1);
        saveDateState();
    }
}

// ============================================
// COPY GENERATORS
// ============================================

function generateDailySummary(year, monthId, day) {
    const month = calendarData.months.find(m => m.id === monthId);
    if (!month) return "Invalid Date";

    const dayName = getDayName(day, month);
    const moon = getMoonPhase(month, day);
    const weather = getWeatherForDate(year, monthId, day) || { desc: "Unknown", effects: [], roll: 0, season: "Unknown" };
    const events = getEventsForDay(month, day);
    const customEvents = currentDate.customEvents.filter(e => e.month === monthId && e.day === day);
    const dateKey = `${year}-${monthId}-${day}`;
    const logs = currentDate.logs[dateKey] || [];

    const allEvents = [...events, ...customEvents];
    if (day === month.newMoon) allEvents.push({ name: 'New Moon', type: 'moon' });
    if (day === month.fullMoon) allEvents.push({ name: 'Full Moon', type: 'moon' });

    let md = `📅 **${month.name} ${day}, Year ${year}** (${dayName})\n`;
    md += `🌙 ${moon.icon} ${month.moonName || moon.name}\n`;
    md += `☁️ **Weather:** ${weather.desc} (${weather.season}, Roll: ${weather.roll})\n`;
    if (weather.effects && weather.effects.length > 0) {
        md += `⚠️ **Effects:** ${weather.effects.map(e => EFFECT_DESCRIPTIONS[e].name).join(', ')}\n`;
    }

    md += `\n📜 **Events:**\n`;
    if (allEvents.length === 0) md += `- No events\n`;
    else allEvents.forEach(e => md += `- [${e.type.toUpperCase()}] ${e.name}\n`);

    md += `\n📝 **Log:**\n`;
    if (logs.length === 0) md += `- No logs recorded\n`;
    else logs.forEach(l => md += `- ${l.text}\n`);

    return md;
}

function generateMonthlySummary(year, monthId) {
    const month = calendarData.months.find(m => m.id === monthId);
    if (!month) return "Invalid Month";

    let md = `📅 **${month.name}, Year ${year}**\n`;
    md += `🌙 Moon: ${month.moonName}\n`;
    md += `🍂 Season: ${month.season}\n\n`;

    // Weather Summary
    md += `☁️ **Weather Overview:**\n`;
    const weatherList = [];
    if (currentDate.yearWeather && currentDate.yearWeather[year] && currentDate.yearWeather[year][monthId]) {
        const mWeather = currentDate.yearWeather[year][monthId];
        for (let d = 1; d <= month.days; d++) {
            if (mWeather[d]) {
                const flags = mWeather[d].effects ? mWeather[d].effects.join('') : '';
                weatherList.push(`Day ${d}: ${mWeather[d].desc} ${flags ? `[${flags}]` : ''}`);
            }
        }
    } else {
        weatherList.push("No weather data generated.");
    }

    md += weatherList.map(w => `- ${w}`).join('\n');

    md += `\n\n🎉 **Events Log:**\n`;
    const events = [...month.events];
    // Add custom events
    currentDate.customEvents.filter(e => e.month === monthId).forEach(e => events.push(e));
    events.sort((a, b) => a.day - b.day);

    if (events.length === 0) md += `- No events\n`;
    else events.forEach(e => md += `- Day ${e.day}: ${e.name} (${e.type})\n`);

    // Add logs
    md += `\n📝 **Month's Logs:**\n`;
    let logCount = 0;
    for (let d = 1; d <= month.days; d++) {
        const key = `${year}-${monthId}-${d}`;
        if (currentDate.logs[key] && currentDate.logs[key].length > 0) {
            md += `Day ${d}:\n`;
            currentDate.logs[key].forEach(l => {
                md += `  - [${l.type}] ${l.text}\n`;
                logCount++;
            });
        }
    }
    if (logCount === 0) md += `- No logs recorded this month\n`;

    return md;
}

// ============================================
// PERSISTENCE
// ============================================

function saveDateState() {
    localStorage.setItem('dnd_vault_calendar', JSON.stringify(currentDate));
}

function loadDateState() {
    const saved = localStorage.getItem('dnd_vault_calendar');
    if (saved) {
        try {
            currentDate = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load calendar state');
        }
    }
}

// ============================================
// TIME ADVANCEMENT
// ============================================

function advanceTime(action) {
    switch (action) {
        case 'hour':
            currentDate.hour++;
            if (currentDate.hour >= 24) {
                currentDate.hour = 0;
                advanceDay();
            }
            break;
        case 'sunset':
            if (currentDate.hour < 18) {
                currentDate.hour = 18;
            } else {
                currentDate.hour = 18;
                advanceDay();
            }
            break;
        case 'dawn':
            currentDate.hour = 6;
            advanceDay();
            break;
        case 'day':
            advanceDay();
            break;
        case 'week':
            for (let i = 0; i < 7; i++) advanceDay();
            break;
        case 'rest':
            currentDate.hour = 6;
            advanceDay();
            clipboard.showToast('Long rest completed! HP restored.');
            break;
    }

    saveDateState();
    renderCalendar();
}

function advanceDay() {
    const month = calendarData.months[currentDate.month - 1];
    currentDate.day++;

    if (currentDate.day > month.days) {
        currentDate.day = 1;
        currentDate.month++;

        if (currentDate.month > 12) {
            currentDate.month = 1;
            currentDate.year++;
        }
    }

    // If entering a new year, generate weather for it
    if (!currentDate.yearWeather || !currentDate.yearWeather[currentDate.year]) {
        generateYearWeather(currentDate.year);
    }

    // Update current weather object from stored yearly data
    currentDate.weather = getWeatherForDate(currentDate.year, currentDate.month, currentDate.day);

    // If somehow missing (e.g. data corruption), roll it
    if (!currentDate.weather) {
        currentDate.weather = rollWeather(calendarData.months[currentDate.month - 1]);
        setWeatherForDate(currentDate.year, currentDate.month, currentDate.day, currentDate.weather);
    }
}

// ============================================
// WEATHER SYSTEM
// ============================================

function getWeatherSeason(month = null) {
    // If month provided, use it (for pre-rolling)
    // If not, use current month
    const m = month || calendarData.months[currentDate.month - 1];

    // Start with base season
    // If we have a specific month passed in, we check if it matches "current" for active seasons
    // BUT for pre-rolling a whole year, we don't know future active seasons.
    // So distinct logic: 
    // 1. If generating for current day, respect activeSeasons.
    // 2. If generating for generic day, use base season.

    // If this is the current month/day, check active seasons
    const isCurrent = (m.id === currentDate.month);

    if (isCurrent) {
        if (currentDate.activeSeasons.includes('hitching')) return 'hitching';
        if (currentDate.activeSeasons.includes('vague')) return 'vague';
        if (currentDate.activeSeasons.includes('colliggwyld')) return 'spring';
        if (currentDate.activeSeasons.includes('chame')) return 'summer';
    }

    const sLower = m.season.toLowerCase();
    if (sLower.includes('winter')) return 'winter';
    if (sLower.includes('spring')) return 'spring';
    if (sLower.includes('summer')) return 'summer';
    if (sLower.includes('autumn')) return 'autumn';

    return 'winter'; // fallback
}

function rollWeather(month = null) {
    const season = getWeatherSeason(month);
    const table = WEATHER_TABLES[season] || WEATHER_TABLES['winter'];

    // Roll 2d6
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const roll = d1 + d2;

    const weather = table[roll] || table[7]; // Fallback to 7 (usually clear/average)

    return {
        season: season,
        roll: roll,
        desc: weather.desc,
        effects: weather.effects
    };
}

function generateYearMoonEffects(year) {
    if (!currentDate.yearMoonEffects) currentDate.yearMoonEffects = {};
    if (!currentDate.yearMoonEffects[year]) currentDate.yearMoonEffects[year] = {};

    calendarData.months.forEach(month => {
        // Roll one sign for each phase of this month
        currentDate.yearMoonEffects[year][month.id] = {
            waxing: MOON_SIGN_NAMES[Math.floor(Math.random() * MOON_SIGN_NAMES.length)],
            full: MOON_SIGN_NAMES[Math.floor(Math.random() * MOON_SIGN_NAMES.length)],
            waning: MOON_SIGN_NAMES[Math.floor(Math.random() * MOON_SIGN_NAMES.length)]
        };
    });

    saveDateState();
}
