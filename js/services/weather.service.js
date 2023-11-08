const gWeatherOptions = [   // not need for paid subscription
    { desc: "Clear Sky", image: "https://openweathermap.org/img/wn/01d@2x.png" }, // שמיים בהירים
    { desc: "Few Clouds", image: "https://openweathermap.org/img/wn/02n@2x.png" }, // מעט עננים
    { desc: "Scattered Clouds", image: "https://openweathermap.org/img/wn/03n@2x.png" }, // עננים מפוזרים
    { desc: "Broken Clouds", image: "https://openweathermap.org/img/wn/04d@2x.png" }, // עננים שבורים
    { desc: "Overcast Clouds", image: "https://openweathermap.org/img/wn/04d@2x.png" }, // עננים מעוננים
    { desc: "Light Rain", image: "https://openweathermap.org/img/wn/10n@2x.png" }, // גשם קל
    { desc: "Moderate Rain", image: "https://openweathermap.org/img/wn/09n@2x.png" }, // גשם בינוני
    { desc: "Heavy Rain", image: "https://openweathermap.org/img/wn/11n@2x.png" }, // גשם כבד
    { desc: "Light Snow", image: "https://openweathermap.org/img/wn/13n@2x.png" }, // שלג קל
    { desc: "Moderate Snow", image: "https://openweathermap.org/img/wn/13n@2x.png" }, // שלג בינוני
    { desc: "Heavy Snow", image: "https://openweathermap.org/img/wn/13n@2x.png" }, // שלג כבד
    { desc: "Light Drizzle", image: "https://openweathermap.org/img/wn/09n@2x.png" }, // טפטוף קל
    { desc: "Moderate Drizzle", image: "https://openweathermap.org/img/wn/09n@2x.png" }, // טפטוף בינוני
    { desc: "Heavy Drizzle", image: "https://openweathermap.org/img/wn/09n@2x.png" }, // טפטוף כבד
    { desc: "Light Thunderstorm", image: "https://openweathermap.org/img/wn/11d@2x.png" }, // סערה קלה
    { desc: "Moderate Thunderstorm", image: "https://openweathermap.org/img/wn/11d@2x.png" }, // סערה בינונית
    { desc: "Heavy Thunderstorm", image: "https://openweathermap.org/img/wn/11d@2x.png" }, // סערה כבדה
    { desc: "Light Rain Showers", image: "https://openweathermap.org/img/wn/09n@2x.png" }, // גשם רעות קל
    { desc: "Moderate Rain Showers", image: "https://openweathermap.org/img/wn/09n@2x.png" }, // גשם רעות בינוני
    { desc: "Heavy Rain Showers", image: "https://openweathermap.org/img/wn/09n@2x.png" }, // גשם רעות כבד
    { desc: "Light Snow Showers", image: "https://openweathermap.org/img/wn/13n@2x.png" }, // רעידות שלג קלות
    { desc: "Moderate Snow Showers", image: "https://openweathermap.org/img/wn/13n@2x.png" }, // רעידות שלג בינוניות
    { desc: "Heavy Snow Showers", image: "https://openweathermap.org/img/wn/13n@2x.png" }, // רעידות שלג כבדות
    { desc: "Fog", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // ערפל
    { desc: "Mist", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // אדם
    { desc: "Smoke", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // עשר
    { desc: "Haze", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // אובך
    { desc: "Dust", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // אבק
    { desc: "Sand", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // חול
    { desc: "Dust and Sand Whirls", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // סערות אבק וחול
    { desc: "Tornado", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // טורנדו
    { desc: "Squalls", image: "https://openweathermap.org/img/wn/50n@2x.png" }, // סערות
    { desc: "Clear Sky (Night)", image: "https://openweathermap.org/img/wn/01n@2x.png" }, // שמיים בהירים (לילה)
    { desc: "Few Clouds (Night)", image: "https://openweathermap.org/img/wn/02n@2x.png" }, // מעט עננים (לילה)
    { desc: "Scattered Clouds (Night)", image: "https://openweathermap.org/img/wn/03n@2x.png" }, // עננים מפוזרים (לילה)
    { desc: "Broken Clouds (Night)", image: "https://openweathermap.org/img/wn/04n@2x.png" }, // עננים שבורים (לילה)
    { desc: "Overcast Clouds (Night)", image: "https://openweathermap.org/img/wn/04n@2x.png" }, // עננים מעוננים (לילה)
];

export const weatherService = {
    getPlaceWeather,
    gWeatherOptions
}

const API_KEY = 'b7e444e58d9eb9844a6f379e978361f3' 

async function getPlaceWeather(pos) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${API_KEY}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Weather data request failed with status: ${response.status}`);
        }

        const data = await response.json();
        const temperature = data.main.temp;
        const description = data.weather[0].description;
        const city = data.name;

        return {
            temperature: {
                Kelvin: temperature,
                celsius: temperature - 273.15,
                fahrenheit: (temperature - 273.15) * 1.8 + 32,
                range: {        // not available for free subscription
                    from: (temperature - 273.15 - 1),
                    to: (temperature - 273.15 + 1)
                },
                wind: 4.6       // not available for free subscription
            },
            description: description,
            city: city
        };
    } catch (error) {
        throw new Error(error);
    }
}

