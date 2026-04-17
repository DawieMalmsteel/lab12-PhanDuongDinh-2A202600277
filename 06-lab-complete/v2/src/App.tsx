/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSun, 
  CloudFog, 
  CloudDrizzle, 
  CloudSnow, 
  CloudRainWind, 
  CloudLightning,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Bot,
  User,
  Calendar
} from "lucide-react";
import { chatWithWeatherBot } from "./lib/gemini";
import { getWeatherDescription } from "./lib/weather";
import { cn } from "./lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  weatherData?: any;
}

const ICON_MAP: Record<string, any> = {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudSnow,
  CloudRainWind,
  CloudLightning
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      text: "Xin chào! Tôi là WeatherBot. Tôi có thể giúp bạn dự báo thời tiết ngày mai tại bất kỳ đâu. Bạn muốn xem thời tiết ở đâu?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const result = await chatWithWeatherBot(input, history);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      text: result.text || "Xin lỗi, tôi gặp chút trục trặc.",
      weatherData: result.data
    };

    setMessages(prev => [...prev, botMessage]);
    setLoading(false);
  };

  const WeatherCard = ({ data }: { data: any }) => {
    const { weather, location } = data;
    const { label, icon } = getWeatherDescription(weather.weatherCode);
    const WeatherIcon = ICON_MAP[icon] || Cloud;

    // Format date string carefully to avoid timezone shifts
    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const weekday = d.toLocaleDateString("vi-VN", { weekday: "long" });
      const formattedDate = d.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
      return `${weekday}, ${formattedDate}`;
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-4 p-6 rounded-2xl text-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Ngày mai, {formatDate(weather.date)}</div>
              <div className="text-xl font-bold">{label}</div>
            </div>
            <div className="text-5xl font-bold tracking-tight">{Math.round((weather.temperatureMax + weather.temperatureMin) / 2)}°C</div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-5">
            <div className="text-center">
              <div className="text-[10px] uppercase opacity-70 mb-1 font-bold tracking-widest">Độ ẩm</div>
              <div className="text-sm font-semibold">65%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase opacity-70 mb-1 font-bold tracking-widest">Sức gió</div>
              <div className="text-sm font-semibold">12 km/h</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase opacity-70 mb-1 font-bold tracking-widest">Chỉ số UV</div>
              <div className="text-sm font-semibold">Trung bình</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen max-w-7xl mx-auto overflow-hidden bg-white shadow-2xl md:my-10 md:rounded-[32px] md:h-[calc(100vh-80px)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 bg-slate-50 border-r border-slate-200 p-8 flex-col">
        <div className="flex items-center gap-3 text-blue-600 font-bold text-xl mb-12">
          <CloudSun className="w-8 h-8" />
          <span>SkyCast AI</span>
        </div>
        
        <nav className="space-y-8">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Vị trí lưu trữ</p>
            <div className="space-y-1">
              {["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ"].map((loc, i) => (
                <button 
                  key={loc}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-sm transition-all",
                    i === 0 ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Tùy chọn</p>
            <div className="space-y-1">
              {["Cảnh báo thời tiết", "Cài đặt"].map((opt) => (
                <button 
                  key={opt}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Hà Nội</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs text-slate-400 font-medium tracking-wide">Đang trực tuyến</span>
            </div>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar bg-white"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col max-w-[80%] md:max-w-[70%]",
                  message.role === "user" ? "ml-auto" : ""
                )}
              >
                <div className={cn(
                  "px-6 py-4 text-[15px] leading-relaxed",
                  message.role === "user" 
                    ? "bg-blue-600 text-white rounded-3xl rounded-br-md shadow-md" 
                    : "bg-slate-100 text-slate-800 rounded-3xl rounded-bl-md"
                )}>
                  {message.text}
                </div>
                {message.weatherData && (
                  <WeatherCard data={message.weatherData} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 p-4 bg-slate-100 w-20 rounded-full justify-center items-center"
            >
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </motion.div>
          )}
        </div>

        {/* Input */}
        <footer className="p-8 border-t border-slate-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Hỏi về thời tiết các tỉnh thành khác..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-6 pr-16 py-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm text-slate-600"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
