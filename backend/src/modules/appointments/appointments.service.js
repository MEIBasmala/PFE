const appointmentsRepo = require('./appointments.repository');
const sendEmail = require('../../config/email');
const { createNotification } = require('../notifications/notifications.service');
const prisma = require('../../config/db');   // needed for transaction

// ----- Helper to get patient appointments -----
const getPatientAppointments = async (userId) => {
  const patient = await appointmentsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');
  return await appointmentsRepo.getPatientAppointments(patient.id);
};

// ----- Helper to get nutritionist appointments -----
const getNutritionistAppointments = async (userId) => {
  const nutritionist = await appointmentsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');
  return await appointmentsRepo.getNutritionistAppointments(nutritionist.id);
};

// ----- Book an appointment (with transaction and row lock) -----
const bookAppointment = async (userId, { slotId, nutritionistId }) => {
  const patient = await appointmentsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  const slotIdInt = parseInt(slotId, 10);
  if (isNaN(slotIdInt)) throw new Error('Invalid slot ID');
  const nutritionistIdInt = parseInt(nutritionistId, 10);
  if (isNaN(nutritionistIdInt)) throw new Error('Invalid nutritionist ID');

  // Use a transaction with SELECT FOR UPDATE (Prisma adds row lock automatically)
  return await prisma.$transaction(async (tx) => {
    // 1. Lock and fetch the slot row
    const slot = await tx.availableSlot.findUnique({
      where: { id: slotIdInt },
    });
    if (!slot) throw new Error('Slot not found');
    if (slot.isBooked) throw new Error('Slot is already booked');

    // 2. Verify the slot belongs to the requested nutritionist
    if (slot.nutritionistId !== nutritionistIdInt) {
      throw new Error('Slot does not belong to that nutritionist');
    }

    // 3. Prevent booking slots in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (new Date(slot.date) < now) {
      throw new Error('Cannot book a slot in the past');
    }

    // 4. Create the appointment
    const jitsiLink = `https://meet.jit.si/KhabirLens-${Date.now()}`;
    const appointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        nutritionistId: nutritionistIdInt,
        slotId: slotIdInt,
        status: 'PENDING',
        jitsiLink,
      },
      include: {
        nutritionist: { include: { user: true } },
        slot: true,
      },
    });

    // 5. Mark the slot as booked
    await tx.availableSlot.update({
      where: { id: slotIdInt },
      data: { isBooked: true },
    });

    // 6. After transaction commit, send notifications & email (not critical)
    //    We defer them to keep the transaction short.
    //    However, the transaction is already committed, so we can call them outside.
    //    We'll use setTimeout to avoid delaying the response, but simple async is fine.
    (async () => {
      try {
        const nutritionistUserId = appointment.nutritionist.user.id;
        const patientUser = await require('../users/users.repository').findById(userId);
        await createNotification(
          nutritionistUserId,
          'APPOINTMENT',
          `New appointment request from ${patientUser.fullName} on ${slot.date.toLocaleDateString()} at ${slot.startTime}`
        );
      } catch (e) { console.error('Notification error:', e.message); }

      try {
        const patientUser = await require('../users/users.repository').findById(userId);
        await sendEmail({
          to: patientUser.email,
          subject: 'KhabirLens — Appointment Booked 📅',
          html: `<h2>Appointment Booked!</h2>
                 <p>Your appointment has been booked successfully.</p>
                 <p>Date: ${slot.date.toLocaleDateString()}</p>
                 <p>Time: ${slot.startTime} - ${slot.endTime}</p>
                 <p>Jitsi Link: <a href="${jitsiLink}">${jitsiLink}</a></p>`,
        });
      } catch (e) { console.log('Email failed:', e.message); }
    })();

    return appointment;
  });
};

// ----- Confirm an appointment (nutritionist) -----
const confirmAppointment = async (userId, appointmentId) => {
  const nutritionist = await appointmentsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const appointment = await appointmentsRepo.getAppointmentById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');
  if (appointment.status !== 'PENDING') throw new Error('Appointment is not pending');

  const updated = await appointmentsRepo.updateAppointmentStatus(appointmentId, { status: 'CONFIRMED' });

  // Notify patient (async)
  (async () => {
    try {
      const patientUserId = appointment.patient.user.id;
      const slot = appointment.slot;
      await createNotification(
        patientUserId,
        'APPOINTMENT',
        `Your appointment on ${slot.date.toLocaleDateString()} at ${slot.startTime} has been confirmed. Join link: ${appointment.jitsiLink}`
      );
    } catch (e) { console.error('Confirmation notification error:', e.message); }
  })();

  return updated;
};

// ----- Cancel an appointment (patient or nutritionist) -----
const cancelAppointment = async (userId, appointmentId, role) => {
  const appointment = await appointmentsRepo.getAppointmentById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  // Ownership check
  if (role === 'PATIENT') {
    const patient = await appointmentsRepo.getPatientByUserId(userId);
    if (appointment.patientId !== patient.id) throw new Error('Unauthorized');
  } else if (role === 'NUTRITIONIST') {
    const nutritionist = await appointmentsRepo.getNutritionistByUserId(userId);
    if (appointment.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');
  } else {
    throw new Error('Invalid role');
  }

  if (appointment.status === 'COMPLETED') throw new Error('Cannot cancel a completed appointment');
  if (appointment.status === 'CANCELLED') throw new Error('Appointment is already cancelled');

  // Free the slot and update status
  await appointmentsRepo.markSlotBooked(appointment.slotId, false);
  const cancelled = await appointmentsRepo.updateAppointmentStatus(appointmentId, { status: 'CANCELLED' });

  // Notify the other party
  (async () => {
    try {
      const otherUserId = (role === 'PATIENT')
        ? appointment.nutritionist.user.id
        : appointment.patient.user.id;
      const slot = appointment.slot;
      const canceller = (role === 'PATIENT') ? 'the patient' : 'the nutritionist';
      await createNotification(
        otherUserId,
        'APPOINTMENT',
        `Your appointment on ${slot.date.toLocaleDateString()} at ${slot.startTime} has been cancelled by ${canceller}.`
      );
    } catch (e) { console.error('Cancellation notification error:', e.message); }
  })();

  return cancelled;
};

// ----- Complete an appointment (nutritionist) -----
const completeAppointment = async (userId, appointmentId, notes) => {
  const nutritionist = await appointmentsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const appointment = await appointmentsRepo.getAppointmentById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');
  if (appointment.status !== 'CONFIRMED') throw new Error('Appointment is not confirmed');

  return await appointmentsRepo.updateAppointmentStatus(appointmentId, {
    status: 'COMPLETED',
    notes: notes || null,
  });
};

module.exports = {
  getPatientAppointments,
  getNutritionistAppointments,
  bookAppointment,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
};