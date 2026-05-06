const inquiriesRepo = require('./inquiries.repository');
const usersRepo = require('../users/users.repository');
const sendEmail = require('../../config/email');

const getMyInquiries = async (userId) => {
  const patient = await inquiriesRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');
  return await inquiriesRepo.getPatientInquiries(patient.id);
};

const getAllInquiries = async () => {
  return await inquiriesRepo.getAllInquiries();
};

const createInquiry = async (userId, { subject, message }) => {
  const patient = await inquiriesRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  return await inquiriesRepo.createInquiry({
    patientId: patient.id,
    subject,
    message,
    status: 'UNREAD',
  });
};

const replyToInquiry = async (userId, inquiryId, reply) => {
  const admin = await inquiriesRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const inquiry = await inquiriesRepo.getInquiryById(inquiryId);
  if (!inquiry) throw new Error('Inquiry not found');

  const result = await inquiriesRepo.replyToInquiry(inquiryId, admin.id, reply);

  // ── Email notification ─────────────────────────────────────
  try {
    // inquiry.patientId is the Patient record ID — use getPatientById, not getPatientByUserId
    const patient = await inquiriesRepo.getPatientById(inquiry.patientId);
    const email = patient?.user?.email;

    if (email) {
      await sendEmail({
        to: email,
        subject: 'KhabirLens — Reply to your inquiry',
        html: `<h2>Your inquiry has been answered</h2>
               <p><strong>Subject:</strong> ${escapeHtml(inquiry.subject)}</p>
               <p><strong>Reply:</strong> ${escapeHtml(reply)}</p>`,
      });
    }
  } catch (e) {
    console.log('Email failed:', e.message);
  }

  return result;
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { getMyInquiries, getAllInquiries, createInquiry, replyToInquiry };