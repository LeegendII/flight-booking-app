// In-memory weather cache: city -> { timestamp, data }
const weatherCache = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Default high-fidelity weather templates for mock fallback
const mockWeatherTemplates = {
  'New York': {
    condition: 'Partly Cloudy',
    temp: 22,
    windSpeed: 14,
    humidity: 55,
    rainProb: 15,
    visibility: 10,
    icon: '02d',
    forecast: [
      { day: 'Monday', temp: 22, condition: 'Partly Cloudy', icon: '02d' },
      { day: 'Tuesday', temp: 24, condition: 'Sunny', icon: '01d' },
      { day: 'Wednesday', temp: 21, condition: 'Rainy', icon: '10d' },
      { day: 'Thursday', temp: 19, condition: 'Overcast', icon: '03d' },
      { day: 'Friday', temp: 20, condition: 'Sunny', icon: '01d' },
      { day: 'Saturday', temp: 23, condition: 'Sunny', icon: '01d' },
      { day: 'Sunday', temp: 22, condition: 'Partly Cloudy', icon: '02d' },
    ]
  },
  'London': {
    condition: 'Light Showers',
    temp: 16,
    windSpeed: 18,
    humidity: 82,
    rainProb: 75,
    visibility: 8,
    icon: '09d',
    forecast: [
      { day: 'Monday', temp: 16, condition: 'Light Showers', icon: '09d' },
      { day: 'Tuesday', temp: 15, condition: 'Heavy Rain', icon: '10d' },
      { day: 'Wednesday', temp: 17, condition: 'Overcast', icon: '04d' },
      { day: 'Thursday', temp: 18, condition: 'Partly Cloudy', icon: '02d' },
      { day: 'Friday', temp: 16, condition: 'Light Rain', icon: '10d' },
      { day: 'Saturday', temp: 19, condition: 'Sunny Spells', icon: '01d' },
      { day: 'Sunday', temp: 17, condition: 'Showers', icon: '09d' },
    ]
  },
  'Paris': {
    condition: 'Mild & Clear',
    temp: 19,
    windSpeed: 10,
    humidity: 60,
    rainProb: 10,
    visibility: 10,
    icon: '01d',
    forecast: [
      { day: 'Monday', temp: 19, condition: 'Clear', icon: '01d' },
      { day: 'Tuesday', temp: 21, condition: 'Sunny', icon: '01d' },
      { day: 'Wednesday', temp: 22, condition: 'Partly Cloudy', icon: '02d' },
      { day: 'Thursday', temp: 18, condition: 'Brief Showers', icon: '09d' },
      { day: 'Friday', temp: 17, condition: 'Overcast', icon: '03d' },
      { day: 'Saturday', temp: 20, condition: 'Sunny', icon: '01d' },
      { day: 'Sunday', temp: 21, condition: 'Clear', icon: '01d' },
    ]
  },
  'Dubai': {
    condition: 'Sunny & Hot',
    temp: 39,
    windSpeed: 12,
    humidity: 30,
    rainProb: 0,
    visibility: 10,
    icon: '01d',
    forecast: [
      { day: 'Monday', temp: 39, condition: 'Sunny', icon: '01d' },
      { day: 'Tuesday', temp: 40, condition: 'Sunny', icon: '01d' },
      { day: 'Wednesday', temp: 41, condition: 'Sunny', icon: '01d' },
      { day: 'Thursday', temp: 38, condition: 'Sunny', icon: '01d' },
      { day: 'Friday', temp: 39, condition: 'Sunny', icon: '01d' },
      { day: 'Saturday', temp: 40, condition: 'Sunny', icon: '01d' },
      { day: 'Sunday', temp: 42, condition: 'Sunny', icon: '01d' },
    ]
  },
  'Tokyo': {
    condition: 'Partly Cloudy',
    temp: 20,
    windSpeed: 8,
    humidity: 65,
    rainProb: 20,
    visibility: 10,
    icon: '02d',
    forecast: [
      { day: 'Monday', temp: 20, condition: 'Partly Cloudy', icon: '02d' },
      { day: 'Tuesday', temp: 19, condition: 'Overcast', icon: '03d' },
      { day: 'Wednesday', temp: 18, condition: 'Light Rain', icon: '10d' },
      { day: 'Thursday', temp: 21, condition: 'Sunny', icon: '01d' },
      { day: 'Friday', temp: 22, condition: 'Sunny', icon: '01d' },
      { day: 'Saturday', temp: 23, condition: 'Clear', icon: '01d' },
      { day: 'Sunday', temp: 20, condition: 'Partly Cloudy', icon: '02d' },
    ]
  }
};

// Suitability logic
const evaluateSuitability = (weather) => {
  const { temp, rainProb, windSpeed } = weather;
  if (rainProb > 60 || temp > 40 || temp < 0 || windSpeed > 40) {
    return { level: 'POOR', color: '🔴', text: 'Poor Weather' };
  } else if (rainProb > 30 || temp > 34 || temp < 10 || windSpeed > 25) {
    return { level: 'MODERATE', color: '🟡', text: 'Moderate Weather' };
  }
  return { level: 'EXCELLENT', color: '🟢', text: 'Excellent Weather' };
};

// Heuristics AI advice engine
const generateAdvice = (city, weather) => {
  const { condition, temp, rainProb, windSpeed, humidity } = weather;
  const advices = [];

  if (rainProb > 50) {
    advices.push(`Weather conditions in ${city} are expected to be rainy. Consider carrying waterproof clothing, durable footwear, and a compact umbrella.`);
  }
  if (temp > 35) {
    advices.push(`Temperatures in ${city} are extremely high (${temp}°C). Pack lightweight breathable clothing, sunscreen, sunglasses, and ensure you stay hydrated.`);
  }
  if (temp < 8) {
    advices.push(`It is quite cold in ${city} (${temp}°C). Make sure to pack warm layers, a heavy jacket, and thermal wear.`);
  }
  if (windSpeed > 30) {
    advices.push(`Strong winds are expected (${windSpeed} km/h). Secure lightweight luggage and expect possible flight alignment delays.`);
  }
  if (humidity > 80 && temp > 28) {
    advices.push(`High humidity will make the warm climate feel humid. Cotton clothing is highly recommended.`);
  }
  if (condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sunny')) {
    if (temp >= 18 && temp <= 28) {
      advices.push(`Perfect weather in ${city}! Ideal for outdoor touring, city walks, and open-air activities.`);
    }
  }

  // Fallback generic advice
  if (advices.length === 0) {
    advices.push(`Weather conditions in ${city} look stable. Standard travel layers are recommended.`);
  }

  return advices.join(' ');
};

// Fetch Weather controller
exports.getDestinationWeather = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: true, message: 'City parameter is required' });
    }

    const cached = weatherCache[city];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return res.json(cached.data);
    }

    let weatherData;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (apiKey) {
      try {
        // Fetch current weather
        const currentRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
        );
        const current = await currentRes.json();

        // Fetch 5-day / 3-hour forecast (extracting daily trends)
        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
        );
        const forecastObj = await forecastRes.json();

        if (current.cod === 200) {
          // Parse forecast to daily summary
          const dailyForecast = [];
          const list = forecastObj.list || [];
          // Group by days
          const daysMap = {};
          list.forEach(item => {
            const dateStr = item.dt_txt.split(' ')[0];
            const dateObj = new Date(dateStr);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'Long' });
            
            if (!daysMap[dayName]) {
              daysMap[dayName] = {
                tempSum: 0,
                count: 0,
                conditions: []
              };
            }
            daysMap[dayName].tempSum += item.main.temp;
            daysMap[dayName].count += 1;
            daysMap[dayName].conditions.push({ text: item.weather[0].main, icon: item.weather[0].icon });
          });

          Object.keys(daysMap).slice(0, 7).forEach(day => {
            const details = daysMap[day];
            const avgTemp = Math.round(details.tempSum / details.count);
            // Get most frequent condition
            const modeCondition = details.conditions[Math.floor(details.conditions.length / 2)];
            dailyForecast.push({
              day,
              temp: avgTemp,
              condition: modeCondition.text,
              icon: modeCondition.icon
            });
          });

          weatherData = {
            condition: current.weather[0].main,
            temp: Math.round(current.main.temp),
            windSpeed: Math.round(current.wind.speed * 3.6), // Convert m/s to km/h
            humidity: current.main.humidity,
            rainProb: current.rain ? (current.rain['1h'] || current.rain['3h'] || 10) * 10 : 10, // heuristic
            visibility: Math.round(current.visibility / 1000), // convert m to km
            icon: current.weather[0].icon,
            forecast: dailyForecast
          };
        }
      } catch (err) {
        console.warn(`OpenWeatherMap fetch failed, falling back to mock weather:`, err.message);
      }
    }

    // Fallback Mock generator if API call failed or wasn't configured
    if (!weatherData) {
      const template = mockWeatherTemplates[city] || {
        condition: 'Clear Sky',
        temp: 20,
        windSpeed: 10,
        humidity: 50,
        rainProb: 10,
        visibility: 10,
        icon: '01d',
        forecast: [
          { day: 'Monday', temp: 20, condition: 'Clear Sky', icon: '01d' },
          { day: 'Tuesday', temp: 21, condition: 'Clear Sky', icon: '01d' },
          { day: 'Wednesday', temp: 22, condition: 'Partly Cloudy', icon: '02d' },
          { day: 'Thursday', temp: 19, condition: 'Overcast', icon: '03d' },
          { day: 'Friday', temp: 20, condition: 'Clear Sky', icon: '01d' },
          { day: 'Saturday', temp: 22, condition: 'Clear Sky', icon: '01d' },
          { day: 'Sunday', temp: 21, condition: 'Clear Sky', icon: '01d' },
        ]
      };
      
      weatherData = { ...template };
    }

    // Evaluate suitability & advice
    weatherData.suitability = evaluateSuitability(weatherData);
    weatherData.advisory = generateAdvice(city, weatherData);

    // Save to Cache
    weatherCache[city] = {
      timestamp: Date.now(),
      data: weatherData
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather controller error:', error);
    res.status(500).json({ error: true, message: 'Server error retrieving weather forecast' });
  }
};
