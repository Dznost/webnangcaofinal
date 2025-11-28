const Event = require("../models/Event")
const Branch = require("../models/Branch")
const Dish = require("../models/Dish")

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("branches").populate("dishes").sort({ startDate: -1 })
    res.render("admin/events/index", {
      title: "Quản Lý Sự Kiện",
      events,
      success: req.query.success,
    })
  } catch (error) {
    console.error(error)
    res.redirect("/admin")
  }
}

// Get new event form
exports.getNewEventForm = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 })
    const dishes = await Dish.find().sort({ name: 1 })
    res.render("admin/events/form", {
      title: "Thêm Sự Kiện Mới",
      event: null,
      branches,
      dishes,
    })
  } catch (error) {
    console.error(error)
    res.redirect("/admin/events")
  }
}

// Create new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, image, startDate, endDate, discount, discountType, isGlobal, branches, dishes } =
      req.body

    console.log("[restaurant] Creating event with data:", req.body)

    // Validate required fields
    if (!title || !startDate || !endDate) {
      const branchList = await Branch.find().sort({ name: 1 })
      const dishList = await Dish.find().sort({ name: 1 })
      return res.render("admin/events/form", {
        title: "Thêm Sự Kiện Mới",
        event: null,
        branches: branchList,
        dishes: dishList,
        error: "Vui lòng điền đầy đủ thông tin bắt buộc",
      })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      const branchList = await Branch.find().sort({ name: 1 })
      const dishList = await Dish.find().sort({ name: 1 })
      return res.render("admin/events/form", {
        title: "Thêm Sự Kiện Mới",
        event: null,
        branches: branchList,
        dishes: dishList,
        error: "Ngày kết thúc phải sau ngày bắt đầu",
      })
    }

    // Parse arrays
    const branchesArray = Array.isArray(branches) ? branches : branches ? [branches] : []
    const dishesArray = Array.isArray(dishes) ? dishes : dishes ? [dishes] : []

    // Build event data based on discount type
    const eventData = {
      title: title.trim(),
      description: description?.trim() || "",
      image: image?.trim() || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
      startDate: start,
      endDate: end,
      discount: Math.max(0, Math.min(100, Number.parseFloat(discount) || 0)),
      discountType: discountType || "none",
    }

    // Handle branch discount type
    if (discountType === "branch") {
      eventData.isGlobal = isGlobal === "on"
      eventData.branches = eventData.isGlobal ? [] : branchesArray
      eventData.dishes = []
    }
    // Handle dish discount type
    else if (discountType === "dish") {
      eventData.isGlobal = false
      eventData.branches = []
      eventData.dishes = dishesArray
    }
    // Handle no discount
    else {
      eventData.isGlobal = false
      eventData.branches = []
      eventData.dishes = []
    }

    console.log("[restaurant] Final event data:", eventData)

    const event = new Event(eventData)
    await event.save()

    console.log("[restaurant] Event created successfully:", event._id)
    res.redirect("/admin/events?success=Thêm sự kiện thành công")
  } catch (error) {
    console.error("[restaurant] Error creating event:", error)
    const branchList = await Branch.find().sort({ name: 1 })
    const dishList = await Dish.find().sort({ name: 1 })
    res.render("admin/events/form", {
      title: "Thêm Sự Kiện Mới",
      event: null,
      branches: branchList,
      dishes: dishList,
      error: "Lỗi khi tạo sự kiện: " + error.message,
    })
  }
}

// Get edit event form
exports.getEditEventForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
    const branches = await Branch.find().sort({ name: 1 })
    const dishes = await Dish.find().sort({ name: 1 })
    res.render("admin/events/form", {
      title: "Chỉnh Sửa Sự Kiện",
      event,
      branches,
      dishes,
    })
  } catch (error) {
    console.error(error)
    res.redirect("/admin/events")
  }
}

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, image, startDate, endDate, discount, discountType, isGlobal, branches, dishes } =
      req.body

    console.log("[restaurant] Updating event with data:", req.body)

    // Validate required fields
    if (!title || !startDate || !endDate) {
      const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
      const branchList = await Branch.find().sort({ name: 1 })
      const dishList = await Dish.find().sort({ name: 1 })
      return res.render("admin/events/form", {
        title: "Chỉnh Sửa Sự Kiện",
        event,
        branches: branchList,
        dishes: dishList,
        error: "Vui lòng điền đầy đủ thông tin bắt buộc",
      })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
      const branchList = await Branch.find().sort({ name: 1 })
      const dishList = await Dish.find().sort({ name: 1 })
      return res.render("admin/events/form", {
        title: "Chỉnh Sửa Sự Kiện",
        event,
        branches: branchList,
        dishes: dishList,
        error: "Ngày kết thúc phải sau ngày bắt đầu",
      })
    }

    // Parse arrays
    const branchesArray = Array.isArray(branches) ? branches : branches ? [branches] : []
    const dishesArray = Array.isArray(dishes) ? dishes : dishes ? [dishes] : []

    // Build update data
    const updateData = {
      title: title.trim(),
      description: description?.trim() || "",
      image: image?.trim() || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
      startDate: start,
      endDate: end,
      discount: Math.max(0, Math.min(100, Number.parseFloat(discount) || 0)),
      discountType: discountType || "none",
    }

    // Handle branch discount type
    if (discountType === "branch") {
      updateData.isGlobal = isGlobal === "on"
      updateData.branches = updateData.isGlobal ? [] : branchesArray
      updateData.dishes = []
    }
    // Handle dish discount type
    else if (discountType === "dish") {
      updateData.isGlobal = false
      updateData.branches = []
      updateData.dishes = dishesArray
    }
    // Handle no discount
    else {
      updateData.isGlobal = false
      updateData.branches = []
      updateData.dishes = []
    }

    console.log("[restaurant] Final update data:", updateData)

    await Event.findByIdAndUpdate(req.params.id, updateData)

    console.log("[restaurant] Event updated successfully")
    res.redirect("/admin/events?success=Cập nhật thành công")
  } catch (error) {
    console.error("[restaurant] Error updating event:", error)
    const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
    const branchList = await Branch.find().sort({ name: 1 })
    const dishList = await Dish.find().sort({ name: 1 })
    res.render("admin/events/form", {
      title: "Chỉnh Sửa Sự Kiện",
      event,
      branches: branchList,
      dishes: dishList,
      error: "Lỗi khi cập nhật sự kiện: " + error.message,
    })
  }
}

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id)
    res.redirect("/admin/events?success=Xóa thành công")
  } catch (error) {
    console.error(error)
    res.redirect("/admin/events")
  }
}
