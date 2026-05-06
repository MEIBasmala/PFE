const chatbotService = require('./chatbot.service');

//  Chat 
const chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    await chatbotService.chat(
      req.user.id,
      message,
      history || [],
      res
    );
  } catch (error) {
    if (!res.headersSent) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

//  Get Chat History 
const getChatHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const data = await chatbotService.getChatHistory(req.user.id, page, limit);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Get Chatbot Stats (Admin) 
const getChatbotStats = async (req, res) => {
  try {
    const stats = await chatbotService.getChatbotStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { chat, getChatHistory, getChatbotStats };