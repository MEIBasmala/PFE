const appointmentsService = require('./appointments.service');

// Get Patient Appointments
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await appointmentsService.getPatientAppointments(req.user.id);
    const transformed = appointments.map(app => ({
      id: app.id,
      scheduledAt: new Date(`${app.slot.date.toISOString().split('T')[0]}T${app.slot.startTime}`).toISOString(),
      durationMinutes: (() => {
        const [sh, sm] = app.slot.startTime.split(':').map(Number);
        const [eh, em] = app.slot.endTime.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
      })(),
      status: app.status,
      jitsiLink: app.jitsiLink || null,
      notes: app.notes || null,
      nutritionist: {
        id: app.nutritionist.id,
        fullName: app.nutritionist.user.fullName,
      },
    }));
    res.status(200).json(transformed);  // plain array, no wrapper
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Nutritionist Appointments
const getNutritionistAppointments = async (req, res) => {
  try {
    const appointments = await appointmentsService.getNutritionistAppointments(req.user.id);
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Book Appointment
const bookAppointment = async (req, res) => {
  try {
    const appointment = await appointmentsService.bookAppointment(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Confirm Appointment
const confirmAppointment = async (req, res) => {
  try {
    const appointment = await appointmentsService.confirmAppointment(
      req.user.id,
      parseInt(req.params.id)
    );
    res.status(200).json({
      success: true,
      message: 'Appointment confirmed successfully',
      appointment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cancel Appointment
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await appointmentsService.cancelAppointment(
      req.user.id,
      parseInt(req.params.id),
      req.user.role
    );
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Complete Appointment
const completeAppointment = async (req, res) => {
  try {
    const appointment = await appointmentsService.completeAppointment(
      req.user.id,
      parseInt(req.params.id),
      req.body.notes
    );
    res.status(200).json({
      success: true,
      message: 'Appointment completed successfully',
      appointment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPatientAppointments,
  getNutritionistAppointments,
  bookAppointment,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
};