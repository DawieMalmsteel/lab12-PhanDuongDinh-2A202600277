/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeatherData {
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  precipitation: number;
  date: string;
}

export interface LocationInfo {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

export async function getCoordinates(location: string): Promise<LocationInfo | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        location
      )}&count=1&language=vi&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        country: result.country,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function getTomorrowWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
    );
    const data = await response.json();
    
    // Tomorrow is the second element in the daily arrays (index 1)
    if (data.daily && data.daily.time && data.daily.time.length > 1) {
      return {
        date: data.daily.time[1],
        temperatureMax: data.daily.temperature_2m_max[1],
        temperatureMin: data.daily.temperature_2m_min[1],
        weatherCode: data.daily.weather_code[1],
        precipitation: data.daily.precipitation_sum[1],
      };
    }
    return null;
  } catch (error) {
    console.error("Weather API error:", error);
    return null;
  }
}

export function getWeatherDescription(code: number): { label: string; icon: string; bgClass: string } {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) return { label: "Trời trong xanh", icon: "Sun", bgClass: "bg-blue-400" };
  if (code >= 1 && code <= 3) return { label: "Ít mây / U ám", icon: "CloudSun", bgClass: "bg-blue-300" };
  if (code >= 45 && code <= 48) return { label: "Sương mù", icon: "CloudFog", bgClass: "bg-gray-400" };
  if (code >= 51 && code <= 55) return { label: "Mưa phùn", icon: "CloudDrizzle", bgClass: "bg-blue-200" };
  if (code >= 61 && code <= 67) return { label: "Mưa", icon: "CloudRain", bgClass: "bg-blue-500" };
  if (code >= 71 && code <= 77) return { label: "Tuyết", icon: "CloudSnow", bgClass: "bg-white" };
  if (code >= 80 && code <= 82) return { label: "Mưa rào", icon: "CloudRainWind", bgClass: "bg-blue-600" };
  if (code >= 95 && code <= 99) return { label: "Giông bão", icon: "CloudLightning", bgClass: "bg-indigo-700" };
  
  return { label: "Cập nhật sau", icon: "Cloud", bgClass: "bg-gray-300" };
}
