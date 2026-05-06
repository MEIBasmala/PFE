const inquiriesService = require('./inquiries.service');

const getMyInquiries = async (req, res) => {
  try {
    const inquiries = await inquiriesService.getMyInquiries(req.user.id);
    res.status(200).json({ success: true, inquiries });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await inquiriesService.getAllInquiries();
    res.status(200).json({ success: true, inquiries });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createInquiry = async (req, res) => {
  try {
    const inquiry = await inquiriesService.createInquiry(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully', inquiry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const replyToInquiry = async (req, res) => {
  try {
    const inquiry = await inquiriesService.replyToInquiry(
      req.user.id, parseInt(req.params.id), req.body.reply
    );
    res.status(200).json({ success: true, message: 'Reply sent successfully', inquiry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getMyInquiries, getAllInquiries, createInquiry, replyToInquiry };