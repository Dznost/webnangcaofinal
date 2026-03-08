const Event = require("../models/Event")
const Branch = require("../models/Branch")
const Dish = require("../models/Dish")

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("branches").populate("dishes").sort({ startDate: -1 })
    res.render("admin/events/index", {
      title: "Quan Ly Su Kien",
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
    const dishes = await Dish.find({ available: true }).sort({ name: 1 })
    res.render("admin/events/form", {
      title: "Them Su Kien Moi",
      event: null,
      branches,
      dishes,
    })
  } catch (error) {
    console.error(error)
    res.redirect("/admin/events")
  }
}

// Helper: load form data
async function loadFormData() {
  const branches = await Branch.find().sort({ name: 1 })
  const dishes = await Dish.find({ available: true }).sort({ name: 1 })
  return { branches, dishes }
}

// Create new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, image, startDate, endDate, discount, discountScope, branches, dishes } = req.body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      const formData = await loadFormData()
      return res.render("admin/events/form", {
        title: "Them Su Kien Moi",
        event: null,
        ...formData,
        error: "Vui long dien day du thong tin bat buoc",
      })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      const formData = await loadFormData()
      return res.render("admin/events/form", {
        title: "Them Su Kien Moi",
        event: null,
        ...formData,
        error: "Ngay ket thuc phai sau ngay bat dau",
      })
    }

    // Parse arrays
    const branchesArray = Array.isArray(branches) ? branches : branches ? [branches] : []
    const dishesArray = Array.isArray(dishes) ? dishes : dishes ? [dishes] : []

    const scope = discountScope || "global"

    // Validate: branch scope must have at least 1 branch selected
    if (scope === "branch" && branchesArray.length === 0) {
      const formData = await loadFormData()
      return res.render("admin/events/form", {
        title: "Them Su Kien Moi",
        event: null,
        ...formData,
        error: "Vui long chon it nhat 1 chi nhanh khi chon giam gia theo chi nhanh",
      })
    }

    const eventData = {
      title: title.trim(),
      description: description?.trim() || "",
      image: image?.trim() || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
      startDate: start,
      endDate: end,
      discount: Math.max(0, Math.min(100, Number.parseFloat(discount) || 0)),
      discountScope: scope,
      branches: scope === "branch" ? branchesArray : [],
      dishes: dishesArray,
    }

    const event = new Event(eventData)
    await event.save()

    res.redirect("/admin/events?success=Them su kien thanh cong")
  } catch (error) {
    console.error("[restaurant] Error creating event:", error)
    const formData = await loadFormData()
    res.render("admin/events/form", {
      title: "Them Su Kien Moi",
      event: null,
      ...formData,
      error: "Loi khi tao su kien: " + error.message,
    })
  }
}

// Get edit event form
exports.getEditEventForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
    const formData = await loadFormData()
    res.render("admin/events/form", {
      title: "Chinh Sua Su Kien",
      event,
      ...formData,
    })
  } catch (error) {
    console.error(error)
    res.redirect("/admin/events")
  }
}

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, image, startDate, endDate, discount, discountScope, branches, dishes } = req.body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
      const formData = await loadFormData()
      return res.render("admin/events/form", {
        title: "Chinh Sua Su Kien",
        event,
        ...formData,
        error: "Vui long dien day du thong tin bat buoc",
      })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
      const formData = await loadFormData()
      return res.render("admin/events/form", {
        title: "Chinh Sua Su Kien",
        event,
        ...formData,
        error: "Ngay ket thuc phai sau ngay bat dau",
      })
    }

    // Parse arrays
    const branchesArray = Array.isArray(branches) ? branches : branches ? [branches] : []
    const dishesArray = Array.isArray(dishes) ? dishes : dishes ? [dishes] : []

    const scope = discountScope || "global"

    if (scope === "branch" && branchesArray.length === 0) {
      const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
      const formData = await loadFormData()
      return res.render("admin/events/form", {
        title: "Chinh Sua Su Kien",
        event,
        ...formData,
        error: "Vui long chon it nhat 1 chi nhanh khi chon giam gia theo chi nhanh",
      })
    }

    const updateData = {
      title: title.trim(),
      description: description?.trim() || "",
      image: image?.trim() || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
      startDate: start,
      endDate: end,
      discount: Math.max(0, Math.min(100, Number.parseFloat(discount) || 0)),
      discountScope: scope,
      branches: scope === "branch" ? branchesArray : [],
      dishes: dishesArray,
    }

    await Event.findByIdAndUpdate(req.params.id, updateData)
    res.redirect("/admin/events?success=Cap nhat thanh cong")
  } catch (error) {
    console.error("[restaurant] Error updating event:", error)
    const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
    const formData = await loadFormData()
    res.render("admin/events/form", {
      title: "Chinh Sua Su Kien",
      event,
      ...formData,
      error: "Loi khi cap nhat su kien: " + error.message,
    })
  }
}

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id)
    res.redirect("/admin/events?success=Xoa thanh cong")
  } catch (error) {
    console.error(error)
    res.redirect("/admin/events")
  }
}
