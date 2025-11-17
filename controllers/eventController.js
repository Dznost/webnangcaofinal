const Event = require("../models/Event");
const Branch = require("../models/Branch");

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("branches").sort({ startDate: -1 });
    res.render("admin/events/index", { 
      title: "Quản Lý Sự Kiện", 
      events,
      success: req.query.success 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin");
  }
};

// Get new event form
exports.getNewEventForm = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    res.render("admin/events/form", { 
      title: "Thêm Sự Kiện Mới", 
      event: null,
      branches 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/events");
  }
};

// Create new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, image, startDate, endDate, discount, isGlobal, branches } = req.body;
    
    // Parse branches array from form
    const branchesArray = Array.isArray(branches) ? branches : (branches ? [branches] : []);
    
    const eventData = {
      title,
      description,
      image,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      discount: parseFloat(discount) || 0,
      isGlobal: isGlobal === 'on',
      branches: isGlobal === 'on' ? [] : branchesArray
    };
    
    const event = new Event(eventData);
    await event.save();
    res.redirect("/admin/events?success=Thêm sự kiện thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/events");
  }
};

// Get edit event form
exports.getEditEventForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("branches");
    const branches = await Branch.find().sort({ name: 1 });
    res.render("admin/events/form", { 
      title: "Chỉnh Sửa Sự Kiện", 
      event,
      branches 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/events");
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, image, startDate, endDate, discount, isGlobal, branches } = req.body;
    
    // Parse branches array from form
    const branchesArray = Array.isArray(branches) ? branches : (branches ? [branches] : []);
    
    const updateData = {
      title,
      description,
      image,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      discount: parseFloat(discount) || 0,
      isGlobal: isGlobal === 'on',
      branches: isGlobal === 'on' ? [] : branchesArray
    };
    
    await Event.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/admin/events?success=Cập nhật thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/events");
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect("/admin/events?success=Xóa thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/events");
  }
};
