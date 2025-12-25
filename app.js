const THRESHOLDS = {
  tempMin: 10,
  windMax: 10,
  precipMax: 2,
  radiusKm: 40,
};

const translations = {
  no: {
    eyebrow: "Golfvaer",
    title: "Finn golfvaer der du er",
    subtitle: "Vi henter vaer og viser om det er gode forhold for golf.",
    statusLabel: "Dagens vurdering",
    useLocation: "Bruk min posisjon",
    radiusHint: "Soker 40 km rundt deg",
    searchPlaceholder: "Sok etter sted (fallback)",
    searchButton: "Sok",
    coursesTitle: "Golfbaner i naerheten",
    forecastTitle: "7-dagers vaer",
    footerNote: "Vaerdata fra met.no. Golfbaner fra OpenStreetMap.",
    statusIdleTitle: "Velg en bane",
    statusIdleMessage: "Bruk posisjon for a finne golfbaner i naerheten.",
    statusLoading: "Henter data ...",
    statusGolf: "Golfvaer i dag",
    statusNoGolf: "Ikke golfvaer i dag",
    statusError: "Noe gikk galt. Prov igjen.",
    statusLocationDenied: "Kunne ikke hente posisjon.",
    coursesMeta: "Funnet {count} baner innen {radius} km.",
    coursesEmpty: "Ingen golfbaner funnet. Prov et annet sted.",
    selectCourse: "Se vaer",
    distanceKm: "{value} km unna",
    dayLabel: "{day}",
    forecastGood: "Golfvaer",
    forecastBad: "Ikke golfvaer",
    defaultCourseName: "Golfbane",
  },
  en: {
    eyebrow: "Golf weather",
    title: "Find golf weather near you",
    subtitle: "We fetch forecasts and show if conditions suit golf.",
    statusLabel: "Today",
    useLocation: "Use my location",
    radiusHint: "Searching 40 km around you",
    searchPlaceholder: "Search for place (fallback)",
    searchButton: "Search",
    coursesTitle: "Nearby golf courses",
    forecastTitle: "7-day forecast",
    footerNote: "Weather data from met.no. Courses from OpenStreetMap.",
    statusIdleTitle: "Pick a course",
    statusIdleMessage: "Use your location to find nearby golf courses.",
    statusLoading: "Loading data ...",
    statusGolf: "Golf weather today",
    statusNoGolf: "Not golf weather today",
    statusError: "Something went wrong. Try again.",
    statusLocationDenied: "Could not get your location.",
    coursesMeta: "Found {count} courses within {radius} km.",
    coursesEmpty: "No golf courses found. Try another place.",
    selectCourse: "See weather",
    distanceKm: "{value} km away",
    dayLabel: "{day}",
    forecastGood: "Golf weather",
    forecastBad: "Not golf weather",
    defaultCourseName: "Golf course",
  },
};

const elements = {
  statusTitle: document.getElementById("statusTitle"),
  statusMessage: document.getElementById("statusMessage"),
  heroIcon: document.getElementById("heroIcon"),
  coursesList: document.getElementById("coursesList"),
  coursesMeta: document.getElementById("coursesMeta"),
  forecastGrid: document.getElementById("forecastGrid"),
  geoButton: document.getElementById("geoButton"),
  searchButton: document.getElementById("searchButton"),
  searchInput: document.getElementById("searchInput"),
  langToggle: document.getElementById("langToggle"),
};

let currentLang = "no";
let userLocation = null;
let courses = [];
let selectedCourse = null;
let latestForecast = [];

function t(key, vars = {}) {
  const text = translations[currentLang][key] || "";
  return Object.keys(vars).reduce(
    (acc, varKey) => acc.replace(`{${varKey}}`, vars[varKey]),
    text
  );
}

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });
  if (selectedCourse && latestForecast.length) {
    renderCourses();
    renderForecast(latestForecast);
    updateStatusFromForecast();
  } else {
    updateStatusIdle();
    renderCourses();
    renderForecast([]);
  }
}

function toggleLanguage() {
  setLanguage(currentLang === "no" ? "en" : "no");
}

function updateStatusIdle() {
  setStatus(t("statusIdleTitle"), t("statusIdleMessage"), "--");
}

function setStatus(title, message, icon) {
  elements.statusTitle.textContent = title;
  elements.statusMessage.textContent = message;
  elements.heroIcon.textContent = icon;
}

function updateStatusFromForecast() {
  if (!selectedCourse || !latestForecast.length) {
    updateStatusIdle();
    return;
  }
  const today = latestForecast[0];
  const statusTitle = today.isGolf ? t("statusGolf") : t("statusNoGolf");
  const statusMessage = `${selectedCourse.name} · ${formatSummary(
    today.temp,
    today.wind,
    today.precip
  )}`;
  setStatus(statusTitle, statusMessage, today.icon);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function requestGeolocation() {
  setStatus(t("statusIdleTitle"), t("statusLoading"), "...");
  if (!navigator.geolocation) {
    setStatus(t("statusIdleTitle"), t("statusLocationDenied"), "!");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      loadCourses();
    },
    () => {
      setStatus(t("statusIdleTitle"), t("statusLocationDenied"), "!");
    }
  );
}

async function searchLocation() {
  const query = elements.searchInput.value.trim();
  if (!query) {
    return;
  }
  setStatus(t("statusIdleTitle"), t("statusLoading"), "...");
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=1&accept-language=${currentLang}`;
  try {
    const results = await fetchJson(url);
    if (!results.length) {
      setStatus(t("statusIdleTitle"), t("coursesEmpty"), "!");
      return;
    }
    userLocation = {
      lat: Number(results[0].lat),
      lon: Number(results[0].lon),
    };
    loadCourses();
  } catch (error) {
    setStatus(t("statusIdleTitle"), t("statusError"), "!");
  }
}

async function loadCourses() {
  if (!userLocation) {
    return;
  }
  elements.coursesMeta.textContent = t("statusLoading");
  elements.coursesList.innerHTML = "";
  elements.forecastGrid.innerHTML = "";

  const radiusMeters = THRESHOLDS.radiusKm * 1000;
  const query = `[out:json];(node["leisure"="golf_course"](around:${radiusMeters},${userLocation.lat},${userLocation.lon});way["leisure"="golf_course"](around:${radiusMeters},${userLocation.lat},${userLocation.lon});relation["leisure"="golf_course"](around:${radiusMeters},${userLocation.lat},${userLocation.lon}););out center tags;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
    query
  )}`;

  try {
    const data = await fetchJson(url);
    courses = (data.elements || [])
      .map((element) => {
        const lat = element.lat || (element.center && element.center.lat);
        const lon = element.lon || (element.center && element.center.lon);
        if (lat == null || lon == null) {
          return null;
        }
        return {
          id: element.id,
          name: element.tags && element.tags.name ? element.tags.name : t("defaultCourseName"),
          lat,
          lon,
        };
      })
      .filter(Boolean)
      .map((course) => ({
        ...course,
        distanceKm: haversineKm(userLocation.lat, userLocation.lon, course.lat, course.lon),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    renderCourses();
    if (courses.length) {
      selectCourse(courses[0]);
    } else {
      setStatus(t("statusIdleTitle"), t("coursesEmpty"), "--");
    }
  } catch (error) {
    setStatus(t("statusIdleTitle"), t("statusError"), "!");
  }
}

function renderCourses() {
  if (!userLocation) {
    elements.coursesMeta.textContent = t("statusIdleMessage");
    elements.coursesList.innerHTML = "";
    return;
  }
  elements.coursesMeta.textContent = t("coursesMeta", {
    count: courses.length,
    radius: THRESHOLDS.radiusKm,
  });
  elements.coursesList.innerHTML = "";

  if (!courses.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "course-item";
    emptyItem.textContent = t("coursesEmpty");
    elements.coursesList.appendChild(emptyItem);
    return;
  }

  courses.forEach((course) => {
    const li = document.createElement("li");
    li.className = "course-item";
    const title = document.createElement("strong");
    title.textContent = course.name;
    const distance = document.createElement("span");
    distance.className = "muted";
    distance.textContent = t("distanceKm", {
      value: course.distanceKm.toFixed(1),
    });
    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = t("selectCourse");
    button.addEventListener("click", () => selectCourse(course));
    li.append(title, distance, button);
    elements.coursesList.appendChild(li);
  });
}

async function selectCourse(course) {
  selectedCourse = course;
  setStatus(course.name, t("statusLoading"), "...");
  try {
    const weather = await fetchWeather(course.lat, course.lon);
    const daily = buildDailyForecast(weather);
    latestForecast = daily;
    renderForecast(latestForecast);
    if (!latestForecast.length) {
      setStatus(course.name, t("statusError"), "!");
      return;
    }
    updateStatusFromForecast();
  } catch (error) {
    setStatus(course.name, t("statusError"), "!");
  }
}

async function fetchWeather(lat, lon) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  const data = await fetchJson(url);
  return data.properties && data.properties.timeseries
    ? data.properties.timeseries
    : [];
}

function buildDailyForecast(timeseries) {
  const byDate = new Map();
  timeseries.forEach((entry) => {
    const dateKey = entry.time.split("T")[0];
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
    }
    byDate.get(dateKey).push(entry);
  });

  const dates = Array.from(byDate.keys()).slice(0, 7);
  return dates.map((dateKey) => {
    const entries = byDate.get(dateKey);
    const best = pickClosestHour(entries, 12);
    const details = best.data && best.data.instant && best.data.instant.details;
    const temp = details ? details.air_temperature : null;
    const wind = details ? details.wind_speed : null;
    const precip =
      best.data.next_6_hours?.details?.precipitation_amount ??
      best.data.next_1_hours?.details?.precipitation_amount ??
      0;
    const symbol =
      best.data.next_1_hours?.summary?.symbol_code ??
      best.data.next_6_hours?.summary?.symbol_code ??
      best.data.next_12_hours?.summary?.symbol_code ??
      "unknown";

    const isGolf =
      temp != null &&
      wind != null &&
      temp >= THRESHOLDS.tempMin &&
      wind <= THRESHOLDS.windMax &&
      precip <= THRESHOLDS.precipMax;

    return {
      dateKey,
      temp,
      wind,
      precip,
      isGolf,
      icon: symbolToLabel(symbol),
    };
  });
}

function renderForecast(days) {
  elements.forecastGrid.innerHTML = "";
  if (!days.length) {
    return;
  }
  days.forEach((day) => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    const title = document.createElement("h4");
    title.textContent = formatDayLabel(day.dateKey);
    const icon = document.createElement("div");
    icon.textContent = day.icon;
    const stats = document.createElement("p");
    stats.className = "muted";
    stats.textContent = formatSummary(day.temp, day.wind, day.precip);
    const verdict = document.createElement("strong");
    verdict.textContent = day.isGolf ? t("forecastGood") : t("forecastBad");
    card.append(title, icon, stats, verdict);
    elements.forecastGrid.appendChild(card);
  });
}

function pickClosestHour(entries, targetHour) {
  return entries.reduce((closest, current) => {
    const currentHour = new Date(current.time).getHours();
    const closestHour = new Date(closest.time).getHours();
    return Math.abs(currentHour - targetHour) < Math.abs(closestHour - targetHour)
      ? current
      : closest;
  }, entries[0]);
}

function formatDayLabel(dateKey) {
  const locale = currentLang === "no" ? "nb-NO" : "en-GB";
  return new Date(dateKey).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSummary(temp, wind, precip) {
  const tempText = temp != null ? Math.round(temp) : "--";
  const windText = wind != null ? wind.toFixed(1) : "--";
  const precipText = precip != null ? precip.toFixed(1) : "--";
  return `${tempText}C · ${windText} m/s · ${precipText} mm`;
}

function symbolToLabel(symbol) {
  const base = symbol.split("_")[0];
  const map = {
    clearsky: "SUN",
    fair: "SUN",
    partlycloudy: "SUN/CLOUD",
    cloudy: "CLOUD",
    rainshowers: "RAIN",
    rain: "RAIN",
    heavyrain: "HEAVY RAIN",
    lightsnow: "SNOW",
    snow: "SNOW",
    sleet: "SLEET",
    fog: "FOG",
    thunderstorm: "STORM",
  };
  return map[base] || "VAR";
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
}

elements.geoButton.addEventListener("click", requestGeolocation);
elements.searchButton.addEventListener("click", searchLocation);
elements.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchLocation();
  }
});
elements.langToggle.addEventListener("click", toggleLanguage);

setLanguage(currentLang);
