// import api from '../config/api';

// export const chatApi = {
//   /**
//    * Sends a message to the AI and gets a structured JSON response back
//    */
//   async sendMessage(message) {
//     try {
//       const response = await api.post('/chat', { message });
//       return response.data;
//     } catch (error) {
//       console.error('AI Chat Error:', error);
//       throw error;
//     }
//   }
// };



import api from '../config/api';

export const chatApi = {
  async sendMessage(message) {
    try {
      const response = await api.post(
        '/api/chat',
        { message }
      );

      return response.data;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }
};

