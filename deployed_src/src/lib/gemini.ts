/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { getCoordinates, getTomorrowWeather } from "./weather";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getWeatherFunctionDeclaration: FunctionDeclaration = {
  name: "getWeatherForLocation",
  description: "Lấy thông tin thời tiết ngày mai cho một địa điểm cụ thể.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "Tên thành phố hoặc địa điểm (ví dụ: Hà Nội, TP.HCM, Đà Lạt)",
      },
    },
    required: ["location"],
  },
};

export async function chatWithWeatherBot(message: string, history: any[] = []) {
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `Bạn là một chatbot chuyên dự báo thời tiết. Hôm nay là ${today}. Bạn thân thiện, chuyên nghiệp và luôn cố gắng cung cấp thông tin chính xác nhất cho ngày mai. Nếu người dùng hỏi về thời tiết, hãy sử dụng công cụ 'getWeatherForLocation'. Luôn trả lời bằng tiếng Việt.`,
        tools: [{ functionDeclarations: [getWeatherFunctionDeclaration] }],
      },
      // Removed toolConfig as it's not needed for simple function calling handled client-side
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "getWeatherForLocation") {
        const { location } = call.args as { location: string };
        const coords = await getCoordinates(location);
        
        if (!coords) {
          return {
            text: `Xin lỗi, tôi không tìm thấy địa điểm "${location}". Bạn có thể kiểm tra lại tên địa điểm được không?`,
            data: null
          };
        }

        const weather = await getTomorrowWeather(coords.latitude, coords.longitude);
        
        if (!weather) {
          return {
            text: `Xin lỗi, tôi không thể lấy dữ liệu thời tiết cho ${coords.name} vào lúc này.`,
            data: null
          };
        }

        // Send tool results back to Gemini to get a natural language response
        const modelResponseContent = response.candidates[0].content;
        const secondResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...history,
            { role: "user", parts: [{ text: message }] },
            modelResponseContent,
            {
              role: "user",
              parts: [{ 
                functionResponse: {
                  name: "getWeatherForLocation",
                  response: {
                    location: coords.name,
                    country: coords.country,
                    ...weather
                  }
                }
              }]
            }
          ],
          config: {
            systemInstruction: "Bạn là một chatbot chuyên dự báo thời tiết. Hãy giải thích dữ liệu thời tiết ngày mai một cách thân thiện. Nhắc nhở người dùng mang theo ô hoặc áo khoác nếu cần.",
          }
        });

        return {
          text: secondResponse.text,
          data: {
            location: coords,
            weather: weather
          }
        };
      }
    }

    return {
      text: response.text,
      data: null
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "Đã có lỗi xảy ra khi kết nối với bộ não AI của tôi. Vui lòng thử lại sau.",
      data: null
    };
  }
}
